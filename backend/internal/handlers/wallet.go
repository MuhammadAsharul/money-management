package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/money-management/backend/internal/models"
	"github.com/money-management/backend/internal/repository"
	"github.com/money-management/backend/pkg/middleware"
)

type WalletHandler struct {
	walletRepo *repository.WalletRepository
}

func NewWalletHandler(walletRepo *repository.WalletRepository) *WalletHandler {
	return &WalletHandler{walletRepo: walletRepo}
}

type CreateWalletRequest struct {
	Name        string  `json:"name"`
	Icon        string  `json:"icon"`
	Color       string  `json:"color"`
	Balance     float64 `json:"balance"`
	IsDefault   bool    `json:"is_default"`
	Description string  `json:"description"`
}

type UpdateWalletRequest struct {
	Name        string  `json:"name"`
	Icon        string  `json:"icon"`
	Color       string  `json:"color"`
	Balance     float64 `json:"balance"`
	IsDefault   bool    `json:"is_default"`
	Description string  `json:"description"`
}

func (h *WalletHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	wallets, err := h.walletRepo.FindByUserID(userID)
	if err != nil {
		http.Error(w, "Error fetching wallets", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(wallets)
}

func (h *WalletHandler) Get(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		http.Error(w, "Invalid wallet ID", http.StatusBadRequest)
		return
	}

	wallet, err := h.walletRepo.FindByID(uint(id))
	if err != nil {
		http.Error(w, "Wallet not found", http.StatusNotFound)
		return
	}

	userID := middleware.GetUserID(r)
	if wallet.UserID != userID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(wallet)
}

func (h *WalletHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateWalletRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	userID := middleware.GetUserID(r)

	// If this is set as default, clear other defaults first
	if req.IsDefault {
		h.walletRepo.ClearDefault(userID)
	}

	wallet := &models.Wallet{
		UserID:      userID,
		Name:        req.Name,
		Icon:        req.Icon,
		Color:       req.Color,
		Balance:     req.Balance,
		IsDefault:   req.IsDefault,
		Description: req.Description,
	}

	if err := h.walletRepo.Create(wallet); err != nil {
		http.Error(w, "Error creating wallet", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(wallet)
}

func (h *WalletHandler) Update(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		http.Error(w, "Invalid wallet ID", http.StatusBadRequest)
		return
	}

	wallet, err := h.walletRepo.FindByID(uint(id))
	if err != nil {
		http.Error(w, "Wallet not found", http.StatusNotFound)
		return
	}

	userID := middleware.GetUserID(r)
	if wallet.UserID != userID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	var req UpdateWalletRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// If setting as default, clear other defaults first
	if req.IsDefault && !wallet.IsDefault {
		h.walletRepo.ClearDefault(userID)
	}

	wallet.Name = req.Name
	wallet.Icon = req.Icon
	wallet.Color = req.Color
	wallet.Balance = req.Balance
	wallet.IsDefault = req.IsDefault
	wallet.Description = req.Description

	if err := h.walletRepo.Update(wallet); err != nil {
		http.Error(w, "Error updating wallet", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(wallet)
}

func (h *WalletHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		http.Error(w, "Invalid wallet ID", http.StatusBadRequest)
		return
	}

	wallet, err := h.walletRepo.FindByID(uint(id))
	if err != nil {
		http.Error(w, "Wallet not found", http.StatusNotFound)
		return
	}

	userID := middleware.GetUserID(r)
	if wallet.UserID != userID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	// Cannot delete default wallet if it's the only one
	wallets, _ := h.walletRepo.FindByUserID(userID)
	if len(wallets) <= 1 {
		http.Error(w, "Cannot delete the only wallet", http.StatusBadRequest)
		return
	}

	if err := h.walletRepo.Delete(uint(id)); err != nil {
		http.Error(w, "Error deleting wallet", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
