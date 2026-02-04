package config

import (
	"os"
)

type Config struct {
	DatabaseURL string
	JWTSecret   string
	ServerPort  string
	GoogleClientID     string
	GoogleClientSecret string
}

func Load() *Config {
	return &Config{
		DatabaseURL:        getEnv("DATABASE_URL", "postgres://postgres:password@localhost:5432/money_management?sslmode=disable"),
		JWTSecret:          getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		ServerPort:         getEnv("SERVER_PORT", "8080"),
		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
