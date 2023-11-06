package utils

import "zilla-backend/model"

func PopulateUser(user *model.User) bool {
	if user.IsDisabled {
		user.Email = "unknown@mail.com"
		user.Username = "Unknown"
		return true
	}
	return false
}

func PopulateRole(role *model.Role) {
	role.Title = "unknown"
}
