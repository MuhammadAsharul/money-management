package models

import (
	"time"

	"gorm.io/gorm"
)

type Wallet struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	UserID      uint    `gorm:"not null" json:"user_id"`
	Name        string  `gorm:"not null" json:"name"`
	Icon        string  `json:"icon"`
	Color       string  `json:"color"`
	Balance     float64 `gorm:"default:0" json:"balance"`
	IsDefault   bool    `gorm:"default:false" json:"is_default"`
	Description string  `json:"description"`

	// Relations
	User         User          `gorm:"foreignKey:UserID" json:"-"`
	Transactions []Transaction `json:"transactions,omitempty"`
}
