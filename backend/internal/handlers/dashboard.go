package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/money-management/backend/internal/models"
	"github.com/money-management/backend/internal/repository"
	"github.com/money-management/backend/pkg/middleware"
)

type DashboardHandler struct {
	transactionRepo *repository.TransactionRepository
	budgetRepo      *repository.BudgetRepository
	categoryRepo    *repository.CategoryRepository
	walletRepo      *repository.WalletRepository
	recurringRepo   *repository.RecurringRepository
}

func NewDashboardHandler(
	transactionRepo *repository.TransactionRepository,
	budgetRepo *repository.BudgetRepository,
	categoryRepo *repository.CategoryRepository,
	walletRepo *repository.WalletRepository,
	recurringRepo *repository.RecurringRepository,
) *DashboardHandler {
	return &DashboardHandler{
		transactionRepo: transactionRepo,
		budgetRepo:      budgetRepo,
		categoryRepo:    categoryRepo,
		walletRepo:      walletRepo,
		recurringRepo:   recurringRepo,
	}
}

type DashboardSummary struct {
	TotalIncome        float64                 `json:"total_income"`
	TotalExpense       float64                 `json:"total_expense"`
	Balance            float64                 `json:"balance"`
	TransactionCount   int64                   `json:"transaction_count"`
	RecentTransactions []interface{}           `json:"recent_transactions"`
	CategorySpending   []CategorySpending      `json:"category_spending"`
	BudgetProgress     []BudgetProgress        `json:"budget_progress"`
	DailyTrends        []repository.DailyTrend `json:"daily_trends"`
	IncomeChangePct    float64                 `json:"income_change_pct"`
	ExpenseChangePct   float64                 `json:"expense_change_pct"`
	MonthlyIncome      float64                 `json:"monthly_income"`
	MonthlyExpense     float64                 `json:"monthly_expense"`
}

type CategorySpending struct {
	CategoryID   uint    `json:"category_id"`
	CategoryName string  `json:"category_name"`
	CategoryIcon string  `json:"category_icon"`
	Color        string  `json:"color"`
	Amount       float64 `json:"amount"`
	Percentage   float64 `json:"percentage"`
	ChangePct    float64 `json:"change_pct"` // Percentage change vs previous period
}

type BudgetProgress struct {
	CategoryID   uint    `json:"category_id"`
	CategoryName string  `json:"category_name"`
	BudgetAmount float64 `json:"budget_amount"`
	SpentAmount  float64 `json:"spent_amount"`
	Remaining    float64 `json:"remaining"`
	Percentage   float64 `json:"percentage"`
}

func (h *DashboardHandler) GetSummary(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	period := r.URL.Query().Get("period") // daily, weekly, monthly, yearly

	// Check and process recurring transactions
	h.processRecurringTransactions(userID)

	now := time.Now()
	var start, end time.Time

	switch period {
	case "daily":
		start = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		end = start.Add(24 * time.Hour).Add(-1 * time.Second)
	case "weekly":
		// Start of week (Monday as start?)
		weekday := int(now.Weekday())
		if weekday == 0 {
			weekday = 7
		} // Sunday
		start = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location()).AddDate(0, 0, -weekday+1)
		end = start.AddDate(0, 0, 7).Add(-1 * time.Second)
	case "yearly":
		start = time.Date(now.Year(), 1, 1, 0, 0, 0, 0, now.Location())
		end = start.AddDate(1, 0, 0).Add(-1 * time.Second)
	case "monthly":
		fallthrough
	default:
		start = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		end = start.AddDate(0, 1, 0).Add(-1 * time.Second)
	}

	// Calculate previous period for comparison
	var prevStart, prevEnd time.Time
	switch period {
	case "daily":
		prevStart = start.AddDate(0, 0, -1)
		prevEnd = end.AddDate(0, 0, -1)
	case "weekly":
		prevStart = start.AddDate(0, 0, -7)
		prevEnd = end.AddDate(0, 0, -7)
	case "yearly":
		prevStart = start.AddDate(-1, 0, 0)
		prevEnd = end.AddDate(-1, 0, 0)
	case "monthly":
		fallthrough
	default:
		prevStart = start.AddDate(0, -1, 0)
		prevEnd = end.AddDate(0, -1, 0)
	}

	// Get transaction summary
	summary, err := h.transactionRepo.GetSummary(userID, start, end)
	if err != nil {
		http.Error(w, "Error fetching summary", http.StatusInternalServerError)
		return
	}

	// Get previous summary
	prevSummary, _ := h.transactionRepo.GetSummary(userID, prevStart, prevEnd)

	// Get Current Month Summary (Always)
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	monthEnd := monthStart.AddDate(0, 1, 0).Add(-1 * time.Second)
	monthlySummary, _ := h.transactionRepo.GetSummary(userID, monthStart, monthEnd)

	// Calculate percentages
	calcPct := func(current, prev float64) float64 {
		if prev == 0 {
			if current > 0 {
				return 100
			}
			return 0
		}
		return ((current - prev) / prev) * 100
	}

	incomePct := calcPct(summary.TotalIncome, prevSummary.TotalIncome)
	expensePct := calcPct(summary.TotalExpense, prevSummary.TotalExpense)

	// Get recent transactions
	transactions, _, _ := h.transactionRepo.FindByUserID(userID, 5, 0)

	// Get category spending CURRENT period
	categorySpending, _ := h.transactionRepo.GetCategorySpending(userID, start, end)
	// Get category spending PREVIOUS period
	prevCategorySpending, _ := h.transactionRepo.GetCategorySpending(userID, prevStart, prevEnd)

	categories, _ := h.categoryRepo.FindByUserID(userID)

	var spendingList []CategorySpending
	totalExpense := summary.TotalExpense
	for _, cat := range categories {
		if spent, ok := categorySpending[cat.ID]; ok && spent > 0 {
			percentage := 0.0
			if totalExpense > 0 {
				percentage = (spent / totalExpense) * 100
			}

			// Calculate vs previous
			prevSpent := prevCategorySpending[cat.ID]
			changePct := calcPct(spent, prevSpent)

			spendingList = append(spendingList, CategorySpending{
				CategoryID:   cat.ID,
				CategoryName: cat.Name,
				CategoryIcon: cat.Icon,
				Color:        cat.Color,
				Amount:       spent,
				Percentage:   percentage,
				ChangePct:    changePct,
			})
		}
	}

	// Get total balance (Sum of all wallets)
	totalBalance, _ := h.walletRepo.GetTotalBalance(userID)

	// Get budget progress
	budgets, _ := h.budgetRepo.GetBudgetsWithSpending(userID, start, end)
	var budgetProgress []BudgetProgress
	for _, b := range budgets {
		budgetProgress = append(budgetProgress, BudgetProgress{
			CategoryID:   b.CategoryID,
			CategoryName: b.Category.Name,
			BudgetAmount: b.Amount,
			SpentAmount:  b.Spent,
			Remaining:    b.Remaining,
			Percentage:   b.Percentage,
		})
	}

	// Get Daily Trends
	trends, _ := h.transactionRepo.GetDailyTrends(userID, start, end)

	// Convert transactions to interface{}
	var recentTx []interface{}
	for _, tx := range transactions {
		recentTx = append(recentTx, tx)
	}

	dashboardSummary := DashboardSummary{
		TotalIncome:        summary.TotalIncome,
		TotalExpense:       summary.TotalExpense,
		Balance:            totalBalance, // Use total accumulated balance
		TransactionCount:   summary.TransactionCount,
		RecentTransactions: recentTx,
		CategorySpending:   spendingList,
		BudgetProgress:     budgetProgress,
		DailyTrends:        trends,
		IncomeChangePct:    incomePct,
		ExpenseChangePct:   expensePct,
		MonthlyIncome:      monthlySummary.TotalIncome,
		MonthlyExpense:     monthlySummary.TotalExpense,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(dashboardSummary)
}

func (h *DashboardHandler) processRecurringTransactions(userID uint) {
	now := time.Now()
	pending, err := h.recurringRepo.FindPending(userID, now)
	if err != nil {
		return
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
			Date:        time.Now(),
		}

		if err := h.transactionRepo.Create(tx); err != nil {
			continue
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

		// Update item
		item.LastRunDate = &now
		item.NextRunDate = nextRun
		h.recurringRepo.Update(&item)
	}
}
