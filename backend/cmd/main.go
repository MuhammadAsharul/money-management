package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"
	"github.com/money-management/backend/internal/handlers"
	"github.com/money-management/backend/internal/repository"
	"github.com/money-management/backend/pkg/config"
	"github.com/money-management/backend/pkg/middleware"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Load config
	cfg := config.Load()

	// Initialize database
	if err := repository.InitDB(cfg); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	db := repository.GetDB()

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	walletRepo := repository.NewWalletRepository(db)
	categoryRepo := repository.NewCategoryRepository(db)
	transactionRepo := repository.NewTransactionRepository(db)
	budgetRepo := repository.NewBudgetRepository(db)
	goalRepo := repository.NewGoalRepository(db)
	goalItemRepo := repository.NewGoalItemRepository(db)
	recurringRepo := repository.NewRecurringRepository(db)

	// Initialize handlers
	gamificationHandler := handlers.NewGamificationHandler(db) // Init early for injection

	authHandler := handlers.NewAuthHandler(userRepo, categoryRepo, walletRepo, cfg)
	walletHandler := handlers.NewWalletHandler(walletRepo)
	categoryHandler := handlers.NewCategoryHandler(categoryRepo)
	transactionHandler := handlers.NewTransactionHandler(transactionRepo, walletRepo, categoryRepo, gamificationHandler)
	budgetHandler := handlers.NewBudgetHandler(budgetRepo)
	goalHandler := handlers.NewGoalHandler(goalRepo, goalItemRepo, userRepo)
	recurringHandler := handlers.NewRecurringHandler(recurringRepo, transactionRepo, walletRepo)
	dashboardHandler := handlers.NewDashboardHandler(transactionRepo, budgetRepo, categoryRepo, walletRepo, recurringRepo)
	dataHandler := handlers.NewDataHandler(transactionRepo, categoryRepo, walletRepo, budgetRepo, goalRepo)
	reportHandler := handlers.NewReportHandler(transactionRepo, categoryRepo)
	uploadHandler := handlers.NewUploadHandler()
	debtHandler := handlers.NewDebtHandler(db)

	// Setup router
	r := chi.NewRouter()

	// Middleware
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(middleware.CORS)

	// Public routes

	// Public routes

	// ...

	// Public routes
	r.Route("/api", func(r chi.Router) {
		// Auth routes (public)
		r.Post("/auth/register", authHandler.Register)
		r.Post("/auth/login", authHandler.Login)
		r.Post("/auth/google", authHandler.GoogleAuth)

		// Protected routes
		r.Group(func(r chi.Router) {
			r.Use(middleware.JWTAuth(cfg.JWTSecret))

			// User
			r.Get("/auth/me", authHandler.GetMe)
			r.Put("/auth/me/profile", authHandler.UpdateProfile)
			r.Put("/auth/me/password", authHandler.ChangePassword)

			// Categories
			r.Get("/categories", categoryHandler.List)
			r.Get("/categories/{id}", categoryHandler.Get)
			r.Post("/categories", categoryHandler.Create)
			r.Put("/categories/{id}", categoryHandler.Update)
			r.Delete("/categories/{id}", categoryHandler.Delete)

			// Wallets
			r.Get("/wallets", walletHandler.List)
			r.Get("/wallets/{id}", walletHandler.Get)
			r.Post("/wallets", walletHandler.Create)
			r.Put("/wallets/{id}", walletHandler.Update)
			r.Delete("/wallets/{id}", walletHandler.Delete)

			// Transactions
			r.Get("/transactions", transactionHandler.List)
			r.Get("/transactions/{id}", transactionHandler.Get)
			r.Post("/transactions", transactionHandler.Create)
			r.Put("/transactions/{id}", transactionHandler.Update)
			r.Delete("/transactions/{id}", transactionHandler.Delete)
			r.Post("/transactions/transfer", transactionHandler.Transfer)

			// Budgets
			r.Get("/budgets", budgetHandler.List)
			r.Get("/budgets/{id}", budgetHandler.Get)
			r.Post("/budgets", budgetHandler.Create)
			r.Put("/budgets/{id}", budgetHandler.Update)
			r.Delete("/budgets/{id}", budgetHandler.Delete)

			// Dashboard
			r.Get("/dashboard/summary", dashboardHandler.GetSummary)

			// Goals
			r.Get("/goals", goalHandler.List)
			r.Post("/goals", goalHandler.Create)
			r.Put("/goals/{id}", goalHandler.Update)
			r.Delete("/goals/{id}", goalHandler.Delete)
			r.Post("/goals/{id}/members", goalHandler.AddMember)
			r.Post("/goals/{id}/funds", goalHandler.AddFunds)
			r.Get("/goals/{id}/history", goalHandler.GetHistory)

			// Goal Items (Shopping List)
			r.Get("/goals/{id}/items", goalHandler.GetItems)
			r.Post("/goals/{id}/items", goalHandler.AddItem)
			r.Put("/goals/items/{itemID}", goalHandler.UpdateItem)
			r.Delete("/goals/items/{itemID}", goalHandler.DeleteItem)

			// Recurring Transactions
			r.Get("/recurring", recurringHandler.List)
			r.Post("/recurring", recurringHandler.Create)
			r.Delete("/recurring/{id}", recurringHandler.Delete)

			// Data Management
			r.Get("/data/export", dataHandler.Export)
			r.Post("/data/import", dataHandler.Import)

			// Gamification
			r.Get("/gamification/status", gamificationHandler.GetStatus)

			// Analytics Score
			r.Get("/analytics/score", handlers.GetFinancialScore(db))

			// Reports
			r.Get("/reports/monthly", reportHandler.GetMonthlyReport)

			// Upload
			r.Post("/upload", uploadHandler.Upload)

			// Debts
			r.Get("/debts", debtHandler.List)
			r.Post("/debts", debtHandler.Create)
			r.Put("/debts/{id}", debtHandler.Update)
			r.Delete("/debts/{id}", debtHandler.Delete)
		})
	})

	// Serve uploaded files
	fs := http.FileServer(http.Dir("/app/uploads"))
	r.Handle("/uploads/*", http.StripPrefix("/uploads/", fs))

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	// Start server
	addr := fmt.Sprintf(":%s", cfg.ServerPort)
	log.Printf("Server starting on %s", addr)
	log.Fatal(http.ListenAndServe(addr, r))
}
