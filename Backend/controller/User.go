package controller

import (
	"log"
	"zilla-backend/model"
	"zilla-backend/storage"
	"zilla-backend/utils"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func SearchUserByEmail(c *fiber.Ctx) error {
	var user model.User
	email := c.Query("email")

	if email == "" {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	db := storage.GetConn()
	res := db.Where("email LIKE ?", email).First(&user)

	if res.Error != nil {
		if res.Error == gorm.ErrRecordNotFound {
			return c.JSON(nil)
		}
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	if user.ID == utils.GetIdFromJwt(c) {
		return c.JSON(nil)
	}

	return c.JSON(user)
}

func GetUser(c *fiber.Ctx) error {
	uID, err := c.ParamsInt("userID")
	if err != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	userID := uint(uID)
	db := storage.GetConn()

	var user model.User
	db.First(&user, userID)

	if user.IsDeleted {
		return c.JSON(fiber.Map{
			"deleted": true,
			"ID":      user.ID,
		})
	}

	if user.IsDisabled {
		return c.JSON(fiber.Map{
			"disabled": true,
			"ID":       user.ID,
		})
	}

	return c.JSON(user)
}

func AbleUser(c *fiber.Ctx) error {
	userID := utils.GetIdFromJwt(c)
	action := c.Params("action")
	if action == "" {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	var set bool
	if action == "enable" {
		set = false
	} else if action == "disable" {
		set = true
	} else {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	db := storage.GetConn()

	if err := db.Model(&model.User{}).
		Where("id = ?", userID).
		Update("is_disabled", set).Error; err != nil {
		log.Println(err.Error())
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	return c.SendStatus(fiber.StatusOK)
}

func DeleteUser(c *fiber.Ctx) error {
	userID := utils.GetIdFromJwt(c)
	db := storage.GetConn()

	if err := db.Model(&model.User{}).
		Where("id = ?", userID).
		Updates(model.User{Username: "Deleted", Email: "deleted@mail.com", IsDeleted: true}).Error; err != nil {
		log.Println(err.Error())
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	return c.SendStatus(fiber.StatusOK)
}
