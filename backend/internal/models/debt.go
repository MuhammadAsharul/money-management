package models

import (
	"time"

	"gorm.io/gorm"
)

type Debt struct {
	gorm.Model
	UserID            uint       `json:"user_id"`
	Type              string     `json:"type"`        // 'payable' or 'receivable'
	PersonName        string     `json:"person_name"` // Name of the person/entity
	Amount            float64    `json:"amount"`
	RemainingAmount   float64    `json:"remaining_amount"`   // New field for installments
	InstallmentAmount float64    `json:"installment_amount"` // New field
	Description       string     `json:"description"`
	BorrowedDate      *time.Time `json:"borrowed_date"` // New field
	DueDate           *time.Time `json:"due_date"`
	Status            string     `json:"status"` // 'unpaid', 'paid'
}
