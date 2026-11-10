-- ============================================================
--  Seed data demo
--  Admin    : admin@konser.id   / admin123
--  Customer : budi@mail.com     / customer123
-- ============================================================

USE konser_tiket;

INSERT INTO users (name, email, password, phone, role) VALUES
('Admin Konser', 'admin@konser.id', '$2a$10$6vE2rotxaSryo94k8QuiVO3xv76A1MncpYFTULb2UtdWZlxfdVBfO', '081200000001', 'admin'),
('Budi Santoso', 'budi@mail.com', '$2a$10$A6dIV.CsjKRx3fU2o4mr0.oBamojeBO18rv0mbCsLeQ7cN/CBVRd.', '081200000002', 'customer');

INSERT INTO artists (name, genre, photo_url, bio) VALUES
('Tulus', 'Pop', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80', 'Penyanyi dan penulis lagu asal Malang dengan ciri khas suara baritone.'),
('Raisa', 'Pop / R&B', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&q=80', 'Diva pop Indonesia dengan lagu-lagu ballad yang melegenda.'),
('Hindia', 'Indie', 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800&q=80', 'Proyek solo Baskara Putra yang dikenal lewat lirik reflektif.'),
('Bernadya', 'Pop', 'https://images.unsplash.com/photo-1521337581100-8ca9a73a5f79?w=800&q=80', 'Penyanyi muda dengan lagu-lagu galau yang viral.'),
('Sheila On 7', 'Rock / Pop', 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&q=80', 'Band legendaris Yogyakarta yang berdiri sejak 1996.');

INSERT INTO events (title, description, venue, city, event_date, poster_url, status, sales_status) VALUES
('Tulus: Manusia Tour 2026',
 'Konser tur nasional Tulus untuk merayakan album Manusia. Menampilkan lebih dari 20 lagu dalam aransemen orkestra penuh.',
 'Istora Senayan', 'Jakarta', '2026-12-05 19:30:00',
 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80', 'published', 'open'),
('Raisa Live in Concert: Introspection',
 'Malam penuh ballad romantis bersama Raisa dan 30 musisi orkestra. Pengalaman konser intimate dengan tata cahaya sinematik.',
 'JCC Plenary Hall', 'Jakarta', '2026-12-20 20:00:00',
 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200&q=80', 'published', 'open'),
('Hindia: Rumah ke Rumah',
 'Konser terbuka dengan nuansa hangat, membawakan lagu-lagu dari album Rumah ke Rumah serta materi terbaru.',
 'Lapangan Gasibu', 'Bandung', '2027-01-10 18:00:00',
 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&q=80', 'published', 'open'),
('Sheila On 7 Reunion Night',
 'Malam reuni Sheila On 7 membawakan lagu-lagu nostalgia era 2000-an.',
 'JIExpo Kemayoran', 'Jakarta', '2027-02-14 19:00:00',
 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200&q=80', 'draft', 'open');

INSERT INTO event_artists (event_id, artist_id) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 5),
(3, 4);

INSERT INTO ticket_categories (event_id, name, price, quota, sold, description) VALUES
(1, 'VIP',        1500000.00, 200, 120, 'Baris depan + meet & greet'),
(1, 'Festival',    850000.00, 500, 310, 'Berdiri di area festival'),
(1, 'Tribune',     450000.00, 800, 402, 'Kursi tribun atas'),
(2, 'VIP',        2000000.00, 150,  90, 'Kursi terbaik + merchandise eksklusif'),
(2, 'Gold',       1200000.00, 400, 210, 'Kursi tengah dengan pandangan penuh'),
(2, 'Silver',      700000.00, 600, 355, 'Kursi sayap panggung'),
(3, 'Festival',    350000.00, 1000, 640, 'Area berdiri dekat panggung'),
(3, 'Reguler',     200000.00, 1500, 980, 'Area umum'),
(4, 'VIP',        1000000.00, 100,   0, 'Kursi depan'),
(4, 'Reguler',     400000.00, 900,   0, 'Kursi reguler');

INSERT INTO orders (order_code, user_id, event_id, total_amount, status, payment_method, payment_proof, note, paid_at, verified_by, verified_at, created_at) VALUES
('ORD-20261101-0001', 2, 1, 3000000.00, 'paid', 'Transfer BCA', NULL, 'Mohon tiket dikirim via email.', '2026-11-01 10:22:00', 1, '2026-11-01 11:00:00', '2026-11-01 10:15:00'),
('ORD-20261108-0002', 2, 3, 700000.00, 'waiting_verification', 'QRIS', '/uploads/bukti-transfer-demo.svg', NULL, '2026-11-08 09:40:00', NULL, NULL, '2026-11-08 09:35:00'),
('ORD-20261109-0003', 2, 2, 1200000.00, 'pending', 'Transfer Mandiri', NULL, NULL, NULL, NULL, NULL, '2026-11-09 20:10:00');

INSERT INTO order_items (order_id, ticket_category_id, quantity, price, subtotal) VALUES
(1, 1, 2, 1500000.00, 3000000.00),
(2, 7, 2,  350000.00,  700000.00),
(3, 5, 1, 1200000.00, 1200000.00);

INSERT INTO tickets (order_item_id, ticket_code, status, checked_in_at) VALUES
(1, 'TKT-2601-8F3A2C', 'active', NULL),
(1, 'TKT-2601-9B7D14', 'active', NULL);
