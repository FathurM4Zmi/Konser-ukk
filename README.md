# 🎫 Aplikasi Pemesanan Tiket Konser

Sistem pemesanan tiket konser dengan **panel admin berbasis web (Next.js)** dan **REST API (Express.js + MySQL)** yang siap dikonsumsi aplikasi **mobile** pelanggan.

Repo ini berisi frontend web admin, backend API, dan database dalam satu tempat.

---

## ✨ Fitur

### Web Admin (`admin-web`)

| Fitur | Status |
| --- | --- |
| Login admin (JWT) | ✅ |
| Dashboard jumlah tiket terjual & pendapatan | ✅ |
| CRUD Event / Konser | ✅ |
| CRUD Kategori Tiket (VIP, Festival, Tribune, dll) | ✅ |
| CRUD Penyanyi / Artis + line-up konser | ✅ |
| Melihat daftar pesanan (filter status, pencarian, pagination) | ✅ |
| Verifikasi / tolak pembayaran | ✅ |
| Kuota tiket per kelas + progress terjual | ✅ |
| Menutup & membuka penjualan tiket | ✅ |

### Mobile Pelanggan (API siap pakai)

| Fitur | Endpoint |
| --- | --- |
| Register / Login | `POST /api/auth/register`, `POST /api/auth/login` |
| Melihat daftar konser | `GET /api/events` |
| Detail konser + kelas tiket | `GET /api/events/:id` |
| Memilih kelas tiket & memesan | `POST /api/orders` |
| Upload bukti pembayaran | `POST /api/orders/:id/payment` |
| Melihat riwayat pesanan | `GET /api/orders/my` |
| Melihat QR Code tiket | `GET /api/orders/:id/tickets` |
| Batalkan pesanan | `POST /api/orders/:id/cancel` |

> Aplikasi mobile belum dibuat (sesuai kesepakatan). Seluruh endpoint, autentikasi, dan struktur response sudah disiapkan agar tim mobile tinggal memanggil API.

---

## 🧱 Teknologi

- **Frontend web**: Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- **Backend**: Node.js + Express.js 4 + JWT + bcrypt + express-validator
- **Database**: MySQL 8 / MariaDB 10.4+ (`mysql2`)
- **QR Code**: `qrcode` (digenerate di server saat tiket diambil)
- **Upload**: `multer` (bukti pembayaran, maks 3 MB)

---

## 📁 Struktur Folder

```
frontend-ukk/
├── admin-web/                 # Frontend web admin (Next.js)
│   ├── app/
│   │   ├── login/             # Halaman login
│   │   └── (app)/             # Halaman setelah login
│   │       ├── page.tsx       # Dashboard
│   │       ├── events/        # CRUD konser + kelas tiket
│   │       ├── artists/       # CRUD artis
│   │       └── orders/        # Daftar & verifikasi pesanan
│   ├── components/            # Sidebar, modal, alert, progress, icons
│   ├── lib/                   # API client, auth cookie, formatter, types
│   └── middleware.ts          # Proteksi route admin
│
├── backend/                   # REST API (Express)
│   ├── src/
│   │   ├── config/db.js       # Connection pool MySQL
│   │   ├── controllers/       # auth, event, category, artist, order, dashboard
│   │   ├── middleware/        # auth JWT, validasi, upload, error handler
│   │   ├── routes/            # Definisi endpoint
│   │   ├── validators/        # Aturan validasi input
│   │   └── utils/             # helper HTTP, kode tiket, tanggal
│   ├── database/
│   │   ├── schema.sql         # Struktur tabel + relasi
│   │   ├── seed.sql           # Data demo
│   │   └── setup.js           # Import schema + seed otomatis
│   └── uploads/               # File bukti pembayaran
│
├── docs/ERD.md                # ERD (Mermaid) + penjelasan relasi
├── docs/mobile/               # BRD, PRD, FRD aplikasi mobile pelanggan
├── package.json               # Script menjalankan API + web sekaligus
└── README.md
```

---

## 🗄️ Database & ERD

Diagram lengkap: [`docs/ERD.md`](docs/ERD.md)

Tabel yang saling berelasi:

```
users ──< orders >── events ──< ticket_categories
  │                     │                │
  │                     └──< event_artists >── artists
  └──< orders(verified_by)
orders ──< order_items >── ticket_categories
order_items ──< tickets (QR Code)
```

- `users` → `orders` (1:N)
- `events` → `ticket_categories` (1:N), `events` ↔ `artists` (N:M lewat `event_artists`)
- `orders` → `order_items` (1:N), `ticket_categories` → `order_items` (1:N)
- `order_items` → `tickets` (1:N, 1 tiket = 1 QR unik)

---

## 📱 Dokumen Produk Mobile

Aplikasi mobile pelanggan belum dibuat, tetapi dokumen produknya sudah lengkap dan disusun mengikuti API yang ada:

| Dokumen | Isi |
| --- | --- |
| [BRD](docs/mobile/BRD.md) | Latar belakang bisnis, tujuan & KPI, ruang lingkup, stakeholder, kebutuhan bisnis, risiko |
| [PRD](docs/mobile/PRD.md) | Visi produk, persona, user journey, peta fitur & prioritas, user stories, roadmap, metrik |
| [FRD](docs/mobile/FRD.md) | Detail fungsi per modul, alur utama & alternatif, validasi, pemetaan endpoint, state machine pesanan, traceability, gap analysis |

---

## 🚀 Cara Menjalankan

### 1. Prasyarat

- Node.js 18+ (disarankan 20+)
- MySQL / MariaDB (XAMPP atau Laragon)

### 2. Siapkan database

**Opsi A — otomatis (disarankan)**

```bash
# dari root folder
npm run setup          # install dependency backend + admin-web
npm run db:setup       # buat database, tabel, dan data demo
```

Pastikan MySQL sudah berjalan (XAMPP → Start MySQL). Kredensial dibaca dari `backend/.env`.

**Opsi B — import manual via phpMyAdmin**

1. Buka `http://localhost/phpmyadmin`
2. Tab **Import** → pilih `backend/database/schema.sql` → Go
3. Ulangi untuk `backend/database/seed.sql`

### 3. Konfigurasi backend

```bash
cd backend
cp .env.example .env
```

Isi `.env` sesuai MySQL Anda:

```env
PORT=4000
JWT_SECRET=ganti-dengan-secret-panjang
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=konser_tiket
```

### 4. Jalankan aplikasi

Dari root folder:

```bash
npm run dev
```

- Web admin → <http://localhost:3000>
- REST API → <http://localhost:4000/api>

Atau jalankan terpisah:

```bash
npm run dev:api     # terminal 1
npm run dev:web     # terminal 2
```

### 5. Login

| Role | Email | Password |
| --- | --- | --- |
| Admin (web) | `admin@konser.id` | `admin123` |
| Pelanggan (mobile) | `budi@mail.com` | `customer123` |

---

## 🔌 Dokumentasi API

Base URL: `http://localhost:4000/api`

Semua response memakai format:

```json
{ "success": true, "message": "...", "data": {} }
```

Error validasi:

```json
{
  "success": false,
  "message": "Data yang dikirim belum valid.",
  "errors": { "email": "Format email tidak valid." }
}
```

Autentikasi memakai header:

```
Authorization: Bearer <token>
```

### Auth

| Method | Endpoint | Akses | Keterangan |
| --- | --- | --- | --- |
| POST | `/auth/register` | publik | Daftar pelanggan (`name`, `email`, `password`, `phone`) |
| POST | `/auth/login` | publik | Login, mengembalikan `token` + `user` |
| GET | `/auth/me` | login | Profil pengguna aktif |

### Konser & Artis (mobile / publik)

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| GET | `/events` | Daftar konser `published` (+ `?search=`, `?city=`) |
| GET | `/events/:id` | Detail konser, kelas tiket, line-up |
| GET | `/artists` | Daftar artis (butuh admin) |

### Pesanan (mobile / pelanggan)

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| POST | `/orders` | Buat pesanan |
| GET | `/orders/my` | Riwayat pesanan (`?status=paid`) |
| GET | `/orders/:id` | Detail pesanan |
| POST | `/orders/:id/payment` | Upload bukti bayar (multipart `payment_proof`) |
| POST | `/orders/:id/cancel` | Batalkan pesanan |
| GET | `/orders/:id/tickets` | Tiket + QR Code (setelah lunas) |

Contoh membuat pesanan:

```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "event_id": 1,
  "items": [
    { "ticket_category_id": 1, "quantity": 2 },
    { "ticket_category_id": 2, "quantity": 1 }
  ],
  "payment_method": "Transfer BCA",
  "note": "Mohon tiket dikirim via email"
}
```

### Admin

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| GET | `/dashboard` | Statistik, penjualan per konser, pesanan terbaru |
| GET | `/events/admin/all` | Semua konser + agregat kuota |
| GET | `/events/admin/:id` | Detail konser (dengan kategori & artis) |
| POST | `/events/admin` | Buat konser |
| PUT | `/events/admin/:id` | Update konser |
| DELETE | `/events/admin/:id` | Hapus konser (ditolak jika ada pesanan) |
| PATCH | `/events/admin/:id/sales-status` | `{ "sales_status": "open" \| "closed" }` |
| GET | `/events/:eventId/categories` | Daftar kelas tiket |
| POST | `/events/:eventId/categories` | Tambah kelas tiket |
| PUT | `/events/categories/:id` | Update kelas tiket |
| DELETE | `/events/categories/:id` | Hapus kelas tiket |
| GET | `/artists` | Daftar artis (`?search=`) |
| POST/PUT/DELETE | `/artists`, `/artists/:id` | CRUD artis |
| GET | `/admin/orders` | Daftar pesanan (`?status=&search=&page=&limit=`) |
| PATCH | `/admin/orders/:id/verify` | `{ "action": "approve" \| "reject", "note": "..." }` |

---

## 🔄 Alur Status Pesanan

```
pending ──upload bukti──> waiting_verification ──approve──> paid  (tiket + QR dibuat)
   │                              │
   └──────────cancel──────────────┴──reject──> rejected  (kuota dikembalikan)
```

- Kuota (`ticket_categories.sold`) bertambah saat pesanan dibuat dan dikembalikan saat ditolak/dibatalkan.
- Tiket hanya bisa diambil (`/orders/:id/tickets`) setelah status `paid`.
- QR Code berisi `ticket_code` unik per lembar tiket.

---

## ✅ Ketentuan Teknis yang Dipenuhi

- **ERD & relasi database** → `docs/ERD.md`, tabel saling berelasi dengan foreign key.
- **REST API** → seluruh operasi melalui endpoint JSON.
- **Semua data di database** → tidak ada data dummy di frontend; semua fetch dari API.
- **Validasi input** → `express-validator` di backend + validasi HTML/UX di frontend, pesan error per field.
- **Upload source code ke GitHub** → lihat langkah di bawah.

---

## 📤 Upload ke GitHub

```bash
git init
git add .
git commit -m "feat: aplikasi pemesanan tiket konser (admin web + REST API + MySQL)"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

File `.env`, `node_modules`, `.next`, dan file upload pelanggan sudah dikecualikan lewat `.gitignore`.

---

## 🛠️ Troubleshooting

| Masalah | Solusi |
| --- | --- |
| `ECONNREFUSED 127.0.0.1:3306` | MySQL belum jalan. Start MySQL di XAMPP/Laragon. |
| `Fatal error: Can't open and lock privilege tables` | Data MySQL XAMPP korup. Backup folder `xampp/mysql/data`, lalu re-initialize atau gunakan instalasi MySQL lain. |
| Web menampilkan "Tidak dapat terhubung ke server API" | Pastikan backend berjalan di `http://localhost:4000` dan `NEXT_PUBLIC_API_URL` di `admin-web/.env.local` benar. |
| Login admin gagal padahal password benar | Pastikan memakai akun dengan `role = admin` (`admin@konser.id`). |
| Gambar bukti bayar tidak muncul | Cek folder `backend/uploads/` dan pastikan API menyajikan `/uploads`. |
