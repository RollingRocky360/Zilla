package controller

import (
	"log"
	ia "zilla-backend/enums/access"
	"zilla-backend/model"
	"zilla-backend/storage"
	"zilla-backend/utils"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func GetProject(c *fiber.Ctx) error {
	pID, err := c.ParamsInt("projectID")
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	projectID := uint(pID)
	db := storage.GetConn()

	project := model.Project{}
	res := db.First(&project, projectID)

	if res.Error != nil {
		if res.Error == gorm.ErrRecordNotFound {
			return c.SendStatus(fiber.StatusBadRequest)
		}
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	return c.JSON(project)
}

func CreateProject(c *fiber.Ctx) error {
	var project model.Project
	c.BodyParser(&project)

	userID := utils.GetIdFromJwt(c)
	project.Creator = userID
	project.Color = utils.RandColorHex()

	v := validator.New()
	err := v.Struct(project)

	if err != nil {
		return c.SendStatus(fiber.StatusUnprocessableEntity)
	}

	db := storage.GetConn()
	if db.Save(&project).Error != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	newDefaultRoles := []model.Role{
		{Title: "owner", ProjectID: project.ID, IssueAccess: ia.View | ia.Create | ia.Edit | ia.Delete, Color: "#FF0000"},
		{Title: "lead", ProjectID: project.ID, IssueAccess: ia.View | ia.Create | ia.Edit, Color: "#00FF00"},
		{Title: "dev", ProjectID: project.ID, IssueAccess: ia.View, Color: "#0000FF"},
	}

	if db.Save(&newDefaultRoles).Error != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	newUserProject := model.UserProject{UserID: userID, RoleID: newDefaultRoles[0].ID, ProjectID: project.ID}
	if db.Save(&newUserProject).Error != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	var creator model.User
	db.Where("id = ?", project.Creator).First(&creator)

	utils.PopulateUser(&creator)
	return c.JSON(fiber.Map{
		"ID":          project.ID,
		"title":       project.Title,
		"description": project.Description,
		"creator":     creator,
		"color":       project.Color,
	})
}

func GetProjects(c *fiber.Ctx) error {
	userID := utils.GetIdFromJwt(c)

	db := storage.GetConn()
	rows, err := db.Model(&model.Project{}).Select("projects.id").Joins(
		"join user_projects on user_projects.project_id = projects.id",
	).Where("user_projects.user_id = ?", userID).Rows()
	defer rows.Close()

	if err != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	var (
		project model.Project
		creator model.User
		result  []fiber.Map
	)
	for rows.Next() {
		rows.Scan(&project.ID)
		db.First(&project)
		db.Where("id = ?", project.Creator).First(&creator)
		utils.PopulateUser(&creator)
		result = append(result, fiber.Map{
			"ID":          project.ID,
			"title":       project.Title,
			"description": project.Description,
			"creator":     creator,
			"color":       project.Color,
		})
	}

	if len(result) == 0 {
		return c.JSON([]model.Project{})
	}

	return c.JSON(result)
}

func GetUserOfProject(c *fiber.Ctx) error {
	projectID := uint(c.QueryInt("projectID"))
	email := c.Query("email")
	log.Println(email, projectID)
	if email == "" || projectID == 0 {
		log.Println("No Query params")
		return c.SendStatus(fiber.StatusBadRequest)
	}

	db := storage.GetConn()

	var user model.User
	res := db.Where("email like ?", email).First(&user)

	if res.Error != nil {
		if res.Error == gorm.ErrRecordNotFound {
			return c.JSON(nil)
		}
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	var userProject model.UserProject
	res = db.Where("project_id = ?", projectID).Where("user_id = ?", user.ID).First(&userProject)
	if res.Error != nil {
		if res.Error == gorm.ErrRecordNotFound {
			return c.JSON(nil)
		}
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	if user.IsDeleted || user.IsDisabled {
		return c.JSON(nil)
	}

	return c.JSON(user)
}

func AddGroupToProject(c *fiber.Ctx) error {
	userID := utils.GetIdFromJwt(c)
	pID, err := c.ParamsInt("projectID")
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	projectID := uint(pID)
	roleID := uint(c.QueryInt("roleID"))
	groupID := uint(c.QueryInt("groupID"))

	if projectID == 0 || roleID == 0 || groupID == 0 {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	db := storage.GetConn()

	var group model.Group
	if db.First(&group, groupID).Error != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	if group.CreatorID != userID {
		return c.SendStatus(fiber.StatusForbidden)
	}

	var userProject model.UserProject
	res := db.Where("project_id = ?", projectID).Where("user_id = ?", userID).First(&userProject)
	if res.Error != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	var role model.Role
	db.First(&role, userProject.RoleID)

	if role.Title != "owner" {
		return c.SendStatus(fiber.StatusForbidden)
	}

	projectGroup := model.ProjectGroup{
		ProjectID: projectID,
		GroupID:   groupID,
		RoleID:    roleID,
	}

	if db.Save(&projectGroup).Error != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	return c.JSON(fiber.Map{
		"role":         role,
		"group":        group,
		"projectGroup": projectGroup,
	})
}
