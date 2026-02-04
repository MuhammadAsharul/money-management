package models

import (
	"time"

	"gorm.io/gorm"
)

type Debt struct {
	gorm.Model
	UserID      uint       `json:"user_id"`
	Type        string     `json:"type"`        // 'payable' (Utang Saya) or 'receivable' (Utang Orang Lain)
	PersonName  string     `json:"person_name"` // Name of the person/entity
	Amount      float64    `json:"amount"`
	Description string     `json:"description"`
	DueDate     *time.Time `json:"due_date"`
	Status      string     `json:"status"` // 'unpaid', 'paid'
}
