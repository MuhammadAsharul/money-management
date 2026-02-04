package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/money-management/backend/internal/models"
	"github.com/money-management/backend/internal/repository"
	"github.com/money-management/backend/pkg/middleware"
)

type DataHandler struct {
	transactionRepo *repository.TransactionRepository
	categoryRepo    *repository.CategoryRepository
	walletRepo      *repository.WalletRepository
	budgetRepo      *repository.BudgetRepository
	goalRepo        *repository.GoalRepository
}

func NewDataHandler(
	transactionRepo *repository.TransactionRepository,
	categoryRepo *repository.CategoryRepository,
	walletRepo *repository.WalletRepository,
	budgetRepo *repository.BudgetRepository,
	goalRepo *repository.GoalRepository,
) *DataHandler {
	return &DataHandler{
		transactionRepo: transactionRepo,
		categoryRepo:    categoryRepo,
		walletRepo:      walletRepo,
		budgetRepo:      budgetRepo,
		goalRepo:        goalRepo,
	}
}

type BackupData struct {
	ExportDate   time.Time            `json:"export_date"`
	Wallets      []models.Wallet      `json:"wallets"`
	Categories   []models.Category    `json:"categories"`
	Transactions []models.Transaction `json:"transactions"`
	Goals        []models.Goal        `json:"goals"`
	Budgets      []models.Budget      `json:"budgets"`
}

func (h *DataHandler) Export(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	// Fetch all data
	// Using list methods with large limits or simple finds
	// Repos might need "FindAllByUserID" without limits

	// Wallets
	wallets, err := h.walletRepo.FindByUserID(userID)
	if err != nil {
		wallets = []models.Wallet{}
	}

	// Categories
	categories, err := h.categoryRepo.FindByUserID(userID)
	if err != nil {
		categories = []models.Category{}
	}

	// Transactions (Fetch all? might be heavy. Let's do recent 10000 or implement FindAll)
	// Reusing FindByUserID with large limit
	transactions, _, err := h.transactionRepo.FindByUserID(userID, 10000, 0)
	if err != nil {
		transactions = []models.Transaction{}
	}

	// Goals
	goals, err := h.goalRepo.FindByUserID(userID)
	if err != nil {
		goals = []models.Goal{}
	}

	// Budgets
	budgets, err := h.budgetRepo.FindByUserID(userID)
	if err != nil {
		budgets = []models.Budget{}
	}

	data := BackupData{
		ExportDate:   time.Now(),
		Wallets:      wallets,
		Categories:   categories,
		Transactions: transactions,
		Goals:        goals,
		Budgets:      budgets,
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Disposition", "attachment; filename=money-management-backup.json")
	json.NewEncoder(w).Encode(data)
}

func (h *DataHandler) Import(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	// Parse file from request
	file, _, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Invalid file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	var data BackupData
	if err := json.NewDecoder(file).Decode(&data); err != nil {
		http.Error(w, "Invalid JSON format", http.StatusBadRequest)
		return
	}

	db := repository.GetDB()
	tx := db.Begin()

	// Generic delete function
	deleteForUser := func(model interface{}) error {
		return tx.Where("user_id = ?", userID).Delete(model).Error
	}

	// 1. Delete existing data (Order matters for FK)
	// Dependent tables first
	if err := deleteForUser(&models.GoalItem{}); err != nil {
		tx.Rollback()
		http.Error(w, "Error clearing old data", http.StatusInternalServerError)
		return
	}
	if err := deleteForUser(&models.RecurringTransaction{}); err != nil {
		tx.Rollback()
		http.Error(w, "Error clearing old data", http.StatusInternalServerError)
		return
	}
	if err := deleteForUser(&models.Transaction{}); err != nil {
		tx.Rollback()
		http.Error(w, "Error clearing old data", http.StatusInternalServerError)
		return
	}
	if err := deleteForUser(&models.Budget{}); err != nil {
		tx.Rollback()
		http.Error(w, "Error clearing old data", http.StatusInternalServerError)
		return
	}
	if err := deleteForUser(&models.Goal{}); err != nil {
		tx.Rollback()
		http.Error(w, "Error clearing old data", http.StatusInternalServerError)
		return
	}
	// Independent tables
	if err := deleteForUser(&models.Wallet{}); err != nil {
		tx.Rollback()
		http.Error(w, "Error clearing old data", http.StatusInternalServerError)
		return
	}
	if err := deleteForUser(&models.Category{}); err != nil {
		tx.Rollback()
		http.Error(w, "Error clearing old data", http.StatusInternalServerError)
		return
	}

	// 2. Insert new data (Order matters for FK)
	// Independent tables first
	for _, walletItem := range data.Wallets {
		walletItem.UserID = userID // Force UserID security
		if err := tx.Create(&walletItem).Error; err != nil {
			tx.Rollback()
			http.Error(w, "Error restoring wallets", http.StatusInternalServerError)
			return
		}
	}
	for _, c := range data.Categories {
		c.UserID = userID
		if err := tx.Create(&c).Error; err != nil {
			tx.Rollback()
			http.Error(w, "Error restoring categories", http.StatusInternalServerError)
			return
		}
	}
	for _, b := range data.Budgets {
		b.UserID = userID
		if err := tx.Create(&b).Error; err != nil {
			tx.Rollback()
			http.Error(w, "Error restoring budgets", http.StatusInternalServerError)
			return
		}
	}
	for _, g := range data.Goals {
		g.UserID = userID
		if err := tx.Create(&g).Error; err != nil {
			tx.Rollback()
			http.Error(w, "Error restoring goals", http.StatusInternalServerError)
			return
		}
	}
	// Transactions must come after Wallets and Categories because of FK
	for _, t := range data.Transactions {
		t.UserID = userID
		if err := tx.Create(&t).Error; err != nil {
			tx.Rollback()
			http.Error(w, "Error restoring transactions", http.StatusInternalServerError)
			return
		}
	}

	if err := tx.Commit().Error; err != nil {
		http.Error(w, "Error committing transaction", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Data restored successfully"})
}
