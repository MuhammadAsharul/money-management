package repository

import (
	"github.com/money-management/backend/internal/models"
	"gorm.io/gorm"
)

type WalletRepository struct {
	db *gorm.DB
}

func NewWalletRepository(db *gorm.DB) *WalletRepository {
	return &WalletRepository{db: db}
}

func (r *WalletRepository) Create(wallet *models.Wallet) error {
	return r.db.Create(wallet).Error
}

func (r *WalletRepository) FindByID(id uint) (*models.Wallet, error) {
	var wallet models.Wallet
	err := r.db.First(&wallet, id).Error
	if err != nil {
		return nil, err
	}
	return &wallet, nil
}

func (r *WalletRepository) FindByUserID(userID uint) ([]models.Wallet, error) {
	var wallets []models.Wallet
	err := r.db.Where("user_id = ?", userID).Order("is_default desc, name asc").Find(&wallets).Error
	return wallets, err
}

func (r *WalletRepository) FindDefaultByUserID(userID uint) (*models.Wallet, error) {
	var wallet models.Wallet
	err := r.db.Where("user_id = ? AND is_default = ?", userID, true).First(&wallet).Error
	if err != nil {
		return nil, err
	}
	return &wallet, nil
}

func (r *WalletRepository) FindFirstByUserID(userID uint) (*models.Wallet, error) {
	var wallet models.Wallet
	err := r.db.Where("user_id = ?", userID).First(&wallet).Error
	if err != nil {
		return nil, err
	}
	return &wallet, nil
}

func (r *WalletRepository) Update(wallet *models.Wallet) error {
	return r.db.Save(wallet).Error
}

func (r *WalletRepository) Delete(id uint) error {
	return r.db.Delete(&models.Wallet{}, id).Error
}

func (r *WalletRepository) UpdateBalance(walletID uint, amount float64, isIncome bool) error {
	var wallet models.Wallet
	if err := r.db.First(&wallet, walletID).Error; err != nil {
		return err
	}

	if isIncome {
		wallet.Balance += amount
	} else {
		wallet.Balance -= amount
	}

	return r.db.Save(&wallet).Error
}

func (r *WalletRepository) CreateDefaultWallet(userID uint) error {
	wallet := &models.Wallet{
		UserID:      userID,
		Name:        "Dompet Utama",
		Icon:        "💰",
		Color:       "#22c55e",
		Balance:     0,
		IsDefault:   true,
		Description: "Dompet utama Anda",
	}
	return r.db.Create(wallet).Error
}

func (r *WalletRepository) ClearDefault(userID uint) error {
	return r.db.Model(&models.Wallet{}).
		Where("user_id = ? AND is_default = ?", userID, true).
		Update("is_default", false).Error
}

func (r *WalletRepository) RecalculateBalance(walletID uint) error {
	var wallet models.Wallet
	if err := r.db.First(&wallet, walletID).Error; err != nil {
		return err
	}

	var totalIncome float64
	var totalExpense float64

	r.db.Model(&models.Transaction{}).
		Where("wallet_id = ? AND type = ?", walletID, "income").
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalIncome)

	r.db.Model(&models.Transaction{}).
		Where("wallet_id = ? AND type = ?", walletID, "expense").
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalExpense)

	wallet.Balance = totalIncome - totalExpense
	return r.db.Save(&wallet).Error
}

func (r *WalletRepository) GetTotalBalance(userID uint) (float64, error) {
	var total float64
	err := r.db.Model(&models.Wallet{}).
		Where("user_id = ?", userID).
		Select("COALESCE(SUM(balance), 0)").
		Scan(&total).Error
	return total, err
}
