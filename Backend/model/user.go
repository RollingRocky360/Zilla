package model

import "gorm.io/gorm"

type User struct {
	gorm.Model
	Username   string `json:"username" validate:"required"`
	Email      string `json:"email" validate:"required,email"`
	Password   string `json:"password" validate:"required"`
	IsDisabled bool   `json:"isDisabled"`
	IsDeleted  bool   `json:"isDeleted"`
	Color      string `json:"color"`
}
