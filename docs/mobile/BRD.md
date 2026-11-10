# BRD — Business Requirement Document
## Aplikasi Mobile Pemesanan Tiket Konser "Konseria"

| Item | Keterangan |
| --- | --- |
| Nama produk | Konseria Mobile (aplikasi pelanggan) |
| Versi dokumen | 1.0 |
| Tanggal | 10 November 2026 |
| Status | Disetujui untuk pengembangan MVP |
| Pemilik produk | Penyelenggara konser / tim Konseria |
| Dokumen terkait | [PRD](PRD.md) · [FRD](FRD.md) · [ERD](../ERD.md) |

---

## 1. Ringkasan Eksekutif

Konseria saat ini memiliki panel admin berbasis web dan REST API untuk mengelola konser, kelas tiket, kuota, pesanan, serta verifikasi pembayaran. Namun pelanggan belum memiliki kanal untuk membeli tiket secara mandiri — pemesanan masih dilakukan manual.

Aplikasi mobile pelanggan akan menjadi kanal penjualan utama: pelanggan mendaftar, melihat katalog konser, memilih kelas tiket, membayar, lalu menerima tiket digital ber-QR Code yang dapat dipindai di pintu masuk.

Dokumen ini mendefinisikan **kebutuhan bisnis** (mengapa), bukan detail teknis (bagaimana). Detail fungsi ada di FRD.

---

## 2. Latar Belakang & Masalah Bisnis

| Masalah | Dampak saat ini |
| --- | --- |
| Penjualan tiket dilakukan manual (form/WA) | Proses lambat, rawan salah catat, tidak scalable saat konser besar |
| Tidak ada katalog konser terpusat | Calon penonton sulit mengetahui jadwal dan harga |
| Verifikasi pembayaran manual tanpa bukti terstruktur | Admin sulit mencocokkan transfer dengan pesanan |
| Tiket fisik/PDF tanpa QR | Antrean masuk lambat, risiko tiket palsu |
| Data penjualan tidak real-time | Sulit mengambil keputusan kuota dan promosi |

---

## 3. Tujuan Bisnis

| Kode | Tujuan | Ukuran Keberhasilan (KPI) | Target 6 bulan |
| --- | --- | --- | --- |
| BO-01 | Memindahkan penjualan tiket ke kanal digital mandiri | % tiket terjual via aplikasi | ≥ 70% |
| BO-02 | Mempercepat proses pemesanan | Waktu dari buka aplikasi sampai pesanan dibuat | ≤ 3 menit |
| BO-03 | Mengurangi kesalahan pencatatan pesanan | Selisih data pesanan vs pembayaran | ≤ 1% |
| BO-04 | Mempercepat verifikasi pembayaran | Rata-rata waktu verifikasi admin | ≤ 30 menit |
| BO-05 | Mengurangi antrean & tiket palsu | % tiket dengan QR valid | 100% |
| BO-06 | Meningkatkan repeat purchase | Rasio pelanggan dengan ≥ 2 pesanan | ≥ 25% |

---

## 4. Ruang Lingkup

### 4.1 Termasuk (MVP)

1. Registrasi & login pelanggan.
2. Katalog konser yang sudah dipublikasikan.
3. Detail konser: jadwal, venue, line-up, kelas tiket, sisa kuota, harga.
4. Pemesanan tiket per kelas dengan batas kuota.
5. Upload bukti pembayaran (transfer/QRIS manual).
6. Riwayat & status pesanan.
7. Tiket digital ber-QR Code setelah pembayaran diverifikasi.

### 4.2 Tidak Termasuk (MVP)

1. Payment gateway otomatis (Midtrans/Xendit) — pembayaran masih transfer manual + verifikasi admin.
2. Pembatalan/refund otomatis ke rekening (hanya pembatalan pesanan sebelum diverifikasi).
3. Check-in/scan QR oleh petugas (direncanakan fase berikutnya).
4. Fitur sosial: ulasan, wishlist, referral, kode promo.
5. Multi-bahasa & multi-mata uang.
6. Aplikasi iOS terpisah (satu codebase React Native untuk Android & iOS).

---

## 5. Stakeholder

| Stakeholder | Peran | Kepentingan utama |
| --- | --- | --- |
| Penyelenggara konser | Pemilik produk | Penjualan maksimal, data penonton |
| Admin operasional | Pengguna panel web | Verifikasi pembayaran cepat, kuota akurat |
| Pelanggan | Pengguna aplikasi | Beli tiket mudah, tiket pasti valid |
| Tim keuangan | Rekonsiliasi | Kecocokan nominal transfer vs pesanan |
| Petugas venue | Gate check | QR dapat diverifikasi |

---

## 6. Kebutuhan Bisnis

Prioritas memakai MoSCoW: **M** = Must, **S** = Should, **C** = Could.

| Kode | Kebutuhan bisnis | Prioritas | Terkait fitur |
| --- | --- | --- | --- |
| BR-01 | Pelanggan dapat membuat akun sendiri tanpa bantuan admin | M | Registrasi |
| BR-02 | Pelanggan hanya melihat konser yang sudah dipublikasikan | M | Katalog konser |
| BR-03 | Pelanggan melihat harga dan sisa kuota tiap kelas secara transparan | M | Detail konser |
| BR-04 | Sistem mencegah penjualan melebihi kuota kelas tiket | M | Pemesanan |
| BR-05 | Pesanan mencatat rincian kelas, jumlah, dan harga saat transaksi | M | Pemesanan |
| BR-06 | Penjualan tiket dapat ditutup per konser oleh admin | M | Pemesanan |
| BR-07 | Pelanggan mengunggah bukti pembayaran sebagai dasar verifikasi | M | Pembayaran |
| BR-08 | Admin dapat menyetujui/menolak pembayaran, dan kuota kembali saat ditolak | M | Verifikasi |
| BR-09 | Pelanggan dapat memantau status pesanan dan riwayatnya | M | Riwayat pesanan |
| BR-10 | Setiap lembar tiket memiliki kode unik dan QR yang hanya terbit setelah lunas | M | Tiket digital |
| BR-11 | Pelanggan dapat membatalkan pesanan yang belum diverifikasi | S | Pembatalan |
| BR-12 | Pelanggan mendapat notifikasi status pesanan | C | Notifikasi (fase 2) |

---

## 7. Proses Bisnis

### 7.1 Saat ini (As-Is)

```
Pelanggan lihat promosi → chat admin → transfer manual → kirim bukti via chat
→ admin cek mutasi → admin catat di spreadsheet → kirim tiket PDF manual
```

Titik lemah: tidak ada validasi kuota real-time, bukti bayar tersebar, rawan human error.

### 7.2 Usulan (To-Be)

```
Pelanggan buka aplikasi → pilih konser → pilih kelas & jumlah
→ sistem cek kuota & kunci sementara → pesanan dibuat (status: pending)
→ pelanggan transfer → unggah bukti (status: menunggu verifikasi)
→ admin verifikasi → status: lunas → tiket + QR terbit di aplikasi
→ pelanggan tunjukkan QR di pintu masuk
```

---

## 8. Asumsi & Ketergantungan

| Kode | Asumsi / Ketergantungan | Dampak jika tidak terpenuhi |
| --- | --- | --- |
| AS-01 | REST API (`/api`) dan database MySQL sudah berjalan | Aplikasi tidak dapat menampilkan data |
| AS-02 | Admin aktif memverifikasi pembayaran pada hari kerja | Tiket tidak terbit, pelanggan menunggu |
| AS-03 | Pelanggan memiliki koneksi internet saat memesan | Pemesanan gagal, perlu retry |
| AS-04 | Nominal transfer sesuai total pesanan | Pembayaran ditolak, kuota dikembalikan |
| AS-05 | Konser dipublikasikan (`status = published`) sebelum dijual | Konser tidak muncul di aplikasi |
| AS-06 | Satu akun = satu identitas pelanggan (email unik) | Duplikasi pesanan |

---

## 9. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Overselling saat banyak pesanan bersamaan | Pelanggan kecewa, refund manual | Transaksi database `FOR UPDATE` + `CHECK (sold <= quota)` sudah diterapkan di API |
| Bukti transfer palsu / tidak sesuai | Kerugian finansial | Verifikasi manual admin + arsip bukti di server |
| Pesanan `pending` menahan kuota | Tiket tidak terjual | Kebijakan batas waktu bayar (rekomendasi fase 2: auto-cancel) |
| Token kedaluwarsa saat transaksi | Gagal bayar | Auto-logout + arahkan login ulang, token berlaku 7 hari |
| Pelanggan tidak paham alur transfer manual | Pesanan terbengkalai | Instruksi pembayaran jelas + status pesanan real-time |

---

## 10. Kriteria Keberhasilan Bisnis

1. Pelanggan dapat menyelesaikan pembelian tiket tanpa intervensi admin, kecuali verifikasi pembayaran.
2. Tidak ada pesanan yang melebihi kuota pada pengujian beban normal.
3. 100% tiket yang terbit memiliki kode unik dan QR yang dapat ditampilkan.
4. Admin dapat memverifikasi pembayaran dari panel web tanpa perlu menghubungi pelanggan.
5. Waktu rata-rata pemesanan (dari buka aplikasi sampai pesanan dibuat) ≤ 3 menit pada uji pengguna.

---

## 11. Batasan

- Pembayaran bersifat **manual**; tidak ada integrasi payment gateway pada MVP.
- Data pribadi yang disimpan: nama, email, nomor telepon, riwayat pesanan (tidak ada data kartu).
- Aplikasi hanya untuk pelanggan (`role = customer`); akun admin ditolak saat login mobile.
- Kuota di-reserve saat pesanan dibuat, bukan saat pembayaran diverifikasi.
