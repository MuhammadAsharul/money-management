package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/money-management/backend/internal/repository"
	"github.com/money-management/backend/pkg/middleware"
)

type ReportHandler struct {
	transactionRepo *repository.TransactionRepository
	categoryRepo    *repository.CategoryRepository
}

func NewReportHandler(transactionRepo *repository.TransactionRepository, categoryRepo *repository.CategoryRepository) *ReportHandler {
	return &ReportHandler{
		transactionRepo: transactionRepo,
		categoryRepo:    categoryRepo,
	}
}

type CategoryBreakdown struct {
	CategoryID   uint    `json:"category_id"`
	CategoryName string  `json:"category_name"`
	CategoryIcon string  `json:"category_icon"`
	Amount       float64 `json:"amount"`
	Percentage   float64 `json:"percentage"`
}

type MonthComparison struct {
	IncomeChange  float64 `json:"income_change"`
	ExpenseChange float64 `json:"expense_change"`
	SavingsChange float64 `json:"savings_change"`
}

type DailyData struct {
	Date    string  `json:"date"`
	Income  float64 `json:"income"`
	Expense float64 `json:"expense"`
}

type MonthlyReportResponse struct {
	Year              int                 `json:"year"`
	Month             int                 `json:"month"`
	TotalIncome       float64             `json:"total_income"`
	TotalExpense      float64             `json:"total_expense"`
	NetSavings        float64             `json:"net_savings"`
	SavingsRate       float64             `json:"savings_rate"`
	CategoryBreakdown []CategoryBreakdown `json:"category_breakdown"`
	Comparison        MonthComparison     `json:"comparison"`
	DailyTrend        []DailyData         `json:"daily_trend"`
	TransactionCount  int                 `json:"transaction_count"`
}

func (h *ReportHandler) GetMonthlyReport(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	// Parse year and month from query
	year, _ := strconv.Atoi(r.URL.Query().Get("year"))
	month, _ := strconv.Atoi(r.URL.Query().Get("month"))

	now := time.Now()
	if year == 0 {
		year = now.Year()
	}
	if month == 0 {
		month = int(now.Month())
	}

	// Calculate date range for the month
	startDate := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.Local)
	endDate := startDate.AddDate(0, 1, 0).Add(-time.Second)

	// Calculate previous month for comparison
	prevStartDate := startDate.AddDate(0, -1, 0)
	prevEndDate := startDate.Add(-time.Second)

	// Get transactions for current month
	transactions, err := h.transactionRepo.FindByUserIDAndDateRange(userID, startDate, endDate)
	if err != nil {
		http.Error(w, "Error fetching transactions", http.StatusInternalServerError)
		return
	}

	// Get transactions for previous month
	prevTransactions, _ := h.transactionRepo.FindByUserIDAndDateRange(userID, prevStartDate, prevEndDate)

	// Calculate totals
	var totalIncome, totalExpense float64
	categoryAmounts := make(map[uint]float64)
	categoryNames := make(map[uint]string)
	categoryIcons := make(map[uint]string)
	dailyIncome := make(map[string]float64)
	dailyExpense := make(map[string]float64)

	for _, tx := range transactions {
		dateKey := tx.Date.Format("2006-01-02")

		// Skip transfers for income/expense calculation
		isTransfer := tx.CategoryID != 0 && (tx.Category.Name == "Transfer" || tx.Category.Name == "transfer")

		if tx.Type == "income" && !isTransfer {
			totalIncome += tx.Amount
			dailyIncome[dateKey] += tx.Amount
		} else if tx.Type == "expense" {
			totalExpense += tx.Amount
			dailyExpense[dateKey] += tx.Amount

			// Category breakdown (expenses only, excluding transfers)
			if tx.CategoryID != 0 && !isTransfer {
				categoryAmounts[tx.CategoryID] += tx.Amount
				categoryNames[tx.CategoryID] = tx.Category.Name
				categoryIcons[tx.CategoryID] = tx.Category.Icon
			}
		}
	}

	// Build category breakdown
	var categoryBreakdown []CategoryBreakdown
	for catID, amount := range categoryAmounts {
		percentage := 0.0
		if totalExpense > 0 {
			percentage = (amount / totalExpense) * 100
		}
		categoryBreakdown = append(categoryBreakdown, CategoryBreakdown{
			CategoryID:   catID,
			CategoryName: categoryNames[catID],
			CategoryIcon: categoryIcons[catID],
			Amount:       amount,
			Percentage:   percentage,
		})
	}

	// Build daily trend
	var dailyTrend []DailyData
	for d := startDate; !d.After(endDate) && !d.After(now); d = d.AddDate(0, 0, 1) {
		dateKey := d.Format("2006-01-02")
		dailyTrend = append(dailyTrend, DailyData{
			Date:    dateKey,
			Income:  dailyIncome[dateKey],
			Expense: dailyExpense[dateKey],
		})
	}

	// Calculate previous month totals for comparison
	var prevIncome, prevExpense float64
	for _, tx := range prevTransactions {
		isTransfer := tx.CategoryID != 0 && (tx.Category.Name == "Transfer" || tx.Category.Name == "transfer")
		if tx.Type == "income" && !isTransfer {
			prevIncome += tx.Amount
		} else if tx.Type == "expense" && !isTransfer {
			prevExpense += tx.Amount
		}
	}

	// Calculate changes
	incomeChange := 0.0
	if prevIncome > 0 {
		incomeChange = ((totalIncome - prevIncome) / prevIncome) * 100
	} else if totalIncome > 0 {
		incomeChange = 100
	}

	expenseChange := 0.0
	if prevExpense > 0 {
		expenseChange = ((totalExpense - prevExpense) / prevExpense) * 100
	} else if totalExpense > 0 {
		expenseChange = 100
	}

	netSavings := totalIncome - totalExpense
	prevSavings := prevIncome - prevExpense
	savingsChange := 0.0
	if prevSavings != 0 {
		savingsChange = ((netSavings - prevSavings) / absFloat(prevSavings)) * 100
	}

	savingsRate := 0.0
	if totalIncome > 0 {
		savingsRate = (netSavings / totalIncome) * 100
	}

	response := MonthlyReportResponse{
		Year:              year,
		Month:             month,
		TotalIncome:       totalIncome,
		TotalExpense:      totalExpense,
		NetSavings:        netSavings,
		SavingsRate:       savingsRate,
		CategoryBreakdown: categoryBreakdown,
		Comparison: MonthComparison{
			IncomeChange:  incomeChange,
			ExpenseChange: expenseChange,
			SavingsChange: savingsChange,
		},
		DailyTrend:       dailyTrend,
		TransactionCount: len(transactions),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func absFloat(x float64) float64 {
	if x < 0 {
		return -x
	}
	return x
}
