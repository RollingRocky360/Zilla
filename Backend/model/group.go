package model

import "gorm.io/gorm"

type Group struct {
	gorm.Model
	Title     string `json:"title"`
	CreatorID uint   `json:"creatorId"`
	Color     string `json:"color"`
}
