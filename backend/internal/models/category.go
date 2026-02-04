package models

import (
	"time"

	"gorm.io/gorm"
)

type Category struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	UserID      uint   `gorm:"not null" json:"user_id"`
	Name        string `gorm:"not null" json:"name"`
	Icon        string `json:"icon"`                 // Emoji or icon name
	Color       string `json:"color"`                // Hex color
	Type        string `gorm:"not null" json:"type"` // income, expense
	IsDefault   bool   `gorm:"default:false" json:"is_default"`
	IsEssential bool   `gorm:"default:true" json:"is_essential"` // for scoring: true=Need, false=Want

	// Relations
	User         User          `gorm:"foreignKey:UserID" json:"-"`
	Transactions []Transaction `json:"transactions,omitempty"`
}
