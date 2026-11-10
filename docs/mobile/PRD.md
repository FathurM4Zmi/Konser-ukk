# PRD — Product Requirement Document
## Aplikasi Mobile Pelanggan "Konseria"

| Item | Keterangan |
| --- | --- |
| Versi | 1.0 |
| Tanggal | 10 November 2026 |
| Status | Ready for development |
| Platform | Android & iOS (React Native / Expo) |
| Pemilik | Tim Produk Konseria |
| Dokumen terkait | [BRD](BRD.md) · [FRD](FRD.md) · [ERD](../ERD.md) |

---

## 1. Visi Produk

> "Beli tiket konser dalam tiga menit, tiket langsung masuk ke ponsel."

Konseria Mobile adalah aplikasi pelanggan untuk menemukan konser, membeli tiket per kelas, membayar, dan menyimpan tiket digital ber-QR Code. Aplikasi ini adalah wajah utama bisnis tiket; panel web admin hanya untuk operasional.

**Prinsip desain**

1. **Cepat** — alur beli maksimal 4 layar dari katalog ke pesanan dibuat.
2. **Jelas** — harga, sisa kuota, dan status pesanan selalu terlihat.
3. **Tenang** — pengguna selalu tahu langkah berikutnya (terutama saat menunggu verifikasi).
4. **Jujur** — jangan pernah menampilkan tiket sebelum pembayaran benar-benar lunas.

---

## 2. Target Pengguna

### Persona 1 — "Rani, 23, mahasiswa"
- Suka konser pop, sensitif harga, memesan lewat ponsel sambil scroll media sosial.
- Butuh: katalog cepat, kelas tiket termurah terlihat jelas, proses singkat.
- Frustrasi: aplikasi lambat, harus chat admin, tidak tahu tiket sudah valid atau belum.

### Persona 2 — "Dimas, 31, pekerja"
- Membeli 2–4 tiket untuk teman, memilih kelas VIP.
- Butuh: pesan beberapa tiket sekaligus, bukti bayar mudah diunggah, tiket bisa dibagikan.
- Frustrasi: kuota habis saat checkout, pembayaran tidak jelas statusnya.

### Persona 3 — "Pak Hendra, 45, orang tua"
- Membelikan tiket untuk anaknya, kurang familiar dengan aplikasi.
- Butuh: teks besar, tombol jelas, instruksi pembayaran rinci.
- Frustrasi: istilah teknis, error tanpa penjelasan.

---

## 3. User Journey Utama

```
[1] Buka app ──▶ [2] Daftar/Login ──▶ [3] Katalog konser
                                            │
                                            ▼
[4] Detail konser ──▶ [5] Pilih kelas & jumlah ──▶ [6] Ringkasan pesanan
                                                          │
                                                          ▼
[7] Instruksi bayar ──▶ [8] Upload bukti ──▶ [9] Menunggu verifikasi
                                                          │
                                                          ▼
                                              [10] Tiket + QR Code
```

**Momen kritis**
- Langkah 5: kuota bisa habis saat itu juga → pesan error harus jelas dan menawarkan kelas lain.
- Langkah 9: status menunggu bisa lama → beri estimasi dan cara menghubungi admin.
- Langkah 10: tiket harus bisa dibuka tanpa koneksi (cache) agar aman di venue.

---

## 4. Peta Fitur & Prioritas

| ID | Fitur | Prioritas | Rilis |
| --- | --- | --- | --- |
| F-01 | Splash & cek sesi | Must | MVP |
| F-02 | Registrasi akun | Must | MVP |
| F-03 | Login & logout | Must | MVP |
| F-04 | Katalog konser (cari & filter kota) | Must | MVP |
| F-05 | Detail konser | Must | MVP |
| F-06 | Pilih kelas tiket & jumlah | Must | MVP |
| F-07 | Konfirmasi & buat pesanan | Must | MVP |
| F-08 | Instruksi pembayaran | Must | MVP |
| F-09 | Upload bukti pembayaran | Must | MVP |
| F-10 | Riwayat pesanan + filter status | Must | MVP |
| F-11 | Detail pesanan & status | Must | MVP |
| F-12 | Tiket digital + QR Code | Must | MVP |
| F-13 | Batalkan pesanan | Should | MVP |
| F-14 | Profil pengguna | Should | MVP |
| F-15 | Notifikasi status pesanan | Could | v1.1 |
| F-16 | Simpan tiket offline | Should | v1.1 |
| F-17 | Bagikan tiket ke teman | Could | v1.1 |
| F-18 | Kode promo | Won't (MVP) | v2 |
| F-19 | Payment gateway otomatis | Won't (MVP) | v2 |

---

## 5. User Stories

| ID | Sebagai | Saya ingin | Agar | Prioritas |
| --- | --- | --- | --- | --- |
| US-01 | pengunjung | mendaftar dengan email | bisa membeli tiket | Must |
| US-02 | pelanggan | login dan tetap masuk | tidak mengetik ulang tiap buka app | Must |
| US-03 | pelanggan | melihat daftar konser mendatang | memilih yang menarik | Must |
| US-04 | pelanggan | mencari konser berdasarkan nama/kota | cepat menemukan konser | Must |
| US-05 | pelanggan | melihat detail konser, harga, sisa kuota | memutuskan kelas tiket | Must |
| US-06 | pelanggan | memesan lebih dari satu tiket | membeli untuk teman | Must |
| US-07 | pelanggan | mendapat pesan jelas saat kuota habis | memilih kelas lain | Must |
| US-08 | pelanggan | melihat instruksi transfer | membayar dengan benar | Must |
| US-09 | pelanggan | mengunggah foto bukti transfer | pesanan diverifikasi | Must |
| US-10 | pelanggan | melihat status pesanan | tahu harus menunggu atau bayar | Must |
| US-11 | pelanggan | membuka QR tiket | masuk ke venue | Must |
| US-12 | pelanggan | membatalkan pesanan | kuota tidak terbuang | Should |
| US-13 | pelanggan | melihat profil saya | memastikan data benar | Should |

**Acceptance criteria contoh (US-05):**
- Diberikan konser dipublikasikan, ketika pelanggan membuka detail, maka tampil judul, tanggal, venue, kota, deskripsi, line-up, dan seluruh kelas tiket beserta harga dan sisa kuota.
- Diberikan kelas tiket dengan sisa 0, maka tombol pilih nonaktif dan diberi label "Habis".
- Diberikan penjualan ditutup admin, maka muncul banner "Penjualan ditutup" dan tombol pesan nonaktif.

---

## 6. Peta Layar

| No | Layar | Tujuan | Elemen utama |
| --- | --- | --- | --- |
| S-01 | Splash | Cek token, arahkan ke Login/Home | Logo, loading |
| S-02 | Login | Autentikasi | Email, password, tautan daftar |
| S-03 | Register | Buat akun | Nama, email, telepon, password |
| S-04 | Home / Katalog | Menjelajah konser | Search, filter kota, kartu konser |
| S-05 | Detail Konser | Meyakinkan & memilih | Poster, info, line-up, daftar kelas, CTA "Pesan Tiket" |
| S-06 | Pilih Tiket | Atur jumlah | Stepper qty per kelas, ringkasan total |
| S-07 | Checkout | Konfirmasi | Data pemesan, metode bayar, total, tombol buat pesanan |
| S-08 | Instruksi Bayar | Panduan transfer | Nominal, rekening, batas waktu, tombol upload |
| S-09 | Upload Bukti | Kirim bukti | Pemilih gambar, preview, kirim |
| S-10 | Riwayat | Pantau pesanan | Tab status, kartu pesanan |
| S-11 | Detail Pesanan | Rincian & aksi | Item, total, status, bukti, aksi |
| S-12 | Tiket & QR | Masuk venue | Kartu tiket, QR besar, kode manual |
| S-13 | Profil | Akun | Nama, email, telepon, logout |

---

## 7. Requirement Fungsional Tingkat Produk

| Kode | Requirement | Prioritas |
| --- | --- | --- |
| PR-01 | Aplikasi menolak login akun non-customer dengan pesan yang jelas | Must |
| PR-02 | Sesi disimpan aman dan dipulihkan saat aplikasi dibuka kembali | Must |
| PR-03 | Katalog hanya menampilkan konser `published`, urut tanggal terdekat | Must |
| PR-04 | Detail konser menampilkan sisa kuota real-time dari server | Must |
| PR-05 | Jumlah tiket per kelas dibatasi 1–10 per transaksi | Must |
| PR-06 | Total dihitung otomatis dan tidak dapat diubah pengguna | Must |
| PR-07 | Pesanan dibuat atomik: jika satu kelas gagal, seluruh pesanan batal | Must |
| PR-08 | Status pesanan mengikuti alur: pending → menunggu verifikasi → lunas/ditolak | Must |
| PR-09 | QR hanya tampil setelah status lunas | Must |
| PR-10 | Riwayat pesanan dapat difilter berdasarkan status | Must |
| PR-11 | Pesanan yang belum diverifikasi dapat dibatalkan pengguna | Should |
| PR-12 | Semua error dari server ditampilkan dalam bahasa Indonesia yang dapat ditindaklanjuti | Must |

---

## 8. Requirement Non-Fungsional

| Aspek | Target |
| --- | --- |
| Performa | Katalog tampil < 2 detik pada jaringan 4G; checkout < 3 detik |
| Ukuran aplikasi | < 40 MB |
| Kompatibilitas | Android 8+ dan iOS 14+ |
| Keamanan | Token JWT disimpan di secure storage (Keychain/Keystore), bukan AsyncStorage biasa |
| Aksesibilitas | Kontras minimal 4.5:1, target sentuh ≥ 44×44 dp, mendukung font scaling |
| Offline | Tiket yang sudah lunas dapat dibuka tanpa jaringan (cache lokal) |
| Bahasa | Bahasa Indonesia, format Rupiah `Rp1.500.000`, tanggal `5 Des 2026` |
| Error handling | Tidak boleh crash; selalu ada empty state dan tombol coba lagi |
| Analytics | Event: `view_event`, `select_ticket`, `create_order`, `upload_proof`, `view_ticket` |

---

## 9. Metrik Produk

| Metrik | Definisi | Target MVP |
| --- | --- | --- |
| Conversion rate | Pesanan dibuat ÷ detail konser dibuka | ≥ 8% |
| Checkout completion | Pesanan dibayar ÷ pesanan dibuat | ≥ 60% |
| Time to order | Rata-rata durasi katalog → pesanan dibuat | ≤ 3 menit |
| Payment proof rate | Pesanan dengan bukti ÷ pesanan dibuat | ≥ 70% dalam 24 jam |
| Ticket view rate | Tiket dibuka ÷ tiket terbit | ≥ 90% sebelum hari-H |
| Crash-free session | Sesi tanpa crash | ≥ 99.5% |

---

## 10. Roadmap

| Fase | Cakupan | Fokus |
| --- | --- | --- |
| **MVP (v1.0)** | F-01 s.d. F-14 | Alur beli lengkap dengan pembayaran manual |
| v1.1 | F-15, F-16, F-17 | Notifikasi push, tiket offline, bagikan tiket |
| v2.0 | F-18, F-19 | Promo, payment gateway, refund otomatis |
| v2.1 | Check-in scanner untuk petugas | Validasi QR di venue |

---

## 11. Dependensi Teknis

- REST API: `http://<host>:4000/api` (header `Authorization: Bearer <token>`).
- Semua response memakai envelope `{ success, message, data }`; error validasi memakai `errors` per field.
- Gambar (poster, foto artis, bukti bayar) diakses melalui URL absolut dari server.
- Belum tersedia di API (perlu penambahan sebelum fitur terkait dikerjakan):
  - `PATCH /api/auth/me` untuk ubah profil → menahan fitur edit profil.
  - Endpoint notifikasi/push token → menahan F-15.
  - Endpoint check-in QR → menahan fitur scanner petugas.
  - Batas waktu pembayaran otomatis (`expired_at`) → belum ada auto-cancel.

---

## 12. Pertanyaan Terbuka

| No | Pertanyaan | Dampak |
| --- | --- | --- |
| 1 | Berapa batas waktu pembayaran sebelum pesanan otomatis dibatalkan? | Perlu kolom `expired_at` + job scheduler |
| 2 | Apakah satu pesanan boleh berisi beberapa konser? | Saat ini 1 pesanan = 1 konser |
| 3 | Apakah tiket boleh dipindahtangankan? | Mempengaruhi desain QR & validasi identitas |
| 4 | Perlu biaya layanan/admin fee? | Mempengaruhi perhitungan total di API |
| 5 | Apakah perlu login sebelum melihat katalog? | Saat ini katalog bisa tanpa login |
