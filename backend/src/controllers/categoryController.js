import pool from "../config/db.js";
import { asyncHandler, HttpError } from "../utils/http.js";

const ensureEvent = async (eventId) => {
  const [rows] = await pool.query("SELECT id FROM events WHERE id = ?", [eventId]);
  if (!rows.length) throw new HttpError(404, "Konser tidak ditemukan.");
};

export const listCategories = asyncHandler(async (req, res) => {
  await ensureEvent(req.params.eventId);
  const [rows] = await pool.query(
    `SELECT *, (quota - sold) AS remaining
     FROM ticket_categories WHERE event_id = ? ORDER BY price DESC`,
    [req.params.eventId]
  );
  res.json({ success: true, data: rows });
});

export const createCategory = asyncHandler(async (req, res) => {
  const eventId = req.params.eventId;
  const { name, price, quota, description } = req.body;
  await ensureEvent(eventId);

  const [dup] = await pool.query(
    "SELECT id FROM ticket_categories WHERE event_id = ? AND name = ? LIMIT 1",
    [eventId, name.trim()]
  );
  if (dup.length) throw new HttpError(409, "Kelas tiket dengan nama tersebut sudah ada pada konser ini.");

  const [result] = await pool.query(
    `INSERT INTO ticket_categories (event_id, name, price, quota, description)
     VALUES (?, ?, ?, ?, ?)`,
    [eventId, name.trim(), price, quota, description || null]
  );

  const [rows] = await pool.query("SELECT * FROM ticket_categories WHERE id = ?", [result.insertId]);
  res.status(201).json({ success: true, message: "Kelas tiket ditambahkan.", data: rows[0] });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { name, price, quota, description } = req.body;

  const [rows] = await pool.query("SELECT * FROM ticket_categories WHERE id = ?", [req.params.id]);
  if (!rows.length) throw new HttpError(404, "Kelas tiket tidak ditemukan.");
  const category = rows[0];

  if (Number(quota) < category.sold) {
    throw new HttpError(422, `Kuota tidak boleh lebih kecil dari tiket terjual (${category.sold}).`, {
      quota: `Minimal ${category.sold} tiket.`,
    });
  }

  const [dup] = await pool.query(
    "SELECT id FROM ticket_categories WHERE event_id = ? AND name = ? AND id <> ? LIMIT 1",
    [category.event_id, name.trim(), req.params.id]
  );
  if (dup.length) throw new HttpError(409, "Nama kelas tiket sudah dipakai pada konser ini.");

  await pool.query(
    "UPDATE ticket_categories SET name = ?, price = ?, quota = ?, description = ? WHERE id = ?",
    [name.trim(), price, quota, description || null, req.params.id]
  );

  const [updated] = await pool.query("SELECT * FROM ticket_categories WHERE id = ?", [req.params.id]);
  res.json({ success: true, message: "Kelas tiket diperbarui.", data: updated[0] });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM ticket_categories WHERE id = ?", [req.params.id]);
  if (!rows.length) throw new HttpError(404, "Kelas tiket tidak ditemukan.");
  const category = rows[0];

  const [items] = await pool.query(
    "SELECT COUNT(*) AS total FROM order_items WHERE ticket_category_id = ?",
    [category.id]
  );
  if (items[0].total > 0) {
    throw new HttpError(409, "Kelas tiket sudah dipakai pada pesanan dan tidak dapat dihapus.");
  }

  await pool.query("DELETE FROM ticket_categories WHERE id = ?", [category.id]);
  res.json({ success: true, message: "Kelas tiket dihapus." });
});
