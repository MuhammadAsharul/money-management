package repository

import (
	"github.com/money-management/backend/internal/models"
	"github.com/money-management/backend/pkg/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB(cfg *config.Config) error {
	var err error
	DB, err = gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return err
	}

	// Auto migrate
	err = DB.AutoMigrate(
		&models.User{},
		&models.Wallet{},
		&models.Category{},
		&models.Transaction{},
		&models.Budget{},
		&models.Goal{},
		&models.GoalMember{},
		&models.GoalTransaction{},
		&models.RecurringTransaction{},
		&models.GoalItem{},
		&models.Badge{},
		&models.UserBadge{},
	)
	if err != nil {
		return err
	}

	return nil
}

func GetDB() *gorm.DB {
	return DB
}
