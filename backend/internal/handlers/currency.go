package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"sync"
	"time"

	"github.com/money-management/backend/pkg/middleware"
	"gorm.io/gorm"
)

type CurrencyHandler struct {
	db          *gorm.DB
	cachedRates map[string]float64
	lastFetch   time.Time
	mu          sync.RWMutex
}

func NewCurrencyHandler(db *gorm.DB) *CurrencyHandler {
	return &CurrencyHandler{
		db:          db,
		cachedRates: getDefaultRates(),
	}
}

// Default fallback rates (when offline)
func getDefaultRates() map[string]float64 {
	return map[string]float64{
		"IDR": 1,
		"USD": 16000,
		"EUR": 17500,
		"SGD": 12000,
		"MYR": 3600,
		"JPY": 105,
		"GBP": 20000,
		"AUD": 10500,
		"CNY": 2200,
		"KRW": 12,
	}
}

type CurrencyInfo struct {
	Code   string  `json:"code"`
	Name   string  `json:"name"`
	Rate   float64 `json:"rate"` // Rate to IDR
	Symbol string  `json:"symbol"`
}

var currencyNames = map[string]struct {
	Name   string
	Symbol string
}{
	"IDR": {"Indonesian Rupiah", "Rp"},
	"USD": {"US Dollar", "$"},
	"EUR": {"Euro", "€"},
	"SGD": {"Singapore Dollar", "S$"},
	"MYR": {"Malaysian Ringgit", "RM"},
	"JPY": {"Japanese Yen", "¥"},
	"GBP": {"British Pound", "£"},
	"AUD": {"Australian Dollar", "A$"},
	"CNY": {"Chinese Yuan", "¥"},
	"KRW": {"South Korean Won", "₩"},
}

// GetRates returns current exchange rates (API with fallback)
func (h *CurrencyHandler) GetRates(w http.ResponseWriter, r *http.Request) {
	_ = middleware.GetUserID(r) // Auth check

	rates := h.fetchRates()

	var currencies []CurrencyInfo
	for code, rate := range rates {
		info := currencyNames[code]
		currencies = append(currencies, CurrencyInfo{
			Code:   code,
			Name:   info.Name,
			Rate:   rate,
			Symbol: info.Symbol,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"currencies": currencies,
		"base":       "IDR",
		"source":     h.getRateSource(),
		"updated_at": h.lastFetch,
	})
}

func (h *CurrencyHandler) fetchRates() map[string]float64 {
	h.mu.RLock()
	// Use cache if fetched within last hour
	if time.Since(h.lastFetch) < time.Hour && len(h.cachedRates) > 0 {
		defer h.mu.RUnlock()
		return h.cachedRates
	}
	h.mu.RUnlock()

	// Try to fetch from free API
	rates, err := h.fetchFromAPI()
	if err != nil {
		// Fallback to default rates
		h.mu.Lock()
		h.cachedRates = getDefaultRates()
		h.mu.Unlock()
		return h.cachedRates
	}

	h.mu.Lock()
	h.cachedRates = rates
	h.lastFetch = time.Now()
	h.mu.Unlock()

	return rates
}

func (h *CurrencyHandler) fetchFromAPI() (map[string]float64, error) {
	// Using exchangerate-api.com free tier (or similar)
	// This fetches rates with USD as base, we'll convert to IDR base
	resp, err := http.Get("https://open.er-api.com/v6/latest/USD")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result struct {
		Rates map[string]float64 `json:"rates"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	// Convert to IDR base
	idrRate := result.Rates["IDR"]
	if idrRate == 0 {
		return nil, err
	}

	rates := make(map[string]float64)
	rates["IDR"] = 1

	for code := range currencyNames {
		if code == "IDR" {
			continue
		}
		if usdRate, ok := result.Rates[code]; ok && usdRate > 0 {
			// Calculate how many IDR per 1 unit of this currency
			rates[code] = idrRate / usdRate
		}
	}

	return rates, nil
}

func (h *CurrencyHandler) getRateSource() string {
	h.mu.RLock()
	defer h.mu.RUnlock()
	if h.lastFetch.IsZero() {
		return "offline"
	}
	return "api"
}

// Convert converts amount from source currency to IDR
func (h *CurrencyHandler) Convert(amount float64, fromCurrency string) float64 {
	if fromCurrency == "IDR" || fromCurrency == "" {
		return amount
	}

	rates := h.fetchRates()
	if rate, ok := rates[fromCurrency]; ok {
		return amount * rate
	}
	return amount
}

// GetRate returns the current rate for a currency
func (h *CurrencyHandler) GetRate(currency string) float64 {
	if currency == "IDR" || currency == "" {
		return 1
	}
	rates := h.fetchRates()
	if rate, ok := rates[currency]; ok {
		return rate
	}
	return 1
}
