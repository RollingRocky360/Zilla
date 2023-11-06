package model

import "gorm.io/gorm"

type ProjectGroup struct {
	gorm.Model
	ProjectID uint `json:"projectId"`
	GroupID   uint `json:"groupId"`
	RoleID    uint `json:"roleId"`
}
