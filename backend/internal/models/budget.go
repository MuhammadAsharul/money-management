package models

import (
	"time"

	"gorm.io/gorm"
)

type Budget struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	UserID     uint    `gorm:"not null" json:"user_id"`
	CategoryID uint    `gorm:"not null" json:"category_id"`
	Amount     float64 `gorm:"not null" json:"amount"`
	Period     string  `gorm:"not null;default:'monthly'" json:"period"` // monthly, weekly, yearly
	StartDate  time.Time `json:"start_date"`

	// Computed fields (not stored in DB)
	Spent      float64 `gorm:"-" json:"spent"`
	Remaining  float64 `gorm:"-" json:"remaining"`
	Percentage float64 `gorm:"-" json:"percentage"`

	// Relations
	User     User     `gorm:"foreignKey:UserID" json:"-"`
	Category Category `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
}
