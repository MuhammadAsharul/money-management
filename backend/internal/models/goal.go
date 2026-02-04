package models

import (
	"time"

	"gorm.io/gorm"
)

type Goal struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	UserID        uint       `gorm:"not null" json:"user_id"`
	Name          string     `gorm:"not null" json:"name"`
	TargetAmount  float64    `gorm:"not null" json:"target_amount"`
	CurrentAmount float64    `gorm:"default:0" json:"current_amount"`
	Deadline      *time.Time `json:"deadline"`
	Icon          string     `json:"icon"`
	Color         string     `json:"color"`
	Description   string     `json:"description"`

	User         User              `gorm:"foreignKey:UserID" json:"-"`
	Members      []GoalMember      `gorm:"foreignKey:GoalID" json:"members,omitempty"`
	Transactions []GoalTransaction `gorm:"foreignKey:GoalID" json:"transactions,omitempty"`
}

type GoalTransaction struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	GoalID    uint      `gorm:"not null" json:"goal_id"`
	UserID    uint      `gorm:"not null" json:"user_id"`
	Amount    float64   `gorm:"not null" json:"amount"`
	Date      time.Time `json:"date"`
	Notes     string    `json:"notes"`
	CreatedAt time.Time `json:"created_at"`

	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}
