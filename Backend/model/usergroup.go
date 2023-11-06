package model

import "gorm.io/gorm"

type UserGroup struct {
	gorm.Model
	UserID  uint `json:"userId"`
	GroupID uint `json:"groupId"`
}
