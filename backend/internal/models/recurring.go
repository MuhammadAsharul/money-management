package models

import (
	"time"

	"gorm.io/gorm"
)

type RecurringTransaction struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	UserID      uint       `gorm:"not null" json:"user_id"`
	WalletID    uint       `gorm:"not null" json:"wallet_id"`
	CategoryID  uint       `gorm:"not null" json:"category_id"`
	Amount      float64    `gorm:"not null" json:"amount"`
	Type        string     `gorm:"not null" json:"type"` // income, expense
	Description string     `json:"description"`
	Frequency   string     `gorm:"not null" json:"frequency"` // daily, weekly, monthly, yearly
	StartDate   time.Time  `gorm:"not null" json:"start_date"`
	NextRunDate time.Time  `gorm:"not null" json:"next_run_date"`
	IsActive    bool       `gorm:"default:true" json:"is_active"`
	LastRunDate *time.Time `json:"last_run_date"`

	// Relationships
	User     User     `gorm:"foreignKey:UserID" json:"-"`
	Wallet   Wallet   `gorm:"foreignKey:WalletID" json:"wallet"`
	Category Category `gorm:"foreignKey:CategoryID" json:"category"`
}
