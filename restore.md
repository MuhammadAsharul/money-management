Panduan Migrasi Data ke Docker
Karena Anda sebelumnya menjalankan aplikasi secara manual (non-docker), data Anda tersimpan di database Postgres lokal di komputer Anda. Docker menggunakan database sendiri yang masih kosong. Berikut cara memindahkan datanya.

Prasyarat
Docker Anda saat ini sedang berjalan (money-management-db harus aktif).
Anda memiliki akses ke terminal/CMD.
Langkah 1: Backup Data Lokal
Kita perlu mengambil data dari Postgres lokal Anda. Karena pg_dump tidak terdeteksi di terminal Anda, kita akan menggunakan Docker untuk melakukan backup (trik ini menggunakan host.docker.internal untuk mengakses komputer host).

Matikan dulu Docker sementara (agar port 5432 bisa dipakai Postgres lokal Anda, jika konflik):

docker-compose down
Pastikan Postgres Lokal Berjalan. Cek aplikasi seperti pgAdmin atau services di Windows.

Jalankan perintah ini untuk backup (Copy-paste ke terminal):

docker run --rm -e PGPASSWORD=B1sm1r0bb1k4123 postgres pg_dump -h host.docker.internal -U postgres -d money_management > backup.sql
Jika berhasil, akan muncul file backup.sql. Jika error koneksi, pastikan Postgres lokal menyala.

Langkah 2: Restore ke Docker
Setelah Anda punya file backup.sql:

Nyalakan kembali Docker:

docker-compose up -d db backend
Tunggu sebentar (10-20 detik) sampai database siap.

Restore data:

docker exec -i money-management-db psql -U postgres -d money_management < backup.sql
Selesai
Data Anda sekarang sudah ada di Docker! Anda bisa cek di aplikasi.


docker-compose up --build -d frontend
docker-compose up --build -d backend
docker-compose up --build -d backend frontend
docker-compose build --no-cache backend