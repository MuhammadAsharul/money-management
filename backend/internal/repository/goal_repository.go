package repository

import (
	"time"

	"github.com/money-management/backend/internal/models"
	"gorm.io/gorm"
)

type GoalRepository struct {
	db *gorm.DB
}

func NewGoalRepository(db *gorm.DB) *GoalRepository {
	return &GoalRepository{db: db}
}

func (r *GoalRepository) Create(goal *models.Goal) error {
	return r.db.Create(goal).Error
}

func (r *GoalRepository) FindByUserID(userID uint) ([]models.Goal, error) {
	var goals []models.Goal
	err := r.db.Distinct("goals.*").
		Joins("LEFT JOIN goal_members ON goal_members.goal_id = goals.id").
		Where("goals.user_id = ? OR goal_members.user_id = ?", userID, userID).
		Preload("Members").
		Preload("Members.User").
		Preload("User").
		Find(&goals).Error
	return goals, err
}

func (r *GoalRepository) FindByID(id uint) (*models.Goal, error) {
	var goal models.Goal
	err := r.db.First(&goal, id).Error
	if err != nil {
		return nil, err
	}
	return &goal, nil
}

func (r *GoalRepository) Update(goal *models.Goal) error {
	return r.db.Save(goal).Error
}

func (r *GoalRepository) Delete(id uint) error {
	return r.db.Delete(&models.Goal{}, id).Error
}

func (r *GoalRepository) AddMember(goalID, userID uint, role string) error {
	member := models.GoalMember{
		GoalID:   goalID,
		UserID:   userID,
		Role:     role,
		JoinedAt: time.Now(),
	}
	return r.db.Create(&member).Error
}

func (r *GoalRepository) RemoveMember(goalID, userID uint) error {
	return r.db.Where("goal_id = ? AND user_id = ?", goalID, userID).Delete(&models.GoalMember{}).Error
}

func (r *GoalRepository) FindMember(goalID, userID uint) (*models.GoalMember, error) {
	var member models.GoalMember
	err := r.db.Where("goal_id = ? AND user_id = ?", goalID, userID).First(&member).Error
	if err != nil {
		return nil, err
	}
	return &member, nil
}

func (r *GoalRepository) AddTransaction(goalID, userID uint, amount float64, notes string, date time.Time) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// 1. Create transaction record
		transaction := models.GoalTransaction{
			GoalID:    goalID,
			UserID:    userID,
			Amount:    amount,
			Notes:     notes,
			Date:      date,
			CreatedAt: time.Now(),
		}
		if err := tx.Create(&transaction).Error; err != nil {
			return err
		}

		// 2. Update goal current amount
		if err := tx.Model(&models.Goal{}).Where("id = ?", goalID).
			UpdateColumn("current_amount", gorm.Expr("current_amount + ?", amount)).Error; err != nil {
			return err
		}

		return nil
	})
}

func (r *GoalRepository) GetTransactions(goalID uint) ([]models.GoalTransaction, error) {
	var transactions []models.GoalTransaction
	err := r.db.Where("goal_id = ?", goalID).
		Preload("User").
		Order("date desc, created_at desc").
		Find(&transactions).Error
	return transactions, err
}
