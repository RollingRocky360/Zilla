package model

import "gorm.io/gorm"

type Issue struct {
	gorm.Model
	AssigneeID uint   `json:"assigneeId"`
	ProjectID  uint   `json:"projectId"`
	Title      string `json:"title"`
	Decription string `json:"description"`
	Status     uint   `json:"status"`
	Type       uint   `json:"type"`
}
