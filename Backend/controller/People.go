package controller

import (
	"bufio"
	"log"
	"regexp"
	"strings"
	"zilla-backend/model"
	"zilla-backend/storage"
	"zilla-backend/utils"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// csv format -> username,email,role
var bulkUserRegex = regexp.MustCompile(`^([\w][\w\d]*),([\w][\w\d]*@[\w]+[\.\w+]+),([\w][\w\d]*)$`)

func GetPeople(c *fiber.Ctx) error {
	pID := c.QueryInt("projectID")
	if pID == 0 {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	projectID := uint(pID)

	userProjects := []model.UserProject{}

	db := storage.GetConn()
	res := db.Model(&model.UserProject{}).Where("project_id = ?", projectID).Find(&userProjects)
	if res.Error != nil {
		log.Println(res.Error.Error())
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	result := []fiber.Map{}
	var member model.User
	var role model.Role
	for _, userProject := range userProjects {
		member.ID = userProject.UserID
		role.ID = userProject.RoleID
		db.First(&member)
		db.First(&role)
		if utils.PopulateUser(&member) {
			utils.PopulateRole(&role)
		}
		result = append(result, fiber.Map{
			"userProjectID": userProject.ID,
			"role":          role,
			"user":          member,
		})
	}

	return c.JSON(result)
}

func ChangeUserRole(c *fiber.Ctx) error {
	body := struct {
		UserProjectID uint `json:"userProjectID"`
		RoleID        uint `json:"roleID"`
	}{}
	c.BodyParser(&body)

	userProjectID, roleID := body.UserProjectID, body.RoleID

	db := storage.GetConn()
	res := db.Model(&model.UserProject{}).Where("id = ?", userProjectID).Update("role_id", roleID)

	newRole := model.Role{}
	db.First(&newRole, roleID)

	if res.Error != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	return c.JSON(newRole)
}

func ImportBulkUsers(c *fiber.Ctx) error {
	var data string = string(c.BodyRaw())
	log.Println(data)

	db := storage.GetConn()
	projectID := uint(c.QueryInt("projectID"))
	if projectID == 0 {
		log.Println("no project id query")
		return c.SendStatus(fiber.StatusBadRequest)
	}

	userProjects := []model.UserProject{}
	users := []model.User{}
	roles := []model.Role{}

	rolesMap := map[string]model.Role{}

	var match []string
	var role model.Role

	result := []fiber.Map{}

	// username,email,role <- csv format
	sc := bufio.NewScanner(strings.NewReader(data))
	for sc.Scan() {
		line := sc.Text()
		log.Println(line)
		if match = bulkUserRegex.FindStringSubmatch(line); len(match) == 0 {
			return c.SendStatus(fiber.StatusUnprocessableEntity)
		}

		_, email, roleTitle := match[1], match[2], match[3]
		log.Println(email, roleTitle)
		user := model.User{}
		if db.Where("email like ?", email).First(&user).Error == gorm.ErrRecordNotFound {
			return c.SendStatus(fiber.StatusUnprocessableEntity)
		}
		users = append(users, user)

		if role := rolesMap[roleTitle]; role.ID != 0 {
			userProjects = append(userProjects, model.UserProject{
				ProjectID: projectID,
				UserID:    user.ID,
				RoleID:    role.ID,
			})
			roles = append(roles, role)
			continue
		}

		if res := db.Where("title like ?", roleTitle).Where("project_id = ?", projectID).First(&role); res.Error != nil {
			log.Println(res.Error.Error())
			return c.SendStatus(fiber.StatusUnprocessableEntity)
		}

		rolesMap[role.Title] = role
		roles = append(roles, role)

		userProjects = append(userProjects, model.UserProject{
			ProjectID: projectID,
			UserID:    user.ID,
			RoleID:    role.ID,
		})
	}

	if db.Create(&userProjects).Error != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	for i, userProject := range userProjects {
		result = append(result, fiber.Map{
			"userProjectID": userProject.ID,
			"role":          roles[i],
			"user":          users[i],
		})
	}

	return c.JSON(result)
}
