package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Email      string `gorm:"uniqueIndex;not null" json:"email"`
	Name       string `gorm:"not null" json:"name"`
	Password   string `gorm:"" json:"-"` // Optional for OAuth users
	AvatarURL  string `json:"avatar_url"`
	Provider   string `gorm:"default:'local'" json:"provider"` // local, google
	ProviderID string `json:"provider_id,omitempty"`

	// Relations
	Transactions []Transaction `json:"transactions,omitempty"`
	Categories   []Category    `json:"categories,omitempty"`
	Budgets      []Budget      `json:"budgets,omitempty"`

	// Gamification
	CurrentStreak       int       `gorm:"default:0" json:"current_streak"`
	LongestStreak       int       `gorm:"default:0" json:"longest_streak"`
	LastTransactionDate time.Time `json:"last_transaction_date"`
	Level               int       `gorm:"default:1" json:"level"`
	XP                  int       `gorm:"default:0" json:"xp"`
	Badges              []Badge   `gorm:"many2many:user_badges;" json:"badges,omitempty"`
}
