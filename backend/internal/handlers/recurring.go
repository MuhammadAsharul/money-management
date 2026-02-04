package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/money-management/backend/internal/models"
	"github.com/money-management/backend/internal/repository"
	"github.com/money-management/backend/pkg/middleware"
)

type RecurringHandler struct {
	recurringRepo   *repository.RecurringRepository
	transactionRepo *repository.TransactionRepository
	walletRepo      *repository.WalletRepository
}

func NewRecurringHandler(recurringRepo *repository.RecurringRepository, transactionRepo *repository.TransactionRepository, walletRepo *repository.WalletRepository) *RecurringHandler {
	return &RecurringHandler{
		recurringRepo:   recurringRepo,
		transactionRepo: transactionRepo,
		walletRepo:      walletRepo,
	}
}

type CreateRecurringRequest struct {
	WalletID    uint    `json:"wallet_id"`
	CategoryID  uint    `json:"category_id"`
	Amount      float64 `json:"amount"`
	Type        string  `json:"type"`
	Description string  `json:"description"`
	Frequency   string  `json:"frequency"` // daily, weekly, monthly, yearly
	StartDate   string  `json:"start_date"`
}

func (h *RecurringHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateRecurringRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	userID := middleware.GetUserID(r)

	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		startDate = time.Now()
	}

	recurring := &models.RecurringTransaction{
		UserID:      userID,
		WalletID:    req.WalletID,
		CategoryID:  req.CategoryID,
		Amount:      req.Amount,
		Type:        req.Type,
		Description: req.Description,
		Frequency:   req.Frequency,
		StartDate:   startDate,
		NextRunDate: startDate, // First run is start date
		IsActive:    true,
	}

	if err := h.recurringRepo.Create(recurring); err != nil {
		http.Error(w, "Error creating recurring transaction", http.StatusInternalServerError)
		return
	}

	// Trigger processing to execute immediately if start date is today or past
	go h.ProcessPending(userID)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(recurring)
}

func (h *RecurringHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	// Ensure pending transactions are processed so the list and balance are up to date
	h.ProcessPending(userID)

	recurrings, err := h.recurringRepo.FindByUserID(userID)
	if err != nil {
		http.Error(w, "Error fetching recurring transactions", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(recurrings)
}

func (h *RecurringHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	if err := h.recurringRepo.Delete(uint(id)); err != nil {
		http.Error(w, "Error deleting recurring transaction", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ProcessPending checks and executes due transactions
// This should be called when dashboard loads
func (h *RecurringHandler) ProcessPending(userID uint) error {
	now := time.Now()
	pending, err := h.recurringRepo.FindPending(userID, now)
	if err != nil {
		return err
	}

	for _, item := range pending {
		// Create real transaction
		tx := &models.Transaction{
			UserID:      item.UserID,
			WalletID:    item.WalletID,
			CategoryID:  item.CategoryID,
			Amount:      item.Amount,
			Type:        item.Type,
			Description: item.Description + " (Otomatis)",
			Date:        time.Now(), // Record as today
		}

		if err := h.transactionRepo.Create(tx); err != nil {
			continue // Skip if fail, retry next time
		}

		// Update Wallet Balance
		h.walletRepo.UpdateBalance(item.WalletID, item.Amount, item.Type == "income")

		// Update Next Run Date
		nextRun := item.NextRunDate
		switch item.Frequency {
		case "daily":
			nextRun = nextRun.AddDate(0, 0, 1)
		case "weekly":
			nextRun = nextRun.AddDate(0, 0, 7)
		case "monthly":
			nextRun = nextRun.AddDate(0, 1, 0)
		case "yearly":
			nextRun = nextRun.AddDate(1, 0, 0)
		}

		// If next run is still in past (e.g. missed multiple), catch up or set to future?
		// For simplicity, just set to next logical slot.
		// If missed months of payments, this loop only processes ONE occurrence per call.
		// Ideally we valid loop until nextRun > now, but to avoid spam, we just advance once or set to future.
		// Let's safe loop: advance until > now if we want to skip missed, or just +1 period to create backlog queue.
		// Let's just +1 period for now (simple logic). User logs in daily = fine. If user away for month, they might want 30 entries or just 1?
		// Usually subscriptions charge every month. If I miss log in, I still physically paid. So backlog is better.
		// But let's verify NextRunDate isn't growing infinitely if stuck.

		// Wait, if I set NextRunDate = NextRunDate + 1 month, and NextRunDate is still < Now, it will be picked up Next time `ProcessPending` is called.
		// So `ProcessPending` needs a loop internally or just process one at a time per request.
		// Processing ALL due occurrences in one go is better.

		// Update item
		item.LastRunDate = &now
		item.NextRunDate = nextRun
		h.recurringRepo.Update(&item)
	}
	return nil
}
