package controller

import (
	"zilla-backend/model"
	"zilla-backend/storage"
	"zilla-backend/utils"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func AddProjectInvite(c *fiber.Ctx) error {
	fromUserId := utils.GetIdFromJwt(c)

	var toUser model.User
	if c.BodyParser(&toUser) != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	projectID := uint(c.QueryInt("projectId"))

	if projectID == 0 {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	db := storage.GetConn()

	var userProject model.UserProject
	res := db.Where("project_id = ?", projectID).Where("user_id = ?", fromUserId).First(&userProject)
	if res.Error != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	var role model.Role
	db.First(&role, userProject.RoleID)

	if role.Title != "owner" {
		return c.SendStatus(fiber.StatusForbidden)
	}

	invitation := model.Invitation{FromID: fromUserId, ToID: toUser.ID, ProjectID: projectID}

	if db.Save(&invitation).Error != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	return c.SendStatus(fiber.StatusOK)
}

func AddGroupInvite(c *fiber.Ctx) error {
	fromUserId := utils.GetIdFromJwt(c)

	var toUser model.User
	if c.BodyParser(&toUser) != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	groupID := uint(c.QueryInt("groupId"))

	if groupID == 0 {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	db := storage.GetConn()

	invitation := model.Invitation{FromID: fromUserId, ToID: toUser.ID, GroupID: groupID}

	if db.Save(&invitation).Error != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	return c.SendStatus(fiber.StatusOK)
}

func GetInvitations(c *fiber.Ctx) error {
	userID := utils.GetIdFromJwt(c)
	invitations := []model.Invitation{}

	db := storage.GetConn()
	res := db.Where("to_id = ?", userID).Find(&invitations)
	if res.Error != nil {
		if res.Error == gorm.ErrRecordNotFound {
			return c.JSON(nil)
		}
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	result := []fiber.Map{}
	var (
		project  model.Project
		group    model.Group
		fromUser model.User
	)
	for _, invitation := range invitations {
		if invitation.ProjectID != 0 {
			project.ID = invitation.ProjectID
			db.First(&project)
		} else {
			group.ID = invitation.GroupID
			db.First(&group)
		}
		fromUser.ID = invitation.FromID
		db.First(&fromUser)
		if fromUser.IsDeleted || fromUser.IsDisabled {
			continue
		}
		result = append(result, fiber.Map{
			"fromUser": fromUser,
			"project":  project,
			"group":    group,
			"details":  invitation,
		})
		group.ID, project.ID = 0, 0
	}

	return c.JSON(result)
}

func HandleInvite(c *fiber.Ctx) error {
	invID, err := c.ParamsInt("inviteID")
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	userID := utils.GetIdFromJwt(c)
	inviteID := uint(invID)
	action := string(c.BodyRaw())

	db := storage.GetConn()

	var invitation model.Invitation
	db.First(&invitation, inviteID)

	if action == "accept" {
		if invitation.GroupID == 0 {
			var devRole model.Role
			db.Where("project_id = ?", invitation.ProjectID).Where("title = 'dev'").First(&devRole)

			userProject := model.UserProject{
				ProjectID: invitation.ProjectID,
				UserID:    userID,
				RoleID:    devRole.ID,
			}
			db.Save(&userProject)
		} else {
			userGroup := model.UserGroup{
				GroupID: invitation.GroupID,
				UserID:  userID,
			}
			db.Save(&userGroup)
		}
	}

	if db.Delete(&invitation).Error != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}
	return c.SendStatus(fiber.StatusOK)
}
