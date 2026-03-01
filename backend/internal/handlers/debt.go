package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/money-management/backend/internal/models"
	"github.com/money-management/backend/pkg/middleware"
	"gorm.io/gorm"
)

type DebtHandler struct {
	db *gorm.DB
}

func NewDebtHandler(db *gorm.DB) *DebtHandler {
	return &DebtHandler{db: db}
}

func (h *DebtHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	var debts []models.Debt

	// Optional filtering by type
	debtType := r.URL.Query().Get("type")

	query := h.db.Where("user_id = ?", userID)
	if debtType != "" {
		query = query.Where("type = ?", debtType)
	}

	if err := query.Find(&debts).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(debts)
}

func (h *DebtHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	var payload struct {
		Type              string  `json:"type"`
		PersonName        string  `json:"person_name"`
		Amount            float64 `json:"amount"`
		InstallmentAmount float64 `json:"installment_amount"`
		Description       string  `json:"description"`
		BorrowedDate      string  `json:"borrowed_date"`
		DueDate           string  `json:"due_date"`
		Status            string  `json:"status"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Helper to parse date YYYY-MM-DD
	parseDate := func(dateStr string) *time.Time {
		if dateStr == "" {
			return nil
		}
		t, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			return nil
		}
		return &t
	}

	var debt models.Debt

	debt.UserID = userID
	debt.Status = "unpaid" // Default status
	debt.Type = payload.Type
	debt.PersonName = payload.PersonName
	debt.Amount = payload.Amount
	debt.RemainingAmount = payload.Amount // Set intial remaining amount to total amount
	debt.InstallmentAmount = payload.InstallmentAmount
	debt.Description = payload.Description
	debt.BorrowedDate = parseDate(payload.BorrowedDate)
	debt.DueDate = parseDate(payload.DueDate)

	if err := h.db.Create(&debt).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(debt)
}

func (h *DebtHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	idTemp := chi.URLParam(r, "id")
	id, _ := strconv.Atoi(idTemp)

	var debt models.Debt
	if err := h.db.Where("id = ? AND user_id = ?", id, userID).First(&debt).Error; err != nil {
		http.Error(w, "Debt not found", http.StatusNotFound)
		return
	}

	var payload struct {
		Type              string  `json:"type"`
		PersonName        string  `json:"person_name"`
		Amount            float64 `json:"amount"`
		RemainingAmount   float64 `json:"remaining_amount"`
		InstallmentAmount float64 `json:"installment_amount"`
		Description       string  `json:"description"`
		BorrowedDate      string  `json:"borrowed_date"`
		DueDate           string  `json:"due_date"`
		Status            string  `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Helper to parse date YYYY-MM-DD
	parseDate := func(dateStr string) *time.Time {
		if dateStr == "" {
			return nil
		}
		t, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			return nil
		}
		return &t
	}

	// Update fields
	debt.PersonName = payload.PersonName
	debt.Amount = payload.Amount

	// If remaining amount is provided in update, use it, else keep it or recalculate?
	// Usually users might not update remaining amount directly but let's allow it if sent
	if payload.RemainingAmount > 0 {
		debt.RemainingAmount = payload.RemainingAmount
	} else if debt.RemainingAmount == 0 && payload.Amount != debt.Amount {
		// Just a fallback
		debt.RemainingAmount = payload.Amount
	}

	debt.InstallmentAmount = payload.InstallmentAmount
	debt.Type = payload.Type
	debt.Description = payload.Description
	debt.BorrowedDate = parseDate(payload.BorrowedDate)
	debt.DueDate = parseDate(payload.DueDate)
	debt.Status = payload.Status

	if err := h.db.Save(&debt).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(debt)
}

func (h *DebtHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	idTemp := chi.URLParam(r, "id")
	id, _ := strconv.Atoi(idTemp)

	if err := h.db.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Debt{}).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *DebtHandler) PayInstallment(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	idTemp := chi.URLParam(r, "id")
	id, _ := strconv.Atoi(idTemp)

	var payload struct {
		Amount     float64 `json:"amount"`
		WalletID   uint    `json:"wallet_id"`
		CategoryID uint    `json:"category_id"` // Category for the transaction
		Date       string  `json:"date"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if payload.Amount <= 0 {
		http.Error(w, "Amount must be greater than 0", http.StatusBadRequest)
		return
	}

	// Start a database transaction
	tx := h.db.Begin()
	if tx.Error != nil {
		http.Error(w, "Could not start transaction", http.StatusInternalServerError)
		return
	}

	// 1. Get Debt
	var debt models.Debt
	if err := tx.Where("id = ? AND user_id = ?", id, userID).First(&debt).Error; err != nil {
		tx.Rollback()
		http.Error(w, "Debt not found", http.StatusNotFound)
		return
	}

	if debt.Status == "paid" {
		tx.Rollback()
		http.Error(w, "Debt is already paid", http.StatusBadRequest)
		return
	}

	// 2. Update Debt Remaining Amount
	debt.RemainingAmount -= payload.Amount
	if debt.RemainingAmount <= 0 {
		debt.RemainingAmount = 0
		debt.Status = "paid"
	}

	if err := tx.Save(&debt).Error; err != nil {
		tx.Rollback()
		http.Error(w, "Failed to update debt", http.StatusInternalServerError)
		return
	}

	// 3. Update Wallet Balance
	var wallet models.Wallet
	if err := tx.Where("id = ? AND user_id = ?", payload.WalletID, userID).First(&wallet).Error; err != nil {
		tx.Rollback()
		http.Error(w, "Wallet not found", http.StatusNotFound)
		return
	}

	// If 'payable' (I owe someone), paying it is an Expense (decrease wallet balance)
	// If 'receivable' (Someone owes me), paying it is Income (increase wallet balance)
	transactionType := "expense"
	if debt.Type == "payable" {
		wallet.Balance -= payload.Amount
	} else {
		transactionType = "income"
		wallet.Balance += payload.Amount
	}

	if err := tx.Save(&wallet).Error; err != nil {
		tx.Rollback()
		http.Error(w, "Failed to update wallet", http.StatusInternalServerError)
		return
	}

	// 4. Create Transaction Record
	paymentDate := time.Now()
	if payload.Date != "" {
		if parsedDate, err := time.Parse("2006-01-02", payload.Date); err == nil {
			paymentDate = parsedDate
		}
	}

	newTx := models.Transaction{
		UserID:         userID,
		WalletID:       payload.WalletID,
		CategoryID:     payload.CategoryID,
		Amount:         payload.Amount,
		OriginalAmount: payload.Amount,
		Currency:       "IDR",
		ExchangeRate:   1,
		Type:           transactionType,
		Description:    "Pembayaran " + debt.PersonName + " - " + debt.Description, // e.g. "Pembayaran Budi - Utang Makan"
		Notes:          "Cicilan otomatis dari fitur Utang",
		Date:           paymentDate,
	}

	if err := tx.Create(&newTx).Error; err != nil {
		tx.Rollback()
		http.Error(w, "Failed to create transaction", http.StatusInternalServerError)
		return
	}

	// Commit
	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
		return
	}

	// Return updated debt
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(debt)
}
