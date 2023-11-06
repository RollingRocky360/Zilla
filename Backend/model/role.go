package model

import "gorm.io/gorm"

type Role struct {
	gorm.Model
	ProjectID   uint   `json:"projectId"`
	Title       string `json:"title"`
	IssueAccess uint   `json:"issueAccess"`
	Color       string `json:"color"`
}
