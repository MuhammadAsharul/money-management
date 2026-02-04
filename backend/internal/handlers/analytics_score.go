package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/money-management/backend/internal/models"
	"github.com/money-management/backend/pkg/middleware"
	"gorm.io/gorm"
)

type FinancialScoreResponse struct {
	Score               int      `json:"score"`
	ConsistencyScore    int      `json:"consistency_score"`
	SavingsScore        int      `json:"savings_score"`
	SpendingScore       int      `json:"spending_score"`
	TotalIncome         float64  `json:"total_income"`
	TotalExpense        float64  `json:"total_expense"`
	EssentialExpense    float64  `json:"essential_expense"`
	NonEssentialExpense float64  `json:"non_essential_expense"`
	Tips                []string `json:"tips"`
}

func GetFinancialScore(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := middleware.GetUserID(r)

		// 1. Calculate Consistency (Last 30 days)
		// How many days have at least one transaction?
		var activeDays int64
		thirtyDaysAgo := time.Now().AddDate(0, 0, -30)

		db.Model(&models.Transaction{}).
			Where("user_id = ? AND date >= ?", userID, thirtyDaysAgo).
			Distinct("DATE(date)").
			Count(&activeDays)

		// Max score if active >= 20 days (approx 5 days/week)
		consistencyScore := int(float64(activeDays) / 20.0 * 100)
		if consistencyScore > 100 {
			consistencyScore = 100
		}

		// 2. Fetch Transactions for this month for Savings & Spending Ratio
		startOfMonth := time.Now().AddDate(0, 0, -time.Now().Day()+1) // 1st of current month

		var transactions []models.Transaction
		db.Preload("Category").Where("user_id = ? AND date >= ?", userID, startOfMonth).Find(&transactions)

		var totalIncome, totalExpense, essentialData, nonEssentialData float64

		for _, t := range transactions {
			if t.Type == "income" {
				totalIncome += t.Amount
			} else if t.Type == "expense" {
				totalExpense += t.Amount
				if t.Category.IsEssential {
					essentialData += t.Amount
				} else {
					nonEssentialData += t.Amount
				}
			}
		}

		// Savings Score Calculation
		// Ideal savings rate >= 20%
		savingsScore := 0
		if totalIncome > 0 {
			savingsRate := (totalIncome - totalExpense) / totalIncome
			// Map: 0% savings -> 0 score, 20% savings -> 100 score
			// Formula: rate * 5 * 100
			savingsScore = int(savingsRate * 5 * 100)
		}

		// Clamp scores
		if savingsScore < 0 {
			savingsScore = 0
		}
		if savingsScore > 100 {
			savingsScore = 100
		}

		// Impulsive Spending Score Calculation
		// Ideal: Non-essential < 30% of total expense
		// If Non-essential is 0 -> 100 score
		// If Non-essential is 100% -> 0 score
		// Let's use simpler: Score = 100 - (Percent of Wants).
		// If wants = 30%, score = 70. Ideally we want Wants to be low.
		spendingScore := 100
		if totalExpense > 0 {
			wantsRatio := nonEssentialData / totalExpense
			spendingScore = int((1.0 - wantsRatio) * 100)
		}

		// Total Weighted Score
		// Consistency: 30%, Savings: 40%, Spending Control: 30%
		finalScore := int((float64(consistencyScore) * 0.3) + (float64(savingsScore) * 0.4) + (float64(spendingScore) * 0.3))

		// Generate Tips (Return codes for frontend translation)
		var tips []string
		if consistencyScore < 60 {
			tips = append(tips, "TIP_CONSISTENCY_LOW")
		}
		if savingsScore < 50 {
			tips = append(tips, "TIP_SAVINGS_LOW")
		}
		if spendingScore < 60 {
			tips = append(tips, "TIP_SPENDING_HIGH")
		}
		if finalScore > 80 {
			tips = append(tips, "TIP_EXCELLENT")
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(FinancialScoreResponse{
			Score:               finalScore,
			ConsistencyScore:    consistencyScore,
			SavingsScore:        savingsScore,
			SpendingScore:       spendingScore,
			TotalIncome:         totalIncome,
			TotalExpense:        totalExpense,
			EssentialExpense:    essentialData,
			NonEssentialExpense: nonEssentialData,
			Tips:                tips,
		})
	}
}
