package models

import (
	"time"

	"gorm.io/gorm"
)

type Badge struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Name        string `gorm:"not null;unique" json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`     // Emoji or icon name
	Criteria    string `json:"criteria"` // JSON or text description of how to earn

	// Relations
	Users []User `gorm:"many2many:user_badges;" json:"-"`
}

type UserBadge struct {
	UserID   uint      `gorm:"primaryKey" json:"user_id"`
	BadgeID  uint      `gorm:"primaryKey" json:"badge_id"`
	EarnedAt time.Time `json:"earned_at"`
}
