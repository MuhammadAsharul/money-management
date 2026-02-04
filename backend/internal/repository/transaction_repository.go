package repository

import (
	"time"

	"github.com/money-management/backend/internal/models"
	"gorm.io/gorm"
)

type TransactionRepository struct {
	db *gorm.DB
}

func NewTransactionRepository(db *gorm.DB) *TransactionRepository {
	return &TransactionRepository{db: db}
}

func (r *TransactionRepository) Create(transaction *models.Transaction) error {
	return r.db.Create(transaction).Error
}

func (r *TransactionRepository) FindByID(id uint) (*models.Transaction, error) {
	var transaction models.Transaction
	err := r.db.Preload("Category").First(&transaction, id).Error
	if err != nil {
		return nil, err
	}
	return &transaction, nil
}

func (r *TransactionRepository) Search(userID uint, startDate, endDate *time.Time, categoryID *uint, transactionType, search string, limit, offset int) ([]models.Transaction, int64, error) {
	var transactions []models.Transaction
	var total int64

	query := r.db.Model(&models.Transaction{}).Where("user_id = ?", userID)

	if startDate != nil {
		query = query.Where("date >= ?", startDate)
	}
	if endDate != nil {
		query = query.Where("date <= ?", endDate)
	}
	if categoryID != nil {
		query = query.Where("category_id = ?", categoryID)
	}
	if transactionType != "" {
		query = query.Where("type = ?", transactionType)
	}
	if search != "" {
		// Search description or notes or category name?
		// Category name search requires join. For now search description/notes.
		query = query.Where("description LIKE ? OR notes LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	query.Count(&total)

	err := query.Preload("Category").
		Order("date desc").
		Limit(limit).
		Offset(offset).
		Find(&transactions).Error

	return transactions, total, err
}

func (r *TransactionRepository) FindByUserID(userID uint, limit, offset int) ([]models.Transaction, int64, error) {
	// Legacy support or just call Search with nil
	return r.Search(userID, nil, nil, nil, "", "", limit, offset)
}

func (r *TransactionRepository) FindByUserIDAndDateRange(userID uint, startDate, endDate time.Time) ([]models.Transaction, error) {
	var transactions []models.Transaction
	err := r.db.Preload("Category").
		Where("user_id = ? AND date >= ? AND date <= ?", userID, startDate, endDate).
		Order("date desc").
		Find(&transactions).Error
	return transactions, err
}

func (r *TransactionRepository) FindByUserIDAndCategory(userID, categoryID uint) ([]models.Transaction, error) {
	var transactions []models.Transaction
	err := r.db.Preload("Category").
		Where("user_id = ? AND category_id = ?", userID, categoryID).
		Order("date desc").
		Find(&transactions).Error
	return transactions, err
}

func (r *TransactionRepository) Update(transaction *models.Transaction) error {
	return r.db.Save(transaction).Error
}

func (r *TransactionRepository) Delete(id uint) error {
	return r.db.Unscoped().Delete(&models.Transaction{}, id).Error
}

func (r *TransactionRepository) GetSummary(userID uint, startDate, endDate time.Time) (*models.TransactionSummary, error) {
	var summary models.TransactionSummary

	// Exclude "Transfer" categories (Case Insensitive)
	excludeNames := []string{"transfer", "transfer out", "transfer in"}

	// Get total income
	r.db.Table("transactions").
		Joins("JOIN categories ON categories.id = transactions.category_id").
		Where("transactions.user_id = ? AND transactions.type = ? AND transactions.date >= ? AND transactions.date <= ?", userID, "income", startDate, endDate).
		Where("LOWER(categories.name) NOT IN ?", excludeNames).
		Select("COALESCE(SUM(transactions.amount), 0)").
		Scan(&summary.TotalIncome)

	// Get total expense
	r.db.Table("transactions").
		Joins("JOIN categories ON categories.id = transactions.category_id").
		Where("transactions.user_id = ? AND transactions.type = ? AND transactions.date >= ? AND transactions.date <= ?", userID, "expense", startDate, endDate).
		Where("LOWER(categories.name) NOT IN ?", excludeNames).
		Select("COALESCE(SUM(transactions.amount), 0)").
		Scan(&summary.TotalExpense)

	// Get transaction count
	r.db.Table("transactions").
		Joins("JOIN categories ON categories.id = transactions.category_id").
		Where("transactions.user_id = ? AND transactions.date >= ? AND transactions.date <= ?", userID, startDate, endDate).
		Where("LOWER(categories.name) NOT IN ?", excludeNames).
		Count(&summary.TransactionCount)

	summary.Balance = summary.TotalIncome - summary.TotalExpense

	return &summary, nil
}

func (r *TransactionRepository) GetCategorySpending(userID uint, startDate, endDate time.Time) (map[uint]float64, error) {
	type Result struct {
		CategoryID uint
		Total      float64
	}
	var results []Result

	// Exclude "Transfer" categories
	excludeNames := []string{"transfer", "transfer out", "transfer in"}

	r.db.Table("transactions").
		Joins("JOIN categories ON categories.id = transactions.category_id").
		Where("transactions.user_id = ? AND transactions.type = ? AND transactions.date >= ? AND transactions.date <= ?", userID, "expense", startDate, endDate).
		Where("LOWER(categories.name) NOT IN ?", excludeNames).
		Select("transactions.category_id, SUM(transactions.amount) as total").
		Group("transactions.category_id").
		Scan(&results)

	spending := make(map[uint]float64)
	for _, result := range results {
		spending[result.CategoryID] = result.Total
	}

	return spending, nil
}

type DailyTrend struct {
	Date    string  `json:"date"`
	Income  float64 `json:"income"`
	Expense float64 `json:"expense"`
}

func (r *TransactionRepository) GetDailyTrends(userID uint, startDate, endDate time.Time) ([]DailyTrend, error) {
	// Exclude "Transfer" categories
	excludeNames := []string{"transfer", "transfer out", "transfer in"}

	// Fetch all transactions in range (excluding transfers)
	var transactions []models.Transaction
	err := r.db.
		Model(&models.Transaction{}).
		Select("transactions.*").
		Joins("JOIN categories ON categories.id = transactions.category_id").
		Where("transactions.user_id = ? AND transactions.date >= ? AND transactions.date <= ?", userID, startDate, endDate).
		Where("LOWER(categories.name) NOT IN ?", excludeNames).
		Order("transactions.date asc").
		Find(&transactions).Error

	if err != nil {
		return nil, err
	}

	// Aggregate
	trendMap := make(map[string]*DailyTrend)
	for _, tx := range transactions {
		dateStr := tx.Date.Format("2006-01-02")
		if _, ok := trendMap[dateStr]; !ok {
			trendMap[dateStr] = &DailyTrend{Date: dateStr}
		}
		if tx.Type == "income" {
			trendMap[dateStr].Income += tx.Amount
		} else {
			trendMap[dateStr].Expense += tx.Amount
		}
	}

	// Create continuous range
	for d := startDate; !d.After(endDate); d = d.AddDate(0, 0, 1) {
		dateStr := d.Format("2006-01-02")
		if _, ok := trendMap[dateStr]; !ok {
			trendMap[dateStr] = &DailyTrend{Date: dateStr, Income: 0, Expense: 0}
		}
	}

	// Convert to slice and sort
	var sortedTrends []DailyTrend
	for d := startDate; !d.After(endDate); d = d.AddDate(0, 0, 1) {
		dateStr := d.Format("2006-01-02")
		if trend, ok := trendMap[dateStr]; ok {
			sortedTrends = append(sortedTrends, *trend)
		} else {
			sortedTrends = append(sortedTrends, DailyTrend{Date: dateStr, Income: 0, Expense: 0})
		}
	}

	return sortedTrends, nil
}
