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

type BudgetHandler struct {
	budgetRepo *repository.BudgetRepository
}

func NewBudgetHandler(budgetRepo *repository.BudgetRepository) *BudgetHandler {
	return &BudgetHandler{budgetRepo: budgetRepo}
}

type CreateBudgetRequest struct {
	CategoryID uint    `json:"category_id"`
	Amount     float64 `json:"amount"`
	Period     string  `json:"period"`
}

type UpdateBudgetRequest struct {
	Amount float64 `json:"amount"`
	Period string  `json:"period"`
}

func (h *BudgetHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	// Parse month and year query params
	month, _ := strconv.Atoi(r.URL.Query().Get("month"))
	year, _ := strconv.Atoi(r.URL.Query().Get("year"))

	now := time.Now()
	if month == 0 {
		month = int(now.Month())
	}
	if year == 0 {
		year = now.Year()
	}

	// Calculate start and end of month
	startDate := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.Local)
	// End of month is start of next month minus 1 second (or 1 nanosecond)
	// Using AddDate(0, 1, 0) gives start of next month. Add(-1 * time.Second) gives 23:59:59 of current month.
	endDate := startDate.AddDate(0, 1, 0).Add(-1 * time.Second)

	budgets, err := h.budgetRepo.GetBudgetsWithSpending(userID, startDate, endDate)
	if err != nil {
		http.Error(w, "Error fetching budgets", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(budgets)
}

func (h *BudgetHandler) Get(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		http.Error(w, "Invalid budget ID", http.StatusBadRequest)
		return
	}

	budget, err := h.budgetRepo.FindByID(uint(id))
	if err != nil {
		http.Error(w, "Budget not found", http.StatusNotFound)
		return
	}

	userID := middleware.GetUserID(r)
	if budget.UserID != userID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(budget)
}

func (h *BudgetHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateBudgetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	userID := middleware.GetUserID(r)

	// Check if budget for this category already exists
	existingBudget, _ := h.budgetRepo.FindByUserIDAndCategory(userID, req.CategoryID)
	if existingBudget != nil {
		http.Error(w, "Budget for this category already exists", http.StatusConflict)
		return
	}

	period := req.Period
	if period == "" {
		period = "monthly"
	}

	budget := &models.Budget{
		UserID:     userID,
		CategoryID: req.CategoryID,
		Amount:     req.Amount,
		Period:     period,
	}

	if err := h.budgetRepo.Create(budget); err != nil {
		http.Error(w, "Error creating budget", http.StatusInternalServerError)
		return
	}

	// Fetch with category
	budget, _ = h.budgetRepo.FindByID(budget.ID)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(budget)
}

func (h *BudgetHandler) Update(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		http.Error(w, "Invalid budget ID", http.StatusBadRequest)
		return
	}

	budget, err := h.budgetRepo.FindByID(uint(id))
	if err != nil {
		http.Error(w, "Budget not found", http.StatusNotFound)
		return
	}

	userID := middleware.GetUserID(r)
	if budget.UserID != userID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	var req UpdateBudgetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	budget.Amount = req.Amount
	if req.Period != "" {
		budget.Period = req.Period
	}

	if err := h.budgetRepo.Update(budget); err != nil {
		http.Error(w, "Error updating budget", http.StatusInternalServerError)
		return
	}

	// Fetch with category
	budget, _ = h.budgetRepo.FindByID(budget.ID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(budget)
}

func (h *BudgetHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		http.Error(w, "Invalid budget ID", http.StatusBadRequest)
		return
	}

	budget, err := h.budgetRepo.FindByID(uint(id))
	if err != nil {
		http.Error(w, "Budget not found", http.StatusNotFound)
		return
	}

	userID := middleware.GetUserID(r)
	if budget.UserID != userID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	if err := h.budgetRepo.Delete(uint(id)); err != nil {
		http.Error(w, "Error deleting budget", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
