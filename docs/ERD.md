# ERD — Aplikasi Pemesanan Tiket Konser

## Diagram Relasi

```mermaid
erDiagram
    USERS ||--o{ ORDERS : "membuat pesanan"
    USERS ||--o{ ORDERS : "memverifikasi (admin)"
    EVENTS ||--o{ TICKET_CATEGORIES : "memiliki kelas tiket"
    EVENTS ||--o{ EVENT_ARTISTS : "menampilkan"
    ARTISTS ||--o{ EVENT_ARTISTS : "tampil di"
    EVENTS ||--o{ ORDERS : "dipesan pada"
    ORDERS ||--|{ ORDER_ITEMS : "berisi"
    TICKET_CATEGORIES ||--o{ ORDER_ITEMS : "dipilih pada"
    ORDER_ITEMS ||--o{ TICKETS : "menghasilkan"

    USERS {
        bigint id PK
        varchar name
        varchar email UK
        varchar password
        varchar phone
        enum role "admin | customer"
        timestamp created_at
    }

    ARTISTS {
        bigint id PK
        varchar name
        varchar genre
        varchar photo_url
        text bio
    }

    EVENTS {
        bigint id PK
        varchar title
        text description
        varchar venue
        varchar city
        datetime event_date
        varchar poster_url
        enum status "draft | published"
        enum sales_status "open | closed"
    }

    EVENT_ARTISTS {
        bigint event_id PK, FK
        bigint artist_id PK, FK
    }

    TICKET_CATEGORIES {
        bigint id PK
        bigint event_id FK
        varchar name
        decimal price
        int quota
        int sold
        varchar description
    }

    ORDERS {
        bigint id PK
        varchar order_code UK
        bigint user_id FK
        bigint event_id FK
        decimal total_amount
        enum status "pending | waiting_verification | paid | rejected | cancelled"
        varchar payment_method
        varchar payment_proof
        text note
        datetime paid_at
        bigint verified_by FK
        datetime verified_at
    }

    ORDER_ITEMS {
        bigint id PK
        bigint order_id FK
        bigint ticket_category_id FK
        int quantity
        decimal price
        decimal subtotal
    }

    TICKETS {
        bigint id PK
        bigint order_item_id FK
        varchar ticket_code UK
        enum status "active | used"
        datetime checked_in_at
    }
```

## Penjelasan Relasi

| Relasi | Kardinalitas | Keterangan |
| --- | --- | --- |
| `users` → `orders` | 1 : N | Satu pelanggan dapat membuat banyak pesanan. |
| `users` → `orders.verified_by` | 1 : N | Admin yang memverifikasi pembayaran (nullable). |
| `events` → `ticket_categories` | 1 : N | Satu konser punya banyak kelas tiket (VIP, Festival, dll). |
| `events` ↔ `artists` | N : M | Lewat tabel pivot `event_artists` (line-up konser). |
| `events` → `orders` | 1 : N | Pesanan selalu terikat pada satu konser. |
| `orders` → `order_items` | 1 : N | Satu pesanan dapat berisi beberapa kelas tiket. |
| `ticket_categories` → `order_items` | 1 : N | Kelas tiket dapat dipilih di banyak pesanan. |
| `order_items` → `tickets` | 1 : N | Satu item dengan qty N menghasilkan N baris tiket unik (QR). |

## Aturan Bisnis Penting

1. **Kuota** — `ticket_categories.quota` adalah total tiket, `sold` bertambah saat pesanan dibuat (kuota di-reserve).
   `CHECK (sold <= quota)` mencegah overselling di level database, ditambah pengecekan `FOR UPDATE` di transaksi API.
2. **Tutup penjualan** — `events.sales_status = 'closed'` membuat endpoint pemesanan menolak transaksi baru.
3. **Verifikasi pembayaran** — `waiting_verification` → `paid` (tiket + QR dibuat) atau `rejected` (kuota dikembalikan).
4. **Pembatalan** — pesanan `pending` / `waiting_verification` yang dibatalkan mengembalikan `sold`.
5. **Hapus data** — konser yang sudah punya pesanan tidak dapat dihapus; kelas tiket yang sudah dipakai pesanan juga tidak.
