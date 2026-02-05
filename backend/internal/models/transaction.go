package models

import (
	"time"

	"gorm.io/gorm"
)

type Transaction struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	UserID         uint      `gorm:"not null" json:"user_id"`
	CategoryID     uint      `gorm:"not null" json:"category_id"`
	WalletID       uint      `gorm:"not null" json:"wallet_id"`
	Amount         float64   `gorm:"not null" json:"amount"`         // Amount in IDR (converted)
	OriginalAmount float64   `json:"original_amount"`                // Amount in original currency
	Currency       string    `gorm:"default:'IDR'" json:"currency"`  // Currency code (IDR, USD, etc)
	ExchangeRate   float64   `gorm:"default:1" json:"exchange_rate"` // Rate used for conversion
	Type           string    `gorm:"not null" json:"type"`           // income, expense
	Description    string    `json:"description"`
	Date           time.Time `gorm:"not null" json:"date"`
	Notes          string    `json:"notes"`
	ProofURL       string    `json:"proof_url"` // Optional proof image URL

	// Relations
	User     User     `gorm:"foreignKey:UserID" json:"-"`
	Category Category `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Wallet   Wallet   `gorm:"foreignKey:WalletID" json:"wallet,omitempty"`
}

type TransactionSummary struct {
	TotalIncome      float64 `json:"total_income"`
	TotalExpense     float64 `json:"total_expense"`
	Balance          float64 `json:"balance"`
	TransactionCount int64   `json:"transaction_count"`
}
