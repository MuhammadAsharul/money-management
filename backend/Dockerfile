# Build stage
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Install git for fetching dependencies
RUN apk add --no-cache git

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download all dependencies
RUN go mod download

# Copy the source code
COPY . .

# Build the application
# Adjust the build path if your main file is located elsewhere
RUN go build -o main ./cmd/main.go

# Final stage
FROM alpine:latest

WORKDIR /root/

# Install ca-certificates for HTTPS
RUN apk --no-cache add ca-certificates

# Copy the binary from the builder
COPY --from=builder /app/main .

# Copy environment file example if needed, but we will use docker-compose env
# COPY .env .

# Expose the application port
EXPOSE 8080

# Command to run the application
CMD ["./main"]
