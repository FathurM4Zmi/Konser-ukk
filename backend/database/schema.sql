-- ============================================================
--  Aplikasi Pemesanan Tiket Konser
--  Skema Database MySQL (ERD: lihat docs/ERD.md)
-- ============================================================

CREATE DATABASE IF NOT EXISTS konser_tiket
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE konser_tiket;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS ticket_categories;
DROP TABLE IF EXISTS event_artists;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS artists;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- users : admin (web) & customer (mobile)
-- ------------------------------------------------------------
CREATE TABLE users (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100)    NOT NULL,
  email         VARCHAR(150)    NOT NULL,
  password      VARCHAR(255)    NOT NULL,
  phone         VARCHAR(20)     NULL,
  role          ENUM('admin','customer') NOT NULL DEFAULT 'customer',
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- artists : penyanyi / artis
-- ------------------------------------------------------------
CREATE TABLE artists (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(150)    NOT NULL,
  genre         VARCHAR(80)     NULL,
  photo_url     VARCHAR(500)    NULL,
  bio           TEXT            NULL,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_artists_name (name)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- events : konser
-- sales_status = tutup/buka penjualan tiket
-- ------------------------------------------------------------
CREATE TABLE events (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title         VARCHAR(200)    NOT NULL,
  description   TEXT            NULL,
  venue         VARCHAR(150)    NOT NULL,
  city          VARCHAR(100)    NOT NULL,
  event_date    DATETIME        NOT NULL,
  poster_url    VARCHAR(500)    NULL,
  status        ENUM('draft','published') NOT NULL DEFAULT 'published',
  sales_status  ENUM('open','closed')     NOT NULL DEFAULT 'open',
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_events_date (event_date),
  KEY idx_events_status (status, sales_status)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- event_artists : relasi many-to-many konser <-> artis
-- ------------------------------------------------------------
CREATE TABLE event_artists (
  event_id      BIGINT UNSIGNED NOT NULL,
  artist_id     BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (event_id, artist_id),
  KEY idx_ea_artist (artist_id),
  CONSTRAINT fk_ea_event  FOREIGN KEY (event_id)  REFERENCES events(id)  ON DELETE CASCADE,
  CONSTRAINT fk_ea_artist FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- ticket_categories : kelas tiket (VIP, Festival, Tribune, ...)
-- quota = kuota, sold = tiket terjual
-- ------------------------------------------------------------
CREATE TABLE ticket_categories (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id      BIGINT UNSIGNED NOT NULL,
  name          VARCHAR(80)     NOT NULL,
  price         DECIMAL(12,2)   NOT NULL DEFAULT 0,
  quota         INT UNSIGNED    NOT NULL DEFAULT 0,
  sold          INT UNSIGNED    NOT NULL DEFAULT 0,
  description   VARCHAR(255)    NULL,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_category_event_name (event_id, name),
  CONSTRAINT fk_cat_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT chk_cat_sold CHECK (sold <= quota)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- orders : pesanan (header)
-- ------------------------------------------------------------
CREATE TABLE orders (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_code      VARCHAR(30)     NOT NULL,
  user_id         BIGINT UNSIGNED NOT NULL,
  event_id        BIGINT UNSIGNED NOT NULL,
  total_amount    DECIMAL(12,2)   NOT NULL DEFAULT 0,
  status          ENUM('pending','waiting_verification','paid','rejected','cancelled')
                                  NOT NULL DEFAULT 'pending',
  payment_method  VARCHAR(50)     NULL,
  payment_proof   VARCHAR(500)    NULL,
  note            TEXT            NULL,
  paid_at         DATETIME        NULL,
  verified_by     BIGINT UNSIGNED NULL,
  verified_at     DATETIME        NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_code (order_code),
  KEY idx_orders_user (user_id),
  KEY idx_orders_event (event_id),
  KEY idx_orders_status (status),
  CONSTRAINT fk_orders_user    FOREIGN KEY (user_id)     REFERENCES users(id)  ON DELETE RESTRICT,
  CONSTRAINT fk_orders_event   FOREIGN KEY (event_id)    REFERENCES events(id) ON DELETE RESTRICT,
  CONSTRAINT fk_orders_verifier FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- order_items : rincian tiket per kelas pada satu pesanan
-- ------------------------------------------------------------
CREATE TABLE order_items (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id            BIGINT UNSIGNED NOT NULL,
  ticket_category_id  BIGINT UNSIGNED NOT NULL,
  quantity            INT UNSIGNED    NOT NULL,
  price               DECIMAL(12,2)   NOT NULL,
  subtotal            DECIMAL(12,2)   NOT NULL,
  PRIMARY KEY (id),
  KEY idx_items_order (order_id),
  KEY idx_items_category (ticket_category_id),
  CONSTRAINT fk_items_order    FOREIGN KEY (order_id)           REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_items_category FOREIGN KEY (ticket_category_id) REFERENCES ticket_categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- tickets : 1 baris = 1 lembar tiket (sumber QR Code)
-- ------------------------------------------------------------
CREATE TABLE tickets (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_item_id BIGINT UNSIGNED NOT NULL,
  ticket_code   VARCHAR(40)     NOT NULL,
  status        ENUM('active','used') NOT NULL DEFAULT 'active',
  checked_in_at DATETIME        NULL,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tickets_code (ticket_code),
  KEY idx_tickets_item (order_item_id),
  CONSTRAINT fk_tickets_item FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE
) ENGINE=InnoDB;
