package models

import (
	"time"

	"gorm.io/gorm"
)

type GoalItem struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	GoalID         uint    `gorm:"not null" json:"goal_id"`
	Name           string  `gorm:"not null" json:"name"`
	EstimatedType  string  `json:"estimated_type"` // e.g: "high", "medium", "low" (optional, for future)
	EstimatedPrice float64 `gorm:"not null" json:"estimated_price"`
	ActualPrice    float64 `gorm:"default:0" json:"actual_price"`
	IsPurchased    bool    `gorm:"default:false" json:"is_purchased"`
	Note           string  `json:"note"`

	// Relationships
	Goal Goal `gorm:"foreignKey:GoalID" json:"-"`
}
