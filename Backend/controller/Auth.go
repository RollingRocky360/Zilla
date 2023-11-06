package controller

import (
	"log"
	"os"
	"time"

	"zilla-backend/model"
	"zilla-backend/storage"
	"zilla-backend/utils"

	pswdv "github.com/go-passwd/validator"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

var passwordValidator = pswdv.New(
	pswdv.MinLength(3, nil),
	pswdv.MaxLength(25, nil),
	pswdv.ContainsAtLeast("!@#$%^&*", 1, nil),
)

func Login(c *fiber.Ctx) error {
	var formUser, dbUser model.User
	if err := c.BodyParser(&formUser); err != nil {
		c.SendStatus(fiber.StatusBadRequest)
		return err
	}

	if passwordValidator.Validate(formUser.Password) != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "invalid password",
		})
	}

	db := storage.GetConn()
	result := db.Where("email LIKE ?", formUser.Email).First(&dbUser)
	log.Printf("%+v", dbUser)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "no such user",
			})
		}
		log.Fatal("Failed: Database - User Fetch Login")
	}

	if !utils.ComparePassword(formUser.Password, dbUser.Password) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "incorrect password",
		})
	}

	claims := jwt.MapClaims{
		"id":  dbUser.ID,
		"exp": time.Now().Add(time.Hour * 600).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	t, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	utils.PopulateUser(&dbUser)
	return c.JSON(fiber.Map{
		"token": t,
		"user":  dbUser,
	})
}

func Register(c *fiber.Ctx) error {
	var user model.User
	if c.BodyParser(&user) != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	v := validator.New()
	err := v.Struct(user)

	if err != nil || passwordValidator.Validate(user.Password) != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "invalid credentials",
		})
	}

	db := storage.GetConn()

	if db.Where("email = ?", user.Email).First(&model.User{}) == nil {
		return c.Status(fiber.StatusAlreadyReported).JSON(fiber.Map{
			"error": "user already exists",
		})
	}

	user.Password, err = utils.HashPassword(user.Password)
	if err != nil {
		log.Println("Failed: Password Hashing")
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	user.Color = utils.RandColorHex()
	if db.Save(&user).Error != nil {
		log.Println("Failed: Database - User Regsitration")
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	claims := jwt.MapClaims{
		"id":  user.ID,
		"exp": time.Now().Add(time.Hour * 300).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	t, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	return c.JSON(fiber.Map{
		"token": t,
		"user":  user,
	})
}

func Auth(c *fiber.Ctx) error {
	id := utils.GetIdFromJwt(c)

	db := storage.GetConn()

	var user model.User
	if res := db.First(&user, id); res.Error != nil {
		if res.Error == gorm.ErrRecordNotFound {
			return c.JSON(nil)
		}
		log.Println(res.Error.Error())
		c.SendStatus(fiber.StatusInternalServerError)
	}

	utils.PopulateUser(&user)

	return c.JSON(user)
}
