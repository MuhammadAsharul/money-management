# Money Management - Financial Tracker

Aplikasi full-stack untuk tracking keuangan personal dengan Next.js dan Golang.

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Recharts
- **Backend**: Go, Chi Router, GORM
- **Database**: PostgreSQL
- **Auth**: JWT + OAuth Google

## Prerequisites

- Node.js 18+
- Go 1.21+
- PostgreSQL

## Setup

### 1. Database

Buat database PostgreSQL:
```sql
CREATE DATABASE money_management;
```

### 2. Backend

```bash
cd backend

# Set environment variables (optional, ada default values)
export DATABASE_URL="postgres://postgres:password@localhost:5432/money_management?sslmode=disable"
export JWT_SECRET="your-secret-key"
export SERVER_PORT="8080"

# Run
go run cmd/main.go
```

Backend akan berjalan di `http://localhost:8080`

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend akan berjalan di `http://localhost:3000`

## Features

- ✅ User Registration & Login
- ✅ Dashboard dengan ringkasan keuangan
- ✅ CRUD Transaksi (pemasukan/pengeluaran)
- ✅ CRUD Kategori dengan icon & color picker
- ✅ Budget management per kategori
- ✅ Visualisasi dengan pie chart

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/transactions` | List transaksi |
| POST | `/api/transactions` | Buat transaksi |
| PUT | `/api/transactions/:id` | Update transaksi |
| DELETE | `/api/transactions/:id` | Hapus transaksi |
| GET | `/api/categories` | List kategori |
| POST | `/api/categories` | Buat kategori |
| PUT | `/api/categories/:id` | Update kategori |
| DELETE | `/api/categories/:id` | Hapus kategori |
| GET | `/api/budgets` | List budget |
| POST | `/api/budgets` | Buat budget |
| PUT | `/api/budgets/:id` | Update budget |
| DELETE | `/api/budgets/:id` | Hapus budget |
| GET | `/api/dashboard/summary` | Dashboard summary |
