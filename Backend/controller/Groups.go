package controller

import (
	"log"
	"net/url"
	"zilla-backend/model"
	"zilla-backend/storage"
	"zilla-backend/utils"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func CreateGroup(c *fiber.Ctx) error {
	userID := utils.GetIdFromJwt(c)
	title := string(c.BodyRaw())

	db := storage.GetConn()
	group := model.Group{Title: title, CreatorID: userID}
	group.Color = utils.RandColorHex()
	if db.Save(&group).Error != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	userGroup := model.UserGroup{
		GroupID: group.ID,
		UserID:  userID,
	}
	db.Save(&userGroup)

	return c.JSON(group)
}

func GetAllGroups(c *fiber.Ctx) error {
	userID := utils.GetIdFromJwt(c)

	db := storage.GetConn()

	userGroups := model.UserGroup{}
	groups := []model.Group{}
	rows, err := db.Model(&userGroups).Where("user_id = ?", userID).Select("group_id").Rows()
	defer rows.Close()

	if err != nil {
		log.Println(err.Error())
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	var (
		groupID uint
		group   model.Group
	)
	for rows.Next() {
		rows.Scan(&groupID)
		db.First(&group, groupID)
		groups = append(groups, group)
		group.ID = 0
	}

	if rows.Err() != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	return c.JSON(groups)
}

func GetGroupMembers(c *fiber.Ctx) error {
	gID, err := c.ParamsInt("groupID")
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	db := storage.GetConn()

	groupID := uint(gID)
	var group model.Group
	res := db.First(&group, groupID)

	if res.Error != nil {
		log.Println(err.Error())
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	var (
		users []model.User
		user  model.User
	)
	rows, err := db.Model(&model.UserGroup{}).Where("group_id = ?", groupID).Select("user_id").Rows()
	defer rows.Close()

	if err != nil {
		log.Println(err.Error())
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	for rows.Next() {
		rows.Scan(&user.ID)
		db.First(&user)
		utils.PopulateUser(&user)
		users = append(users, user)
	}

	if rows.Err() != nil {
		log.Println(rows.Err())
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	return c.JSON(fiber.Map{
		"group": group,
		"users": users,
	})
}

func GetAllProjectGroups(c *fiber.Ctx) error {
	pID, err := c.ParamsInt("projectID")
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	projecID := uint(pID)
	db := storage.GetConn()

	var projectGroups []model.ProjectGroup
	if db.Where("project_id =?", projecID).Find(&projectGroups).Error != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	result := []fiber.Map{}
	var (
		group model.Group
		role  model.Role
	)
	for _, projectGroup := range projectGroups {
		db.First(&group, projectGroup.GroupID)
		db.First(&role, projectGroup.RoleID)
		result = append(result, fiber.Map{
			"role":         role,
			"group":        group,
			"projectGroup": projectGroup,
		})
	}

	return c.JSON(result)
}

func SearchUserGroups(c *fiber.Ctx) error {
	term, err := url.QueryUnescape(c.Query("term"))
	log.Println(term)
	if err != nil {
		log.Println(err.Error())
		return c.SendStatus(fiber.StatusBadRequest)
	}

	db := storage.GetConn()
	userID := utils.GetIdFromJwt(c)

	var group model.Group
	res := db.Where("creator_id = ?", userID).Where("title LIKE ?", term).First(&group)

	if res.Error != nil {
		if res.Error == gorm.ErrRecordNotFound {
			return c.JSON(nil)
		}
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	return c.JSON(group)
}
