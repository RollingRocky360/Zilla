package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"

	jwtware "github.com/gofiber/contrib/jwt"

	"zilla-backend/controller"
	"zilla-backend/storage"
)

func pong(c *fiber.Ctx) error {
	return c.SendString("pong")
}

func InitAndListen() {
	if os.Getenv("CONTAINER") == "" {
		if err := godotenv.Load(); err != nil {
			log.Fatal(err.Error())
		}
	}
	storage.InitDatabase()

	app := fiber.New()
	app.Use(cors.New()) // to add allowed-origins during deployment
	app.Use(logger.New())

	api := app.Group("/api")

	api.Get("/ping", pong)
	api.Post("/register", controller.Register)
	api.Post("/login", controller.Login)

	api.Use(jwtware.New(jwtware.Config{
		SigningKey: jwtware.SigningKey{Key: []byte(os.Getenv("JWT_SECRET"))},
	}))

	// ------------ protected routes ------------ //

	api.Get("/projects", controller.GetProjects)
	api.Get("/projects/members", controller.GetUserOfProject) // url-queries: projectID, email
	api.Get("/projects/:projectID", controller.GetProject)
	api.Get("/projects/:projectID/groups", controller.GetAllProjectGroups)
	api.Get("/projects/:projectID/access", controller.GetIssueAccess)
	api.Post("/projects/:projectID/groups", controller.AddGroupToProject) // url-queries: roleID, groupID
	api.Post("/projects", controller.CreateProject)

	api.Get("/roles", controller.GetProjectRoles) // url-queries: projectID
	api.Get("/role", controller.GetUserRole)      // url-queries: projectID
	api.Post("/roles", controller.AddRole)
	api.Delete("/roles/:ID", controller.DeleteRole)

	api.Get("/user", controller.SearchUserByEmail) // url-queries: email
	api.Get("/user/:userID", controller.GetUser)
	api.Patch("/user/able/:action", controller.AbleUser)
	api.Delete("/user", controller.DeleteUser)

	api.Get("/invitations", controller.GetInvitations)
	api.Post("/invitations/project", controller.AddProjectInvite) // url-queries: projectId
	api.Post("/invitations/group", controller.AddGroupInvite)     // url-queries: groupId
	api.Put("/invitations/:inviteID", controller.HandleInvite)

	api.Get("/people", controller.GetPeople)
	api.Post("/people/import", controller.ImportBulkUsers) // url-queries: projectID
	api.Put("/people", controller.ChangeUserRole)

	api.Get("/issues", controller.GetIssues) // url-queries: projectID
	api.Post("/issues", controller.CreateIssue)
	api.Post("/issues/import", controller.ImportBulkIssues) // url-queries: projectID
	api.Put("/issues", controller.UpdateIssue)
	api.Put("/issues/status", controller.UpdateIssueStatus)
	api.Delete(("/issues/:issueID"), controller.DeleteIssue)

	api.Get("/groups", controller.GetAllGroups)
	api.Get("/groups/search", controller.SearchUserGroups) // url-queries: term
	api.Get("/groups/:groupID", controller.GetGroupMembers)
	api.Post("/groups", controller.CreateGroup)

	api.Get("/auth", controller.Auth)

	log.Fatal(app.Listen(":4000"))
}

func main() {
	InitAndListen()
}
