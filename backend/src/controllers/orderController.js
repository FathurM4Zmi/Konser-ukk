import pool from "../config/db.js";
import QRCode from "qrcode";
import { asyncHandler, HttpError } from "../utils/http.js";
import { generateOrderCode, generateTicketCode } from "../utils/code.js";

const getOrderBase = async (orderId, conn = pool) => {
  const [rows] = await conn.query(
    `SELECT o.*, e.title AS event_title, e.venue, e.city, e.event_date, e.poster_url,
            u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
     FROM orders o
     JOIN events e ON e.id = o.event_id
     JOIN users u  ON u.id = o.user_id
     WHERE o.id = ?`,
    [orderId]
  );
  return rows[0] || null;
};

const getOrderItems = async (orderId, conn = pool) => {
  const [rows] = await conn.query(
    `SELECT oi.*, tc.name AS category_name
     FROM order_items oi
     JOIN ticket_categories tc ON tc.id = oi.ticket_category_id
     WHERE oi.order_id = ?
     ORDER BY oi.id ASC`,
    [orderId]
  );
  return rows;
};

/* ----------------------------- MOBILE / CUSTOMER ----------------------------- */

export const createOrder = asyncHandler(async (req, res) => {
  const { event_id, items, payment_method, note } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [events] = await conn.query(
      "SELECT * FROM events WHERE id = ? FOR UPDATE",
      [event_id]
    );
    if (!events.length) throw new HttpError(404, "Konser tidak ditemukan.");
    const event = events[0];

    if (event.status !== "published") throw new HttpError(422, "Konser belum dipublikasikan.");
    if (event.sales_status === "closed") throw new HttpError(422, "Penjualan tiket untuk konser ini sudah ditutup.");
    if (new Date(event.event_date) <= new Date()) throw new HttpError(422, "Konser sudah berlalu, tiket tidak dapat dipesan.");

    // gabungkan item dengan kategori yang sama
    const merged = new Map();
    for (const item of items) {
      const id = Number(item.ticket_category_id);
      merged.set(id, (merged.get(id) || 0) + Number(item.quantity));
    }

    const orderItems = [];
    let total = 0;

    for (const [categoryId, quantity] of merged) {
      const [cats] = await conn.query(
        "SELECT * FROM ticket_categories WHERE id = ? AND event_id = ? FOR UPDATE",
        [categoryId, event_id]
      );
      if (!cats.length) throw new HttpError(422, "Kelas tiket tidak sesuai dengan konser yang dipilih.");
      const category = cats[0];

      const remaining = category.quota - category.sold;
      if (quantity > remaining) {
        throw new HttpError(
          422,
          `Kuota kelas ${category.name} tidak mencukupi. Tersisa ${remaining} tiket.`
        );
      }

      const subtotal = Number(category.price) * quantity;
      total += subtotal;
      orderItems.push({ category, quantity, subtotal });
    }

    if (!orderItems.length) throw new HttpError(422, "Pilih minimal satu tiket.");

    const orderCode = generateOrderCode();
    const [orderResult] = await conn.query(
      `INSERT INTO orders (order_code, user_id, event_id, total_amount, status, payment_method, note)
       VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
      [orderCode, req.user.id, event_id, total, payment_method || null, note || null]
    );

    for (const item of orderItems) {
      await conn.query(
        `INSERT INTO order_items (order_id, ticket_category_id, quantity, price, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [orderResult.insertId, item.category.id, item.quantity, item.category.price, item.subtotal]
      );
      await conn.query(
        "UPDATE ticket_categories SET sold = sold + ? WHERE id = ?",
        [item.quantity, item.category.id]
      );
    }

    await conn.commit();

    const order = await getOrderBase(orderResult.insertId);
    res.status(201).json({
      success: true,
      message: "Pesanan dibuat. Silakan lakukan pembayaran dan unggah bukti transfer.",
      data: { ...order, items: await getOrderItems(orderResult.insertId) },
    });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

export const myOrders = asyncHandler(async (req, res) => {
  const status = req.query.status;
  const params = [req.user.id];
  let where = "WHERE o.user_id = ?";
  if (status) {
    where += " AND o.status = ?";
    params.push(status);
  }

  const [orders] = await pool.query(
    `SELECT o.*, e.title AS event_title, e.venue, e.city, e.event_date, e.poster_url
     FROM orders o JOIN events e ON e.id = o.event_id
     ${where}
     ORDER BY o.created_at DESC`,
    params
  );

  for (const order of orders) {
    order.items = await getOrderItems(order.id);
    order.ticket_count = order.items.reduce((sum, i) => sum + i.quantity, 0);
  }

  res.json({ success: true, data: orders });
});

export const getOrderDetail = asyncHandler(async (req, res) => {
  const order = await getOrderBase(req.params.id);
  if (!order) throw new HttpError(404, "Pesanan tidak ditemukan.");

  if (req.user.role !== "admin" && order.user_id !== req.user.id) {
    throw new HttpError(403, "Anda tidak berhak melihat pesanan ini.");
  }

  res.json({
    success: true,
    data: { ...order, items: await getOrderItems(order.id) },
  });
});

export const uploadPayment = asyncHandler(async (req, res) => {
  const order = await getOrderBase(req.params.id);
  if (!order) throw new HttpError(404, "Pesanan tidak ditemukan.");
  if (order.user_id !== req.user.id) throw new HttpError(403, "Anda tidak berhak mengubah pesanan ini.");
  if (!["pending", "rejected"].includes(order.status)) {
    throw new HttpError(422, "Bukti pembayaran hanya bisa diunggah untuk pesanan yang belum diverifikasi.");
  }
  if (!req.file) throw new HttpError(422, "File bukti pembayaran wajib diunggah.", { payment_proof: "Pilih file gambar." });

  const proofPath = `/uploads/${req.file.filename}`;
  await pool.query(
    `UPDATE orders
     SET payment_proof = ?, payment_method = COALESCE(?, payment_method), status = 'waiting_verification', paid_at = NOW()
     WHERE id = ?`,
    [proofPath, req.body.payment_method || null, order.id]
  );

  const updated = await getOrderBase(order.id);
  res.json({ success: true, message: "Bukti pembayaran terkirim. Menunggu verifikasi admin.", data: updated });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query("SELECT * FROM orders WHERE id = ? FOR UPDATE", [req.params.id]);
    if (!rows.length) throw new HttpError(404, "Pesanan tidak ditemukan.");
    const order = rows[0];

    if (order.user_id !== req.user.id && req.user.role !== "admin") {
      throw new HttpError(403, "Anda tidak berhak membatalkan pesanan ini.");
    }
    if (!["pending", "waiting_verification"].includes(order.status)) {
      throw new HttpError(422, "Pesanan pada status ini tidak dapat dibatalkan.");
    }

    const items = await getOrderItems(order.id, conn);
    for (const item of items) {
      await conn.query("UPDATE ticket_categories SET sold = GREATEST(sold - ?, 0) WHERE id = ?", [
        item.quantity,
        item.ticket_category_id,
      ]);
    }

    await conn.query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [order.id]);
    await conn.commit();

    res.json({ success: true, message: "Pesanan dibatalkan dan kuota tiket dikembalikan." });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

export const orderTickets = asyncHandler(async (req, res) => {
  const order = await getOrderBase(req.params.id);
  if (!order) throw new HttpError(404, "Pesanan tidak ditemukan.");
  if (req.user.role !== "admin" && order.user_id !== req.user.id) {
    throw new HttpError(403, "Anda tidak berhak melihat tiket pesanan ini.");
  }
  if (order.status !== "paid") {
    throw new HttpError(422, "Tiket hanya tersedia setelah pembayaran diverifikasi admin.");
  }

  const [rows] = await pool.query(
    `SELECT t.id, t.ticket_code, t.status, t.checked_in_at, tc.name AS category_name
     FROM tickets t
     JOIN order_items oi ON oi.id = t.order_item_id
     JOIN ticket_categories tc ON tc.id = oi.ticket_category_id
     WHERE oi.order_id = ?
     ORDER BY t.id ASC`,
    [order.id]
  );

  const tickets = await Promise.all(
    rows.map(async (ticket) => ({
      ...ticket,
      qr_payload: JSON.stringify({
        code: ticket.ticket_code,
        order: order.order_code,
        event: order.event_title,
        category: ticket.category_name,
      }),
      qr_image: await QRCode.toDataURL(
        JSON.stringify({ code: ticket.ticket_code, order: order.order_code }),
        { width: 512, margin: 1 }
      ),
    }))
  );

  res.json({ success: true, data: tickets });
});

/* ----------------------------- ADMIN ----------------------------- */

export const listOrdersAdmin = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
  const offset = (page - 1) * limit;

  const conditions = [];
  const params = [];

  if (status) {
    conditions.push("o.status = ?");
    params.push(status);
  }
  if (search) {
    conditions.push("(o.order_code LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR e.title LIKE ?)");
    const q = `%${search}%`;
    params.push(q, q, q, q);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM orders o
     JOIN users u ON u.id = o.user_id
     JOIN events e ON e.id = o.event_id
     ${where}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT o.*, u.name AS customer_name, u.email AS customer_email,
            e.title AS event_title, e.event_date,
            (SELECT COALESCE(SUM(quantity),0) FROM order_items oi WHERE oi.order_id = o.id) AS ticket_count
     FROM orders o
     JOIN users u ON u.id = o.user_id
     JOIN events e ON e.id = o.event_id
     ${where}
     ORDER BY o.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  res.json({
    success: true,
    data: rows,
    meta: { page, limit, total, total_page: Math.ceil(total / limit) || 1 },
  });
});

export const verifyOrder = asyncHandler(async (req, res) => {
  const { action, note } = req.body;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [rows] = await conn.query("SELECT * FROM orders WHERE id = ? FOR UPDATE", [req.params.id]);
    if (!rows.length) throw new HttpError(404, "Pesanan tidak ditemukan.");
    const order = rows[0];

    if (!["pending", "waiting_verification"].includes(order.status)) {
      throw new HttpError(422, "Pesanan ini sudah diproses sebelumnya.");
    }

    const items = await getOrderItems(order.id, conn);

    if (action === "approve") {
      await conn.query(
        `UPDATE orders
         SET status = 'paid', verified_by = ?, verified_at = NOW(), paid_at = COALESCE(paid_at, NOW()), note = COALESCE(?, note)
         WHERE id = ?`,
        [req.user.id, note || null, order.id]
      );

      for (const item of items) {
        for (let i = 0; i < item.quantity; i += 1) {
          await conn.query(
            "INSERT INTO tickets (order_item_id, ticket_code) VALUES (?, ?)",
            [item.id, generateTicketCode()]
          );
        }
      }
    } else {
      await conn.query(
        "UPDATE orders SET status = 'rejected', verified_by = ?, verified_at = NOW(), note = COALESCE(?, note) WHERE id = ?",
        [req.user.id, note || null, order.id]
      );

      for (const item of items) {
        await conn.query("UPDATE ticket_categories SET sold = GREATEST(sold - ?, 0) WHERE id = ?", [
          item.quantity,
          item.ticket_category_id,
        ]);
      }
    }

    await conn.commit();

    const updated = await getOrderBase(order.id);
    res.json({
      success: true,
      message: action === "approve" ? "Pembayaran diverifikasi, tiket aktif dibuat." : "Pembayaran ditolak, kuota tiket dikembalikan.",
      data: updated,
    });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});
