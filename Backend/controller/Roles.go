package controller

import (
	"strconv"
	ia "zilla-backend/enums/access"
	"zilla-backend/model"
	"zilla-backend/storage"
	"zilla-backend/utils"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func AddRole(c *fiber.Ctx) error {
	var (
		role    model.Role
		project model.Project
	)

	userId := utils.GetIdFromJwt(c)
	c.BodyParser(&role)

	db := storage.GetConn()
	res := db.Where("id = ?", role.ProjectID).First(&project)
	if res.Error != nil {
		if res.Error == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusBadRequest).SendString(res.Error.Error())
		}
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	if project.Creator != userId {
		return c.SendStatus(fiber.StatusForbidden)
	}

	role.IssueAccess = role.IssueAccess | ia.View
	role.Color = utils.RandColorHex()
	db.Save(&role)
	return c.JSON(role)
}

func DeleteRole(c *fiber.Ctx) error {
	var (
		project model.Project
		role    model.Role
	)

	userId := utils.GetIdFromJwt(c)
	roleID, _ := strconv.Atoi(c.Params("ID"))
	role.ID = uint(roleID)

	db := storage.GetConn()
	db.First(&role)
	res := db.Where("id = ?", role.ProjectID).First(&project)
	if res.Error != nil {
		if res.Error == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusBadRequest).SendString(res.Error.Error())
		}
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	if project.Creator != userId {
		return c.SendStatus(fiber.StatusForbidden)
	}

	var devRole model.Role
	db.Where("project_id = ?", project.ID).Where("title = 'dev'").First(&devRole)

	db.Model(&model.UserProject{}).Where("project_id = ?", project.ID).Where("role_id = ?", roleID).Update("role_id", devRole.ID)
	db.Delete(&model.Role{}, roleID)
	return c.SendStatus(fiber.StatusOK)
}

func GetProjectRoles(c *fiber.Ctx) error {
	projectID := uint(c.QueryInt("projectID"))

	if projectID == 0 {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	var roles []model.Role

	db := storage.GetConn()
	res := db.Where("project_id = ?", projectID).Find(&roles)

	if res.Error != nil {
		if res.Error == gorm.ErrRecordNotFound {
			return c.JSON([]model.Role{})
		}
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	return c.JSON(roles)
}

func GetUserRole(c *fiber.Ctx) error {
	userID := utils.GetIdFromJwt(c)
	projectID := uint(c.QueryInt("projectID"))

	if projectID == 0 {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	db := storage.GetConn()
	var userProject model.UserProject
	res := db.Where("project_id = ?", projectID).Where("user_id = ?", userID).First(&userProject)
	if res.Error == gorm.ErrRecordNotFound {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	role := model.Role{}
	db.First(&role, userProject.RoleID)

	return c.JSON(role)
}
