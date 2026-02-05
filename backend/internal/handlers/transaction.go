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

type TransactionHandler struct {
	transactionRepo     *repository.TransactionRepository
	walletRepo          *repository.WalletRepository
	categoryRepo        *repository.CategoryRepository
	gamificationHandler *GamificationHandler
}

func NewTransactionHandler(
	transactionRepo *repository.TransactionRepository,
	walletRepo *repository.WalletRepository,
	categoryRepo *repository.CategoryRepository,
	gh *GamificationHandler,
) *TransactionHandler {
	return &TransactionHandler{
		transactionRepo:     transactionRepo,
		walletRepo:          walletRepo,
		categoryRepo:        categoryRepo,
		gamificationHandler: gh,
	}
}

type CreateTransactionRequest struct {
	CategoryID  uint    `json:"category_id"`
	WalletID    uint    `json:"wallet_id"`
	Amount      float64 `json:"amount"`
	Currency    string  `json:"currency"` // Optional, defaults to IDR
	Type        string  `json:"type"`
	Description string  `json:"description"`
	Date        string  `json:"date"`
	Notes       string  `json:"notes"`
	ProofURL    string  `json:"proof_url"`
}

type UpdateTransactionRequest struct {
	CategoryID  uint    `json:"category_id"`
	WalletID    uint    `json:"wallet_id"`
	Amount      float64 `json:"amount"`
	Currency    string  `json:"currency"` // Optional, defaults to IDR
	Type        string  `json:"type"`
	Description string  `json:"description"`
	Date        string  `json:"date"`
	Notes       string  `json:"notes"`
	ProofURL    string  `json:"proof_url"`
}

type TransactionListResponse struct {
	Transactions []models.Transaction `json:"transactions"`
	Total        int64                `json:"total"`
	Page         int                  `json:"page"`
	Limit        int                  `json:"limit"`
}

func (h *TransactionHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 || limit > 100 {
		limit = 20
	}

	offset := (page - 1) * limit

	// Parse filters
	var startDate, endDate *time.Time
	if s := r.URL.Query().Get("start_date"); s != "" {
		if t, err := time.Parse("2006-01-02", s); err == nil {
			startDate = &t
		}
	}
	if e := r.URL.Query().Get("end_date"); e != "" {
		if t, err := time.Parse("2006-01-02", e); err == nil {
			// Set to end of day
			t = t.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
			endDate = &t
		}
	}

	var categoryID *uint
	if c := r.URL.Query().Get("category_id"); c != "" {
		if id, err := strconv.ParseUint(c, 10, 32); err == nil {
			uid := uint(id)
			categoryID = &uid
		}
	}

	search := r.URL.Query().Get("search")
	transactionType := r.URL.Query().Get("type")

	transactions, total, err := h.transactionRepo.Search(userID, startDate, endDate, categoryID, transactionType, search, limit, offset)
	if err != nil {
		http.Error(w, "Error fetching transactions", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(TransactionListResponse{
		Transactions: transactions,
		Total:        total,
		Page:         page,
		Limit:        limit,
	})
}

func (h *TransactionHandler) Get(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		http.Error(w, "Invalid transaction ID", http.StatusBadRequest)
		return
	}

	transaction, err := h.transactionRepo.FindByID(uint(id))
	if err != nil {
		http.Error(w, "Transaction not found", http.StatusNotFound)
		return
	}

	userID := middleware.GetUserID(r)
	if transaction.UserID != userID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(transaction)
}

func (h *TransactionHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateTransactionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	userID := middleware.GetUserID(r)

	// Get default wallet if not specified
	// Get default wallet if not specified
	walletID := req.WalletID
	if walletID == 0 {
		defaultWallet, _ := h.walletRepo.FindDefaultByUserID(userID)
		if defaultWallet != nil {
			walletID = defaultWallet.ID
		} else {
			// Fallback to any wallet
			anyWallet, _ := h.walletRepo.FindFirstByUserID(userID)
			if anyWallet != nil {
				walletID = anyWallet.ID
			}
		}
	}

	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		date = time.Now()
	}

	// Handle currency conversion
	currency := req.Currency
	if currency == "" {
		currency = "IDR"
	}

	originalAmount := req.Amount
	exchangeRate := 1.0
	amountInIDR := req.Amount

	// If not IDR, we'll store the original and convert
	// Rate conversion happens on frontend or via API call
	// For now, we trust the frontend to send converted amount
	// This allows offline mode to work with manual conversion

	transaction := &models.Transaction{
		UserID:         userID,
		CategoryID:     req.CategoryID,
		WalletID:       walletID,
		Amount:         amountInIDR,
		OriginalAmount: originalAmount,
		Currency:       currency,
		ExchangeRate:   exchangeRate,
		Type:           req.Type,
		Description:    req.Description,
		Date:           date,
		Notes:          req.Notes,
		ProofURL:       req.ProofURL,
	}

	if err := h.transactionRepo.Create(transaction); err != nil {
		http.Error(w, "Error creating transaction", http.StatusInternalServerError)
		return
	}

	// Update wallet balance
	h.walletRepo.UpdateBalance(walletID, req.Amount, req.Type == "income")

	// Gamification: Update Streak and XP
	// 50 XP for every transaction
	go func() {
		h.gamificationHandler.UpdateStreak(userID, transaction.Date)
		h.gamificationHandler.AddXP(userID, 50)
	}()

	// Fetch with category
	transaction, _ = h.transactionRepo.FindByID(transaction.ID)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(transaction)
}

func (h *TransactionHandler) Update(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		http.Error(w, "Invalid transaction ID", http.StatusBadRequest)
		return
	}

	transaction, err := h.transactionRepo.FindByID(uint(id))
	if err != nil {
		http.Error(w, "Transaction not found", http.StatusNotFound)
		return
	}

	userID := middleware.GetUserID(r)
	if transaction.UserID != userID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	var req UpdateTransactionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		date = transaction.Date
	}

	// Revert previous balance impact
	// If old was income, we now subtract (isIncome=false)
	// If old was expense, we now add (isIncome=true)
	isOldReversal := transaction.Type == "expense"
	// Note: We use the OLD amount and OLD type here
	if err := h.walletRepo.UpdateBalance(transaction.WalletID, transaction.Amount, isOldReversal); err != nil {
		http.Error(w, "Error reverting wallet balance", http.StatusInternalServerError)
		return
	}

	transaction.CategoryID = req.CategoryID
	transaction.Amount = req.Amount
	transaction.Type = req.Type
	transaction.Description = req.Description
	transaction.Date = date
	transaction.Notes = req.Notes
	transaction.ProofURL = req.ProofURL

	// Apply NEW balance impact
	isNewIncome := req.Type == "income"
	if err := h.walletRepo.UpdateBalance(transaction.WalletID, req.Amount, isNewIncome); err != nil {
		http.Error(w, "Error updating new wallet balance", http.StatusInternalServerError)
		return
	}

	if err := h.transactionRepo.Update(transaction); err != nil {
		http.Error(w, "Error updating transaction", http.StatusInternalServerError)
		return
	}

	// Fetch with category
	transaction, _ = h.transactionRepo.FindByID(transaction.ID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(transaction)
}

func (h *TransactionHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		http.Error(w, "Invalid transaction ID", http.StatusBadRequest)
		return
	}

	transaction, err := h.transactionRepo.FindByID(uint(id))
	if err != nil {
		http.Error(w, "Transaction not found", http.StatusNotFound)
		return
	}

	userID := middleware.GetUserID(r)
	if transaction.UserID != userID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	// Revert wallet balance
	// If it was an expense, we add money back (isIncome = true)
	// If it was an income, we remove money (isIncome = false)
	isReversal := transaction.Type == "expense"
	if err := h.walletRepo.UpdateBalance(transaction.WalletID, transaction.Amount, isReversal); err != nil {
		http.Error(w, "Error updating wallet balance", http.StatusInternalServerError)
		return
	}

	if err := h.transactionRepo.Delete(uint(id)); err != nil {
		// If delete fails, we might want to revert the balance change?
		// For now simple implementation. ideally transaction.
		http.Error(w, "Error deleting transaction", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

type TransferRequest struct {
	SourceWalletID uint    `json:"source_wallet_id"`
	TargetWalletID uint    `json:"target_wallet_id"`
	Amount         float64 `json:"amount"`
	Description    string  `json:"description"`
	Date           string  `json:"date"`
}

func (h *TransactionHandler) Transfer(w http.ResponseWriter, r *http.Request) {
	var req TransferRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.SourceWalletID == req.TargetWalletID {
		http.Error(w, "Source and target wallets must be different", http.StatusBadRequest)
		return
	}

	userID := middleware.GetUserID(r)

	// Verify Source Wallet
	sourceWallet, err := h.walletRepo.FindByID(req.SourceWalletID)
	if err != nil || sourceWallet.UserID != userID {
		http.Error(w, "Source wallet not found or access denied", http.StatusBadRequest)
		return
	}

	// Verify Target Wallet
	targetWallet, err := h.walletRepo.FindByID(req.TargetWalletID)
	if err != nil || targetWallet.UserID != userID {
		http.Error(w, "Target wallet not found or access denied", http.StatusBadRequest)
		return
	}

	// Parse date
	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		date = time.Now()
	}

	// Find or Create "Transfer" category
	// We need 2 categories? Or one?
	// Usually "Transfer Out" (Expense) and "Transfer In" (Income).
	// Let's try to find a generic "Transfer" category.
	// Since we don't have a "FindByName" easily exposed maybe, let's just pick the first one matching "Transfer" or create it.
	// Actually, let's keep it simple: Try to find a category named "Transfer"
	// If not found, use the first available category as fallback to avoid errors.
	var categoryID uint
	categories, _ := h.categoryRepo.FindByUserID(userID)
	for _, c := range categories {
		if c.Name == "Transfer" || c.Name == "Transfer Out" || c.Name == "Transfer In" {
			categoryID = c.ID
			break
		}
	}

	// If not found, create new "Transfer" category
	if categoryID == 0 {
		newCat := &models.Category{
			UserID:      userID,
			Name:        "Transfer",
			Icon:        "🔄",       // Transfer emoji
			Color:       "#808080", // Grey
			Type:        "expense", // Default to expense? Or doesn't matter much if we filter.
			IsDefault:   false,
			IsEssential: false,
		}
		if err := h.categoryRepo.Create(newCat); err == nil {
			categoryID = newCat.ID
		} else {
			// Fallback if create fails (shouldn't happen often)
			if len(categories) > 0 {
				categoryID = categories[0].ID
			}
		}
	}

	// 1. Create Expense from Source
	expenseTx := &models.Transaction{
		UserID:      userID,
		WalletID:    req.SourceWalletID,
		CategoryID:  categoryID,
		Amount:      req.Amount,
		Type:        "expense",
		Description: "Transfer ke " + targetWallet.Name,
		Date:        date,
		Notes:       req.Description,
	}

	if err := h.transactionRepo.Create(expenseTx); err != nil {
		http.Error(w, "Error processing transfer (debit)", http.StatusInternalServerError)
		return
	}
	h.walletRepo.UpdateBalance(req.SourceWalletID, req.Amount, false)

	// 2. Create Income to Target
	incomeTx := &models.Transaction{
		UserID:      userID,
		WalletID:    req.TargetWalletID,
		CategoryID:  categoryID,
		Amount:      req.Amount,
		Type:        "income",
		Description: "Transfer dari " + sourceWallet.Name,
		Date:        date,
		Notes:       req.Description,
	}

	if err := h.transactionRepo.Create(incomeTx); err != nil {
		// This is bad state if first one succeeded.
		// Detailed handling omitted for MVP (should use DB transaction).
		http.Error(w, "Error processing transfer (credit)", http.StatusInternalServerError)
		return
	}
	h.walletRepo.UpdateBalance(req.TargetWalletID, req.Amount, true)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Transfer successful"})
}
