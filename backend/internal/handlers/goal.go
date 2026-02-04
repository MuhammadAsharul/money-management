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

type GoalHandler struct {
	goalRepo *repository.GoalRepository
	itemRepo *repository.GoalItemRepository
	userRepo *repository.UserRepository
}

func NewGoalHandler(goalRepo *repository.GoalRepository, itemRepo *repository.GoalItemRepository, userRepo *repository.UserRepository) *GoalHandler {
	return &GoalHandler{
		goalRepo: goalRepo,
		itemRepo: itemRepo,
		userRepo: userRepo,
	}
}

type AddMemberRequest struct {
	Email string `json:"email"`
}

type CreateGoalRequest struct {
	Name          string  `json:"name"`
	TargetAmount  float64 `json:"target_amount"`
	CurrentAmount float64 `json:"current_amount"`
	Deadline      string  `json:"deadline"` // ISO Date string
	Icon          string  `json:"icon"`
	Color         string  `json:"color"`
	Description   string  `json:"description"`
}

type UpdateGoalRequest struct {
	Name          string  `json:"name"`
	TargetAmount  float64 `json:"target_amount"`
	CurrentAmount float64 `json:"current_amount"`
	Deadline      string  `json:"deadline"`
	Icon          string  `json:"icon"`
	Color         string  `json:"color"`
	Description   string  `json:"description"`
}

func (h *GoalHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	goals, err := h.goalRepo.FindByUserID(userID)
	if err != nil {
		http.Error(w, "Error fetching goals", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(goals)
}

func (h *GoalHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateGoalRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	userID := middleware.GetUserID(r)

	var deadline *time.Time
	if req.Deadline != "" {
		parsed, err := time.Parse("2006-01-02", req.Deadline)
		if err == nil {
			deadline = &parsed
		} else {
			// Try RFC3339 if partial date fails, or just ignore logic for simplicity in snippet?
			// Let's assume frontend sends YYYY-MM-DD or RFC3339
			parsedRFC, errRFC := time.Parse(time.RFC3339, req.Deadline)
			if errRFC == nil {
				deadline = &parsedRFC
			}
		}
	}

	goal := &models.Goal{
		UserID:        userID,
		Name:          req.Name,
		TargetAmount:  req.TargetAmount,
		CurrentAmount: req.CurrentAmount,
		Deadline:      deadline,
		Icon:          req.Icon,
		Color:         req.Color,
		Description:   req.Description,
	}

	if err := h.goalRepo.Create(goal); err != nil {
		http.Error(w, "Error creating goal", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(goal)
}

func (h *GoalHandler) Update(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		http.Error(w, "Invalid goal ID", http.StatusBadRequest)
		return
	}

	goal, err := h.goalRepo.FindByID(uint(id))
	if err != nil {
		http.Error(w, "Goal not found", http.StatusNotFound)
		return
	}

	userID := middleware.GetUserID(r)
	if goal.UserID != userID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	var req UpdateGoalRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var deadline *time.Time
	if req.Deadline != "" {
		parsed, err := time.Parse("2006-01-02", req.Deadline)
		if err == nil {
			deadline = &parsed
		} else {
			parsedRFC, errRFC := time.Parse(time.RFC3339, req.Deadline)
			if errRFC == nil {
				deadline = &parsedRFC
			}
		}
	}

	goal.Name = req.Name
	goal.TargetAmount = req.TargetAmount
	goal.CurrentAmount = req.CurrentAmount
	goal.Deadline = deadline
	goal.Icon = req.Icon
	goal.Color = req.Color
	goal.Description = req.Description

	if err := h.goalRepo.Update(goal); err != nil {
		http.Error(w, "Error updating goal", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(goal)
}

func (h *GoalHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		http.Error(w, "Invalid goal ID", http.StatusBadRequest)
		return
	}

	goal, err := h.goalRepo.FindByID(uint(id))
	if err != nil {
		http.Error(w, "Goal not found", http.StatusNotFound)
		return
	}

	userID := middleware.GetUserID(r)
	if goal.UserID != userID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	if err := h.goalRepo.Delete(uint(id)); err != nil {
		http.Error(w, "Error deleting goal", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *GoalHandler) AddMember(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		http.Error(w, "Invalid goal ID", http.StatusBadRequest)
		return
	}

	var req AddMemberRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Verify goal ownership
	goal, err := h.goalRepo.FindByID(uint(id))
	if err != nil {
		http.Error(w, "Goal not found", http.StatusNotFound)
		return
	}

	userID := middleware.GetUserID(r)
	if goal.UserID != userID {
		http.Error(w, "Only owner can add members", http.StatusForbidden)
		return
	}

	// Find user by email
	userToAdd, err := h.userRepo.FindByEmail(req.Email)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	if userToAdd.ID == goal.UserID {
		http.Error(w, "Cannot add yourself", http.StatusBadRequest)
		return
	}

	// Check if already member
	existing, _ := h.goalRepo.FindMember(goal.ID, userToAdd.ID)
	if existing != nil {
		http.Error(w, "User already a member", http.StatusBadRequest)
		return
	}

	if err := h.goalRepo.AddMember(goal.ID, userToAdd.ID, "member"); err != nil {
		http.Error(w, "Error adding member", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

type AddFundsRequest struct {
	Amount float64 `json:"amount"`
	Notes  string  `json:"notes"`
	Date   string  `json:"date"` // YYYY-MM-DD
}

func (h *GoalHandler) AddFunds(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		http.Error(w, "Invalid goal ID", http.StatusBadRequest)
		return
	}

	var req AddFundsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	date := time.Now()
	if req.Date != "" {
		parsed, err := time.Parse("2006-01-02", req.Date)
		if err == nil {
			date = parsed
		}
	}

	userID := middleware.GetUserID(r)

	// Verify membership/ownership
	goal, err := h.goalRepo.FindByID(uint(id))
	if err != nil {
		http.Error(w, "Goal not found", http.StatusNotFound)
		return
	}

	// Check if user is owner or member
	isMember := false
	if goal.UserID == userID {
		isMember = true
	} else {
		for _, m := range goal.Members {
			if m.UserID == userID {
				isMember = true
				break
			}
		}
		// If members not preloaded, double check DB
		if !isMember { // Fallback check
			member, _ := h.goalRepo.FindMember(goal.ID, userID)
			if member != nil {
				isMember = true
			}
		}
	}

	if !isMember {
		http.Error(w, "You are not a member of this goal", http.StatusForbidden)
		return
	}

	if err := h.goalRepo.AddTransaction(uint(id), userID, req.Amount, req.Notes, date); err != nil {
		http.Error(w, "Error adding funds", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *GoalHandler) GetHistory(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		http.Error(w, "Invalid goal ID", http.StatusBadRequest)
		return
	}

	transactions, err := h.goalRepo.GetTransactions(uint(id))
	if err != nil {
		http.Error(w, "Error fetching history", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(transactions)
}

func (h *GoalHandler) GetItems(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	goalID, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		http.Error(w, "Invalid goal ID", http.StatusBadRequest)
		return
	}

	items, err := h.itemRepo.FindByGoalID(uint(goalID))
	if err != nil {
		http.Error(w, "Error fetching items", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
}

type AddItemRequest struct {
	Name           string  `json:"name"`
	EstimatedPrice float64 `json:"estimated_price"`
	Note           string  `json:"note"`
}

func (h *GoalHandler) AddItem(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	goalID, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		http.Error(w, "Invalid goal ID", http.StatusBadRequest)
		return
	}

	var req AddItemRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	item := &models.GoalItem{
		GoalID:         uint(goalID),
		Name:           req.Name,
		EstimatedPrice: req.EstimatedPrice,
		Note:           req.Note,
	}

	if err := h.itemRepo.Create(item); err != nil {
		http.Error(w, "Error creating item", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(item)
}

type UpdateItemRequest struct {
	Name           string  `json:"name"`
	EstimatedPrice float64 `json:"estimated_price"`
	ActualPrice    float64 `json:"actual_price"`
	IsPurchased    bool    `json:"is_purchased"`
	Note           string  `json:"note"`
}

func (h *GoalHandler) UpdateItem(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "itemID")
	itemID, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		http.Error(w, "Invalid item ID", http.StatusBadRequest)
		return
	}

	item, err := h.itemRepo.FindByID(uint(itemID))
	if err != nil {
		http.Error(w, "Item not found", http.StatusNotFound)
		return
	}

	var req UpdateItemRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	item.Name = req.Name
	item.EstimatedPrice = req.EstimatedPrice
	item.ActualPrice = req.ActualPrice
	item.IsPurchased = req.IsPurchased
	item.Note = req.Note
	item.UpdatedAt = time.Now()

	if err := h.itemRepo.Update(item); err != nil {
		http.Error(w, "Error updating item", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(item)
}

func (h *GoalHandler) DeleteItem(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "itemID")
	itemID, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		http.Error(w, "Invalid item ID", http.StatusBadRequest)
		return
	}

	if err := h.itemRepo.Delete(uint(itemID)); err != nil {
		http.Error(w, "Error deleting item", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
