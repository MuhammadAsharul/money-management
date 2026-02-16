package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/money-management/backend/internal/models"
	"github.com/money-management/backend/internal/repository"
	"github.com/money-management/backend/pkg/middleware"
	"gorm.io/gorm"
)

type AnalyticsHandler struct {
	db              *gorm.DB
	walletRepo      *repository.WalletRepository
	transactionRepo *repository.TransactionRepository
}

func NewAnalyticsHandler(db *gorm.DB, walletRepo *repository.WalletRepository, transactionRepo *repository.TransactionRepository) *AnalyticsHandler {
	return &AnalyticsHandler{
		db:              db,
		walletRepo:      walletRepo,
		transactionRepo: transactionRepo,
	}
}

type NetWorthResponse struct {
	TotalAssets      float64           `json:"total_assets"`
	TotalLiabilities float64           `json:"total_liabilities"`
	NetWorth         float64           `json:"net_worth"`
	Currency         string            `json:"currency"`
	History          []NetWorthHistory `json:"history"`
}

type NetWorthHistory struct {
	Month   string  `json:"month"` // "Jan 2024"
	Date    string  `json:"date"`  // "2024-01-31"
	Balance float64 `json:"balance"`
	Income  float64 `json:"income"`
	Expense float64 `json:"expense"`
}

func (h *AnalyticsHandler) GetNetWorth(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	log.Printf("[NetWorth] Request from userID: %d", userID)

	// 1. Get Current Wallet Balance (Cash Assets)
	totalWalletBalance, err := h.walletRepo.GetTotalBalance(userID)
	if err != nil {
		log.Printf("[NetWorth] ERROR getting wallet balance: %v", err)
		http.Error(w, "Failed to get wallet balance", http.StatusInternalServerError)
		return
	}
	log.Printf("[NetWorth] Wallet balance: %.2f", totalWalletBalance)

	// 2. Get Debt (Receivables/Payables) - non-blocking
	var debts []models.Debt
	if err := h.db.Where("user_id = ? AND status = ?", userID, "unpaid").Find(&debts).Error; err != nil {
		log.Printf("[NetWorth] Warning: Failed to get debts (table may not exist): %v", err)
		// Continue without debt data - not a fatal error
		debts = []models.Debt{}
	}

	var receivables, payables float64
	for _, debt := range debts {
		if debt.Type == "payable" { // Hutang (Liabilities)
			payables += debt.Amount
		} else { // Piutang (Assets)
			receivables += debt.Amount
		}
	}

	totalAssets := totalWalletBalance + receivables
	totalLiabilities := payables
	currentNetWorth := totalAssets - totalLiabilities

	// 3. Calculate History (Last 6 Months)
	// We calculate backward from current Wallet Balance
	// NetWorthHistory here mainly tracks "Liquid Net Worth" (Wallet Balance trend)
	// because tracking historical debt changes is complex without audit trails.

	history := make([]NetWorthHistory, 6)
	currentCalcBalance := totalWalletBalance
	now := time.Now()

	for i := 0; i < 6; i++ {
		// Calculate range for this month
		// If i=0 (current month), range is StartOfMonth to Now
		// If i=1 (last month), range is StartOfMonth to EndOfMonth

		targetDate := now.AddDate(0, -i, 0)
		monthStart := time.Date(targetDate.Year(), targetDate.Month(), 1, 0, 0, 0, 0, targetDate.Location())
		monthEnd := monthStart.AddDate(0, 1, 0).Add(-1 * time.Second)

		if i == 0 {
			monthEnd = now
		}

		summary, _ := h.transactionRepo.GetSummary(userID, monthStart, monthEnd)

		// The balance at the END of this month
		// If i=0, it is current balance
		// If i>0, it is Balance(NextMonthStart) - Income(NextMonth) + Expense(NextMonth)
		// But simpler: We assume currentCalcBalance is the balance at END of month i.
		// Then for i+1 (previous month), Balance = currentCalcBalance - Income(i) + Expense(i)

		history[5-i] = NetWorthHistory{
			Month:   monthStart.Format("Jan 2006"),
			Date:    monthEnd.Format("2006-01-02"),
			Balance: currentCalcBalance,
			Income:  summary.TotalIncome,
			Expense: summary.TotalExpense,
		}

		// Prepare balance for the PREVIOUS month loop
		// Balance_Prev = Balance_Curr - Income_Curr + Expense_Curr
		currentCalcBalance = currentCalcBalance - summary.TotalIncome + summary.TotalExpense
	}

	resp := NetWorthResponse{
		TotalAssets:      totalAssets,
		TotalLiabilities: totalLiabilities,
		NetWorth:         currentNetWorth,
		Currency:         "IDR",
		History:          history,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
