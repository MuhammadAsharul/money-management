package models

import (
	"time"
)

type GoalMember struct {
	GoalID   uint      `gorm:"primaryKey" json:"goal_id"`
	UserID   uint      `gorm:"primaryKey" json:"user_id"`
	Role     string    `json:"role"` // "owner", "member"
	JoinedAt time.Time `json:"joined_at"`

	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Goal Goal `gorm:"foreignKey:GoalID" json:"-"`
}
