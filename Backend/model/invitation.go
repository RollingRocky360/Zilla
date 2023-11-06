package model

import "gorm.io/gorm"

type Invitation struct {
	gorm.Model
	FromID    uint `json:"fromId"`
	ToID      uint `json:"toId"`
	ProjectID uint `json:"projectId"`
	GroupID   uint `json:"groupId"`
}
