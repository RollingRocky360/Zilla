package model

import "gorm.io/gorm"

type UserProject struct {
	gorm.Model
	ProjectID uint `json:"projectId"`
	UserID    uint `json:"userId"`
	RoleID    uint `json:"roleId"`
}
