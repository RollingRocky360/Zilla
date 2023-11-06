package controller

import (
	"bufio"
	"log"
	"regexp"
	"strconv"
	"strings"

	ia "zilla-backend/enums/access"
	"zilla-backend/enums/status"
	"zilla-backend/model"
	"zilla-backend/storage"
	"zilla-backend/utils"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var bulkIssueRegex = regexp.MustCompile(`^(\w+[\w\s]*),(\w+[\w\s]*),(1|2|3)(,\w[\w\d]+@\w+(?:\.\w+)+)?`)

func CreateIssue(c *fiber.Ctx) error {
	var issue model.Issue
	log.Println(string(c.BodyRaw()))
	err := c.BodyParser(&issue)
	if err != nil {
		log.Println(err.Error())
		return c.SendStatus(fiber.StatusBadRequest)
	}

	userID := utils.GetIdFromJwt(c)

	access, err := getAccessValueOfUser(userID, issue.ProjectID)
	if err != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	if access&ia.Create == 0 {
		return c.SendStatus(fiber.StatusForbidden)
	}

	issue.Status = status.ToDo

	db := storage.GetConn()
	err = db.Save(&issue).Error
	if err != nil {
		log.Println(err.Error())
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	var assignee model.User
	if issue.AssigneeID != 0 {
		res := db.First(&assignee, issue.AssigneeID)
		if res.Error != nil {
			log.Println(err.Error())
			return c.SendStatus(fiber.StatusInternalServerError)
		}
	}

	var assigned interface{}
	if assignee.ID == 0 {
		assigned = nil
	} else {
		assigned = assignee
	}
	return c.JSON(fiber.Map{
		"issue":    issue,
		"assignee": assigned,
	})
}

func GetIssues(c *fiber.Ctx) error {
	projectID := uint(c.QueryInt("projectID"))
	if projectID == 0 {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	issues := []model.Issue{}
	db := storage.GetConn()
	if db.Order("lower(title) asc").Where("project_id = ?", projectID).Find(&issues).Error != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	result := []fiber.Map{}
	var assignee model.User
	for _, issue := range issues {
		curr := fiber.Map{
			"issue":    issue,
			"assignee": nil,
		}
		if issue.AssigneeID != 0 {
			db.First(&assignee, issue.AssigneeID)
			utils.PopulateUser(&assignee)
			curr["assignee"] = assignee
		}
		result = append(result, curr)
		assignee.ID = 0
	}

	return c.JSON(result)
}

func UpdateIssueStatus(c *fiber.Ctx) error {
	var issue model.Issue
	err := c.BodyParser(&issue)

	if err != nil {
		log.Println(err.Error())
		return c.SendStatus(fiber.StatusBadRequest)
	}

	if issue.Status < 1 || issue.Status > 3 {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	if issue.AssigneeID != utils.GetIdFromJwt(c) {
		return c.SendStatus(fiber.StatusForbidden)
	}

	db := storage.GetConn()
	if db.Save(&issue).Error != nil {
		c.SendStatus(fiber.StatusInternalServerError)
	}

	return c.SendStatus(fiber.StatusOK)
}

func GetIssueAccess(c *fiber.Ctx) error {
	pID, err := c.ParamsInt("projectID")
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	projectID := uint(pID)
	userID := utils.GetIdFromJwt(c)

	access, err := getAccessValueOfUser(userID, projectID)
	if err != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	return c.SendString(strconv.Itoa(int(access)))
}

func UpdateIssue(c *fiber.Ctx) error {
	var issue model.Issue
	log.Println(string(c.BodyRaw()))
	err := c.BodyParser(&issue)
	if err != nil {
		log.Println(err.Error())
		return c.SendStatus(fiber.StatusBadRequest)
	}

	log.Println(issue.ID)
	userID := utils.GetIdFromJwt(c)

	access, err := getAccessValueOfUser(userID, issue.ProjectID)
	if err != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	if access&ia.Edit == 0 {
		return c.SendStatus(fiber.StatusForbidden)
	}

	db := storage.GetConn()
	if db.Omit("status").Save(&issue).Error != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	var assignee model.User
	var assigned interface{} = nil

	if issue.AssigneeID != 0 {
		res := db.First(&assignee, issue.AssigneeID)
		if res.Error != nil {
			log.Println(err.Error())
			return c.SendStatus(fiber.StatusInternalServerError)
		}
		assigned = assignee
	}

	return c.JSON(fiber.Map{
		"issue":    issue,
		"assignee": assigned,
	})
}

func DeleteIssue(c *fiber.Ctx) error {
	issID, err := c.ParamsInt("issueID")
	if err != nil {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	issueID := uint(issID)
	userID := utils.GetIdFromJwt(c)

	db := storage.GetConn()
	var issue model.Issue
	db.First(&issue, issueID)

	access, err := getAccessValueOfUser(userID, issue.ProjectID)
	if err != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	if access&ia.Delete == 0 {
		return c.SendStatus(fiber.StatusForbidden)
	}

	if db.Delete(&issue).Error != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	return c.SendStatus(fiber.StatusOK)
}

func ImportBulkIssues(c *fiber.Ctx) error {
	data := string(c.BodyRaw())

	db := storage.GetConn()
	projectID := uint(c.QueryInt("projectID"))
	if projectID == 0 {
		return c.SendStatus(fiber.StatusBadRequest)
	}

	issues := []model.Issue{}
	users := []model.User{}

	// title,description,type(1|2|3)[,assigneeEmail] <- expected CSV format
	sc := bufio.NewScanner(strings.NewReader(data))
	var match []string
	for sc.Scan() {
		line := sc.Text()
		if match = bulkIssueRegex.FindStringSubmatch(line); len(match) == 0 {
			return c.SendStatus(fiber.StatusUnprocessableEntity)
		}
		title, description := match[1], match[2]
		t, err := strconv.Atoi(match[3])
		if err != nil {
			return c.SendStatus(fiber.StatusInternalServerError)
		}
		issueType := uint(t)
		log.Println(len(match))

		user := model.User{}
		if len(match[4]) > 1 {
			email := match[4][1:]
			if db.Where("email like ?", email).First(&user).Error == gorm.ErrRecordNotFound {
				return c.SendStatus(fiber.StatusUnprocessableEntity)
			}

			if db.Where("user_id = ?", user.ID).First(&model.UserProject{}).Error == gorm.ErrRecordNotFound {
				return c.SendStatus(fiber.StatusUnprocessableEntity)
			}
		}

		users = append(users, user)
		issues = append(issues, model.Issue{
			Title:      title,
			Decription: description,
			Type:       issueType,
			Status:     1,
			ProjectID:  projectID,
			AssigneeID: user.ID,
		})
	}

	if db.Create(&issues).Error != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	result := []fiber.Map{}
	for i, issue := range issues {
		currRes := fiber.Map{
			"issue":    issue,
			"assignee": users[i],
		}
		if issue.AssigneeID == 0 {
			currRes["assignee"] = nil
		}
		result = append(result, currRes)
	}

	return c.JSON(result)
}

func getAccessValueOfUser(userID uint, projectID uint) (uint, error) {
	db := storage.GetConn()
	var access uint = 0

	// aggregate access associated with roles
	rows, err :=
		db.Model(&model.UserProject{}).
			Where("user_id = ?", userID).
			Where("project_id = ?", projectID).
			Select("role_id").
			Rows()
	defer rows.Close()

	if err != nil {
		return 0, err
	}

	var role model.Role
	for rows.Next() {
		rows.Scan(&role.ID)
		db.First(&role)
		access |= role.IssueAccess
	}

	if rows.Err() != nil {
		return 0, rows.Err()
	}

	// aggregate access associated with groups
	rows, err =
		db.Model(&model.ProjectGroup{}).
			Where("project_id = ?", projectID).
			Select("group_id", "role_id").
			Rows()
	defer rows.Close()

	if err != nil {
		return 0, err
	}

	var (
		groupID   uint
		roleID    uint
		userGroup model.UserGroup
	)

	for rows.Next() {
		rows.Scan(&groupID, &roleID)
		if db.Where("user_id = ?", userID).
			Where("group_id = ?", groupID).
			First(&userGroup).Error != nil {
			continue
		}
		role.ID = roleID
		db.First(&role)
		access |= role.IssueAccess
	}

	if rows.Err() != nil {
		return 0, rows.Err()
	}

	return access, nil
}
