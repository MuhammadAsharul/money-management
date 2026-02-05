# Money Management - Financial Tracker

Aplication full-stack untuk tracking keuangan personal dengan Next.js dan Golang.

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Recharts
- **Backend**: Go, Chi Router, GORM
- **Database**: PostgreSQL
- **Auth**: JWT + OAuth Google

## Quick Start (Docker) 🚀

Cara termudah untuk menjalankan aplikasi ini adalah menggunakan Docker.

### 1. Clone Repository
```bash
git clone https://github.com/MuhammadAsharul/money-management.git
cd money-management
```

### 2. Jalankan Aplikasi
```bash
docker-compose up --build
```
Tunggu hingga proses build selesai dan container berjalan.

### 3. Akses Aplikasi
- **Frontend**: Buka [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8080/api/health](http://localhost:8080/api/health)
- **Database Manager (Adminer)**: [http://localhost:8081](http://localhost:8081)
  - System: PostgreSQL
  - Server: `db`
  - Username: `postgres`
  - Password: `password`
  - Database: `money_management`

## Fitur Utama

- ✅ **Dashboard**: Ringkasan saldo, pemasukan, pengeluaran & grafik tren.
- ✅ **Transaksi**: Catat pemasukan & pengeluaran dengan kategori custom.
- ✅ **Budgeting**: Atur batas pengeluaran bulanan agar tidak boncos.
- ✅ **Debt Tracking**: Catat utang & piutang teman/kerabat.
- ✅ **Laporan Bulanan**: Export laporan keuangan ke PDF.
- ✅ **Multi-bahasa**: Mendukung Bahasa Indonesia & Inggris.
- ✅ **Dark Mode**: Tampilan nyaman di mata.

## Pengembangan Manual (Tanpa Docker)

Jika ingin menjalankan service secara manual (untuk development):

### Backend
```bash
cd backend
go run cmd/main.go
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
