package repository

import (
	"github.com/money-management/backend/internal/models"
	"gorm.io/gorm"
)

type GoalItemRepository struct {
	db *gorm.DB
}

func NewGoalItemRepository(db *gorm.DB) *GoalItemRepository {
	return &GoalItemRepository{db: db}
}

func (r *GoalItemRepository) Create(item *models.GoalItem) error {
	return r.db.Create(item).Error
}

func (r *GoalItemRepository) FindByGoalID(goalID uint) ([]models.GoalItem, error) {
	var items []models.GoalItem
	err := r.db.Where("goal_id = ?", goalID).Find(&items).Error
	return items, err
}

func (r *GoalItemRepository) FindByID(id uint) (*models.GoalItem, error) {
	var item models.GoalItem
	err := r.db.First(&item, id).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *GoalItemRepository) Update(item *models.GoalItem) error {
	return r.db.Save(item).Error
}

func (r *GoalItemRepository) Delete(id uint) error {
	return r.db.Delete(&models.GoalItem{}, id).Error
}
