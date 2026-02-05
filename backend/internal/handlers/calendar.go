package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/money-management/backend/internal/models"
	"github.com/money-management/backend/pkg/middleware"
	"gorm.io/gorm"
)

type CalendarHandler struct {
	db *gorm.DB
}

func NewCalendarHandler(db *gorm.DB) *CalendarHandler {
	return &CalendarHandler{db: db}
}

type CalendarEvent struct {
	ID           uint    `json:"id"`
	Date         string  `json:"date"` // YYYY-MM-DD
	Title        string  `json:"title"`
	Amount       float64 `json:"amount"`
	Type         string  `json:"type"`   // income, expense, debt_payable, debt_receivable
	Source       string  `json:"source"` // recurring, debt
	SourceID     uint    `json:"source_id"`
	CategoryIcon string  `json:"category_icon,omitempty"`
}

type CalendarResponse struct {
	Events []CalendarEvent `json:"events"`
	Month  int             `json:"month"`
	Year   int             `json:"year"`
}

func (h *CalendarHandler) GetEvents(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	// Parse month & year from query params
	monthStr := r.URL.Query().Get("month")
	yearStr := r.URL.Query().Get("year")

	now := time.Now()
	month := int(now.Month())
	year := now.Year()

	if m, err := strconv.Atoi(monthStr); err == nil && m >= 1 && m <= 12 {
		month = m
	}
	if y, err := strconv.Atoi(yearStr); err == nil && y >= 2000 && y <= 2100 {
		year = y
	}

	// Calculate date range for the month
	startOfMonth := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.Local)
	endOfMonth := startOfMonth.AddDate(0, 1, 0).Add(-time.Second)

	var events []CalendarEvent

	// 1. Get Recurring Transactions
	var recurring []models.RecurringTransaction
	h.db.Preload("Category").Where("user_id = ? AND is_active = ?", userID, true).Find(&recurring)

	for _, rec := range recurring {
		// Generate occurrences for this month
		occurrences := h.generateOccurrences(rec, startOfMonth, endOfMonth)
		for _, date := range occurrences {
			icon := ""
			if rec.Category.Icon != "" {
				icon = rec.Category.Icon
			}
			events = append(events, CalendarEvent{
				ID:           rec.ID,
				Date:         date.Format("2006-01-02"),
				Title:        rec.Description,
				Amount:       rec.Amount,
				Type:         rec.Type,
				Source:       "recurring",
				SourceID:     rec.ID,
				CategoryIcon: icon,
			})
		}
	}

	// 2. Get Debt Due Dates
	var debts []models.Debt
	h.db.Where("user_id = ? AND status = ? AND due_date >= ? AND due_date <= ?",
		userID, "unpaid", startOfMonth, endOfMonth).Find(&debts)

	for _, debt := range debts {
		eventType := "debt_payable"
		if debt.Type == "receivable" {
			eventType = "debt_receivable"
		}
		events = append(events, CalendarEvent{
			ID:       debt.ID,
			Date:     debt.DueDate.Format("2006-01-02"),
			Title:    debt.PersonName + " - " + debt.Description,
			Amount:   debt.Amount,
			Type:     eventType,
			Source:   "debt",
			SourceID: debt.ID,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(CalendarResponse{
		Events: events,
		Month:  month,
		Year:   year,
	})
}

func (h *CalendarHandler) generateOccurrences(rec models.RecurringTransaction, start, end time.Time) []time.Time {
	var dates []time.Time
	current := rec.NextRunDate

	// If next_run is before our range, calculate forward
	for current.Before(start) {
		current = h.addFrequency(current, rec.Frequency)
	}

	// Generate all occurrences within the range
	for !current.After(end) {
		if !current.Before(start) {
			dates = append(dates, current)
		}
		current = h.addFrequency(current, rec.Frequency)
	}

	return dates
}

func (h *CalendarHandler) addFrequency(t time.Time, freq string) time.Time {
	switch freq {
	case "daily":
		return t.AddDate(0, 0, 1)
	case "weekly":
		return t.AddDate(0, 0, 7)
	case "monthly":
		return t.AddDate(0, 1, 0)
	case "yearly":
		return t.AddDate(1, 0, 0)
	default:
		return t.AddDate(0, 1, 0)
	}
}
