package storage

import (
	"fmt"
	"log"
	"os"
	"zilla-backend/model"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var db *gorm.DB

func InitDatabase() {
	host := "db"

	if os.Getenv("DB_USE") == "false" {
		return
	}

	if os.Getenv("CONTAINER") == "" {
		host = "localhost"
	}

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=5432 sslmode=disable",
		host,
		os.Getenv("POSTGRES_USER"),
		os.Getenv("POSTGRES_PASSWORD"),
		os.Getenv("POSTGRES_DB"),
	)

	fmt.Println(dsn)

	DB, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	log.Println(dsn)
	if err != nil {
		log.Fatal(err.Error())
	}

	db = DB
	migrate()
}

func migrate() {
	db.AutoMigrate(
		&model.User{},
		&model.Project{},
		&model.Role{},
		&model.UserProject{},
		&model.Issue{},
		&model.Invitation{},
		&model.Group{},
		&model.ProjectGroup{},
		&model.UserGroup{},
	)
}

func GetConn() *gorm.DB {
	return db
}
