package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/money-management/backend/internal/models"
	"github.com/money-management/backend/pkg/middleware"
	"gorm.io/gorm"
)

type GamificationStatusResponse struct {
	Level           int            `json:"level"`
	XP              int            `json:"xp"`
	NextLevelXP     int            `json:"next_level_xp"`
	CurrentStreak   int            `json:"current_streak"`
	LongestStreak   int            `json:"longest_streak"`
	Badges          []models.Badge `json:"badges"`
	UnlockedBadgeID uint           `json:"unlocked_badge_id,omitempty"` // If a badge was just unlocked
}

type GamificationHandler struct {
	db *gorm.DB
}

func NewGamificationHandler(db *gorm.DB) *GamificationHandler {
	handler := &GamificationHandler{db: db}
	handler.SeedBadges()
	return handler
}

func (h *GamificationHandler) SeedBadges() {
	var count int64
	h.db.Model(&models.Badge{}).Count(&count)
	if count > 0 {
		return
	}

	badges := []models.Badge{
		{Name: "Rookie Recorder", Description: "Log your first 10 transactions", Icon: "📝", Criteria: "10 transactions"},
		{Name: "Streak Master", Description: "Maintain a 7-day streak", Icon: "🔥", Criteria: "7 day streak"},
		{Name: "No Jajan Week", Description: "No \"Wants\" expenses for 7 days", Icon: "🛡️", Criteria: "0 wants for 7 days"},
		{Name: "Sultan", Description: "Reach Level 10", Icon: "👑", Criteria: "Level 10"},
		{Name: "Saver", Description: "Save 20% of income in a month", Icon: "💰", Criteria: "20% savings rate"},
	}

	for _, b := range badges {
		h.db.FirstOrCreate(&b, models.Badge{Name: b.Name})
	}
}

// XP needed for next level: Level * 100
func calculateNextLevelXP(level int) int {
	return level * 100
}

func (h *GamificationHandler) GetStatus(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	var user models.User
	if err := h.db.Preload("Badges").First(&user, userID).Error; err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// Check for streak updates (if user logged in/viewed dashboard)
	// Real streak calculation should ideally happen on transaction creation,
	// but we can also check here if we want "login streak" or similar.
	// For now we just return the stored values.

	resp := GamificationStatusResponse{
		Level:         user.Level,
		XP:            user.XP,
		NextLevelXP:   calculateNextLevelXP(user.Level),
		CurrentStreak: user.CurrentStreak,
		LongestStreak: user.LongestStreak,
		Badges:        user.Badges,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// Internal function to add XP and check for level up
func (h *GamificationHandler) AddXP(userID uint, amount int) error {
	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		return err
	}

	user.XP += amount
	nextLevelXP := calculateNextLevelXP(user.Level)

	if user.XP >= nextLevelXP {
		user.Level++
		user.XP -= nextLevelXP // Carry over excess XP
		// Can recursively check if they leveled up multiple times, but one step is usually enough per action
	}

	return h.db.Save(&user).Error
}

// Internal function to update streak
func (h *GamificationHandler) UpdateStreak(userID uint, transactionDate time.Time) error {
	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		return err
	}

	// Logic:
	// If last transaction was yesterday, increment streak.
	// If last transaction was today, do nothing.
	// If last transaction was before yesterday, reset streak to 1.

	lastDate := user.LastTransactionDate
	if lastDate.IsZero() {
		user.CurrentStreak = 1
		user.LongestStreak = 1
	} else {
		// Normalize days (ignore time)
		y1, m1, d1 := lastDate.Date()
		y2, m2, d2 := transactionDate.Date()

		last := time.Date(y1, m1, d1, 0, 0, 0, 0, time.UTC)
		current := time.Date(y2, m2, d2, 0, 0, 0, 0, time.UTC)

		diff := current.Sub(last).Hours() / 24

		if diff == 1 {
			// Consecutive day
			user.CurrentStreak++
			if user.CurrentStreak > user.LongestStreak {
				user.LongestStreak = user.CurrentStreak
			}
		} else if diff > 1 {
			// Streak broken
			user.CurrentStreak = 1
		}
		// If diff == 0 (same day), do nothing
	}

	user.LastTransactionDate = transactionDate
	return h.db.Save(&user).Error
}
