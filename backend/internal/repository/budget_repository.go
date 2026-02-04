package repository

import (
	"time"

	"github.com/money-management/backend/internal/models"
	"gorm.io/gorm"
)

type BudgetRepository struct {
	db *gorm.DB
}

func NewBudgetRepository(db *gorm.DB) *BudgetRepository {
	return &BudgetRepository{db: db}
}

func (r *BudgetRepository) Create(budget *models.Budget) error {
	return r.db.Create(budget).Error
}

func (r *BudgetRepository) FindByID(id uint) (*models.Budget, error) {
	var budget models.Budget
	err := r.db.Preload("Category").First(&budget, id).Error
	if err != nil {
		return nil, err
	}
	return &budget, nil
}

func (r *BudgetRepository) FindByUserID(userID uint) ([]models.Budget, error) {
	var budgets []models.Budget
	err := r.db.Preload("Category").Where("user_id = ?", userID).Find(&budgets).Error
	return budgets, err
}

func (r *BudgetRepository) FindByUserIDAndCategory(userID, categoryID uint) (*models.Budget, error) {
	var budget models.Budget
	err := r.db.Preload("Category").Where("user_id = ? AND category_id = ?", userID, categoryID).First(&budget).Error
	if err != nil {
		return nil, err
	}
	return &budget, nil
}

func (r *BudgetRepository) Update(budget *models.Budget) error {
	return r.db.Save(budget).Error
}

func (r *BudgetRepository) Delete(id uint) error {
	return r.db.Delete(&models.Budget{}, id).Error
}

func (r *BudgetRepository) GetBudgetsWithSpending(userID uint, startDate, endDate time.Time) ([]models.Budget, error) {
	budgets, err := r.FindByUserID(userID)
	if err != nil {
		return nil, err
	}

	for i := range budgets {
		var spent float64
		r.db.Model(&models.Transaction{}).
			Where("user_id = ? AND category_id = ? AND type = ? AND date >= ? AND date <= ?",
				userID, budgets[i].CategoryID, "expense", startDate, endDate).
			Select("COALESCE(SUM(amount), 0)").
			Scan(&spent)

		budgets[i].Spent = spent
		budgets[i].Remaining = budgets[i].Amount - spent
		if budgets[i].Amount > 0 {
			budgets[i].Percentage = (spent / budgets[i].Amount) * 100
		}
	}

	return budgets, nil
}
