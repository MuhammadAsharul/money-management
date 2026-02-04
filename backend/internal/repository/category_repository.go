package repository

import (
	"github.com/money-management/backend/internal/models"
	"gorm.io/gorm"
)

type CategoryRepository struct {
	db *gorm.DB
}

func NewCategoryRepository(db *gorm.DB) *CategoryRepository {
	return &CategoryRepository{db: db}
}

func (r *CategoryRepository) Create(category *models.Category) error {
	return r.db.Create(category).Error
}

func (r *CategoryRepository) FindByID(id uint) (*models.Category, error) {
	var category models.Category
	err := r.db.First(&category, id).Error
	if err != nil {
		return nil, err
	}
	return &category, nil
}

func (r *CategoryRepository) FindByUserID(userID uint) ([]models.Category, error) {
	var categories []models.Category
	err := r.db.Where("user_id = ?", userID).Order("name asc").Find(&categories).Error
	return categories, err
}

func (r *CategoryRepository) FindByUserIDAndType(userID uint, categoryType string) ([]models.Category, error) {
	var categories []models.Category
	err := r.db.Where("user_id = ? AND type = ?", userID, categoryType).Order("name asc").Find(&categories).Error
	return categories, err
}

func (r *CategoryRepository) Update(category *models.Category) error {
	return r.db.Save(category).Error
}

func (r *CategoryRepository) Delete(id uint) error {
	return r.db.Delete(&models.Category{}, id).Error
}

func (r *CategoryRepository) CreateDefaultCategories(userID uint) error {
	defaultCategories := []models.Category{
		{UserID: userID, Name: "Gaji", Icon: "💰", Color: "#22c55e", Type: "income", IsDefault: true},
		{UserID: userID, Name: "Freelance", Icon: "💻", Color: "#3b82f6", Type: "income", IsDefault: true},
		{UserID: userID, Name: "Investasi", Icon: "📈", Color: "#8b5cf6", Type: "income", IsDefault: true},
		{UserID: userID, Name: "Makanan", Icon: "🍔", Color: "#f97316", Type: "expense", IsDefault: true},
		{UserID: userID, Name: "Transport", Icon: "🚗", Color: "#eab308", Type: "expense", IsDefault: true},
		{UserID: userID, Name: "Belanja", Icon: "🛒", Color: "#ec4899", Type: "expense", IsDefault: true},
		{UserID: userID, Name: "Hiburan", Icon: "🎬", Color: "#06b6d4", Type: "expense", IsDefault: true},
		{UserID: userID, Name: "Tagihan", Icon: "📄", Color: "#ef4444", Type: "expense", IsDefault: true},
		{UserID: userID, Name: "Kesehatan", Icon: "🏥", Color: "#14b8a6", Type: "expense", IsDefault: true},
	}

	for _, cat := range defaultCategories {
		if err := r.db.Create(&cat).Error; err != nil {
			return err
		}
	}
	return nil
}
