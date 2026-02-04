package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/money-management/backend/internal/models"
	"gorm.io/gorm"
)

type DebtHandler struct {
	db *gorm.DB
}

func NewDebtHandler(db *gorm.DB) *DebtHandler {
	return &DebtHandler{db: db}
}

func (h *DebtHandler) List(w http.ResponseWriter, r *http.Request) {
	usr := r.Context().Value("user").(models.User)
	var debts []models.Debt

	// Optional filtering by type
	debtType := r.URL.Query().Get("type")

	query := h.db.Where("user_id = ?", usr.ID)
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
	usr := r.Context().Value("user").(models.User)

	var debt models.Debt
	if err := json.NewDecoder(r.Body).Decode(&debt); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	debt.UserID = usr.ID
	debt.Status = "unpaid" // Default status

	if err := h.db.Create(&debt).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(debt)
}

func (h *DebtHandler) Update(w http.ResponseWriter, r *http.Request) {
	usr := r.Context().Value("user").(models.User)
	idTemp := chi.URLParam(r, "id")
	id, _ := strconv.Atoi(idTemp)

	var debt models.Debt
	if err := h.db.Where("id = ? AND user_id = ?", id, usr.ID).First(&debt).Error; err != nil {
		http.Error(w, "Debt not found", http.StatusNotFound)
		return
	}

	var payload models.Debt
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Update fields
	debt.PersonName = payload.PersonName
	debt.Amount = payload.Amount
	debt.Type = payload.Type
	debt.Description = payload.Description
	debt.DueDate = payload.DueDate
	debt.Status = payload.Status

	if err := h.db.Save(&debt).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(debt)
}

func (h *DebtHandler) Delete(w http.ResponseWriter, r *http.Request) {
	usr := r.Context().Value("user").(models.User)
	idTemp := chi.URLParam(r, "id")
	id, _ := strconv.Atoi(idTemp)

	if err := h.db.Where("id = ? AND user_id = ?", id, usr.ID).Delete(&models.Debt{}).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
