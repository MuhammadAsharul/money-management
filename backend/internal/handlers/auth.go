package handlers

import (
	"encoding/json"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/money-management/backend/internal/models"
	"github.com/money-management/backend/internal/repository"
	"github.com/money-management/backend/pkg/config"
	"github.com/money-management/backend/pkg/middleware"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	userRepo     *repository.UserRepository
	categoryRepo *repository.CategoryRepository
	walletRepo   *repository.WalletRepository
	cfg          *config.Config
}

func NewAuthHandler(userRepo *repository.UserRepository, categoryRepo *repository.CategoryRepository, walletRepo *repository.WalletRepository, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		userRepo:     userRepo,
		categoryRepo: categoryRepo,
		walletRepo:   walletRepo,
		cfg:          cfg,
	}
}

type RegisterRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Name     string `json:"name"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token string       `json:"token"`
	User  *models.User `json:"user"`
}

type GoogleAuthRequest struct {
	Email     string `json:"email"`
	Name      string `json:"name"`
	AvatarURL string `json:"avatar_url"`
	GoogleID  string `json:"google_id"`
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Check if email exists
	existingUser, _ := h.userRepo.FindByEmail(req.Email)
	if existingUser != nil {
		http.Error(w, "Email already registered", http.StatusConflict)
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Error hashing password", http.StatusInternalServerError)
		return
	}

	// Generate avatar URL from first name
	firstName := strings.Split(req.Name, " ")[0]
	avatarURL := "https://api.dicebear.com/7.x/avataaars/svg?seed=" + url.QueryEscape(firstName)

	user := &models.User{
		Name:      req.Name,
		Email:     req.Email,
		Password:  string(hashedPassword),
		Provider:  "local",
		AvatarURL: avatarURL,
	}

	if err := h.userRepo.Create(user); err != nil {
		http.Error(w, "Error creating user", http.StatusInternalServerError)
		return
	}

	// Create default categories and wallet for new user
	h.categoryRepo.CreateDefaultCategories(user.ID)
	h.walletRepo.CreateDefaultWallet(user.ID)

	// Generate JWT
	token, err := h.generateToken(user.ID)
	if err != nil {
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(AuthResponse{
		Token: token,
		User:  user,
	})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	user, err := h.userRepo.FindByName(req.Name)
	if err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	token, err := h.generateToken(user.ID)
	if err != nil {
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(AuthResponse{
		Token: token,
		User:  user,
	})
}

func (h *AuthHandler) GoogleAuth(w http.ResponseWriter, r *http.Request) {
	var req GoogleAuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Check if user exists by Google ID
	user, err := h.userRepo.FindByProviderID("google", req.GoogleID)
	if err != nil {
		// Check by email
		user, err = h.userRepo.FindByEmail(req.Email)
		if err != nil {
			// Create new user
			user = &models.User{
				Name:       req.Name,
				Email:      req.Email,
				AvatarURL:  req.AvatarURL,
				Provider:   "google",
				ProviderID: req.GoogleID,
			}
			if err := h.userRepo.Create(user); err != nil {
				http.Error(w, "Error creating user", http.StatusInternalServerError)
				return
			}
			// Create default categories and wallet
			h.categoryRepo.CreateDefaultCategories(user.ID)
			h.walletRepo.CreateDefaultWallet(user.ID)
		} else {
			// Update existing user with Google info
			user.Provider = "google"
			user.ProviderID = req.GoogleID
			user.AvatarURL = req.AvatarURL
			h.userRepo.Update(user)
		}
	}

	token, err := h.generateToken(user.ID)
	if err != nil {
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(AuthResponse{
		Token: token,
		User:  user,
	})
}

func (h *AuthHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	userIDVal := r.Context().Value("userID")
	if userIDVal == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	userID, ok := userIDVal.(uint)
	if !ok {
		http.Error(w, "Invalid user ID", http.StatusInternalServerError)
		return
	}

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (h *AuthHandler) generateToken(userID uint) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(time.Hour * 24 * 7).Unix(), // 7 days
	})

	return token.SignedString([]byte(h.cfg.JWTSecret))
}

type UpdateProfileRequest struct {
	Name      string `json:"name"`
	AvatarURL string `json:"avatar_url"`
}

type ChangePasswordRequest struct {
	OldPassword string `json:"old_password"`
	NewPassword string `json:"new_password"`
}

func (h *AuthHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	var req UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	user.Name = req.Name
	user.AvatarURL = req.AvatarURL

	if err := h.userRepo.Update(user); err != nil {
		http.Error(w, "Error updating profile", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (h *AuthHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	var req ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// Verify old password (only if user has one - local provider)
	if user.Provider == "local" {
		if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.OldPassword)); err != nil {
			http.Error(w, "Password lama salah", http.StatusUnauthorized)
			return
		}
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Error hashing password", http.StatusInternalServerError)
		return
	}

	user.Password = string(hashedPassword)
	if err := h.userRepo.Update(user); err != nil {
		http.Error(w, "Error updating password", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
