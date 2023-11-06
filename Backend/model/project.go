package model

import "gorm.io/gorm"

type Project struct {
	gorm.Model
	Title       string `json:"title" validate:"required"`
	Description string `json:"description" validate:"required"`
	Creator     uint   `json:"creator" validate:"required"`
	Color       string `json:"color"`
}
