package repository

import (
	"time"

	"github.com/money-management/backend/internal/models"
	"gorm.io/gorm"
)

type RecurringRepository struct {
	db *gorm.DB
}

func NewRecurringRepository(db *gorm.DB) *RecurringRepository {
	return &RecurringRepository{db: db}
}

func (r *RecurringRepository) Create(recurring *models.RecurringTransaction) error {
	return r.db.Create(recurring).Error
}

func (r *RecurringRepository) FindByUserID(userID uint) ([]models.RecurringTransaction, error) {
	var recurrings []models.RecurringTransaction
	err := r.db.Where("user_id = ?", userID).
		Preload("Category").
		Preload("Wallet").
		Order("next_run_date asc").
		Find(&recurrings).Error
	return recurrings, err
}

func (r *RecurringRepository) FindByID(id uint) (*models.RecurringTransaction, error) {
	var recurring models.RecurringTransaction
	err := r.db.First(&recurring, id).Error
	if err != nil {
		return nil, err
	}
	return &recurring, nil
}

func (r *RecurringRepository) Update(recurring *models.RecurringTransaction) error {
	return r.db.Save(recurring).Error
}

func (r *RecurringRepository) Delete(id uint) error {
	return r.db.Delete(&models.RecurringTransaction{}, id).Error
}

// FindPending returns active recurring transactions that are due (next_run_date <= now)
func (r *RecurringRepository) FindPending(userID uint, date time.Time) ([]models.RecurringTransaction, error) {
	var recurrings []models.RecurringTransaction
	err := r.db.Where("user_id = ? AND is_active = ? AND next_run_date <= ?", userID, true, date).
		Find(&recurrings).Error
	return recurrings, err
}
