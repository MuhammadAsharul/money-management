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

type CategoryHandler struct {
	categoryRepo *repository.CategoryRepository
}

func NewCategoryHandler(categoryRepo *repository.CategoryRepository) *CategoryHandler {
	return &CategoryHandler{categoryRepo: categoryRepo}
}

type CreateCategoryRequest struct {
	Name  string `json:"name"`
	Icon  string `json:"icon"`
	Color string `json:"color"`
	Type  string `json:"type"`
}

type UpdateCategoryRequest struct {
	Name  string `json:"name"`
	Icon  string `json:"icon"`
	Color string `json:"color"`
}

func (h *CategoryHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	categoryType := r.URL.Query().Get("type")

	var categories []models.Category
	var err error

	if categoryType != "" {
		categories, err = h.categoryRepo.FindByUserIDAndType(userID, categoryType)
	} else {
		categories, err = h.categoryRepo.FindByUserID(userID)
	}

	if err != nil {
		http.Error(w, "Error fetching categories", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(categories)
}

func (h *CategoryHandler) Get(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		http.Error(w, "Invalid category ID", http.StatusBadRequest)
		return
	}

	category, err := h.categoryRepo.FindByID(uint(id))
	if err != nil {
		http.Error(w, "Category not found", http.StatusNotFound)
		return
	}

	userID := middleware.GetUserID(r)
	if category.UserID != userID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(category)
}

func (h *CategoryHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateCategoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	userID := middleware.GetUserID(r)

	category := &models.Category{
		UserID: userID,
		Name:   req.Name,
		Icon:   req.Icon,
		Color:  req.Color,
		Type:   req.Type,
	}

	if err := h.categoryRepo.Create(category); err != nil {
		http.Error(w, "Error creating category", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(category)
}

func (h *CategoryHandler) Update(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		http.Error(w, "Invalid category ID", http.StatusBadRequest)
		return
	}

	category, err := h.categoryRepo.FindByID(uint(id))
	if err != nil {
		http.Error(w, "Category not found", http.StatusNotFound)
		return
	}

	userID := middleware.GetUserID(r)
	if category.UserID != userID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	var req UpdateCategoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	category.Name = req.Name
	category.Icon = req.Icon
	category.Color = req.Color

	if err := h.categoryRepo.Update(category); err != nil {
		http.Error(w, "Error updating category", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(category)
}

func (h *CategoryHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		http.Error(w, "Invalid category ID", http.StatusBadRequest)
		return
	}

	category, err := h.categoryRepo.FindByID(uint(id))
	if err != nil {
		http.Error(w, "Category not found", http.StatusNotFound)
		return
	}

	userID := middleware.GetUserID(r)
	if category.UserID != userID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	if category.IsDefault {
		http.Error(w, "Cannot delete default category", http.StatusBadRequest)
		return
	}

	if err := h.categoryRepo.Delete(uint(id)); err != nil {
		http.Error(w, "Error deleting category", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
