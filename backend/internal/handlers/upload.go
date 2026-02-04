package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/money-management/backend/pkg/middleware"
)

type UploadHandler struct{}

func NewUploadHandler() *UploadHandler {
	return &UploadHandler{}
}

type UploadResponse struct {
	URL string `json:"url"`
}

func (h *UploadHandler) Upload(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	// Parse multipart form with 10MB max
	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		http.Error(w, "File too large or invalid", http.StatusBadRequest)
		return
	}

	file, handler, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "No file provided", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Validate file type
	contentType := handler.Header.Get("Content-Type")
	validTypes := map[string]bool{
		"image/jpeg": true,
		"image/png":  true,
		"image/gif":  true,
		"image/webp": true,
	}
	if !validTypes[contentType] {
		http.Error(w, "Invalid file type. Only images allowed.", http.StatusBadRequest)
		return
	}

	// Create uploads directory if not exists
	uploadDir := "/app/uploads"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		http.Error(w, "Error creating upload directory", http.StatusInternalServerError)
		return
	}

	// Generate unique filename
	ext := filepath.Ext(handler.Filename)
	filename := fmt.Sprintf("%d_%d%s", userID, time.Now().UnixNano(), ext)
	filePath := filepath.Join(uploadDir, filename)

	// Create file
	dst, err := os.Create(filePath)
	if err != nil {
		http.Error(w, "Error saving file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	// Copy file content
	if _, err := io.Copy(dst, file); err != nil {
		http.Error(w, "Error copying file", http.StatusInternalServerError)
		return
	}

	// Return URL
	url := "/uploads/" + filename

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(UploadResponse{URL: url})
}
