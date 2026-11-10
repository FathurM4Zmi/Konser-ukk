import pool from "../config/db.js";
import { asyncHandler, HttpError } from "../utils/http.js";

export const listArtists = asyncHandler(async (req, res) => {
  const search = (req.query.search || "").trim();
  const params = [];
  let where = "";

  if (search) {
    where = "WHERE a.name LIKE ? OR a.genre LIKE ?";
    params.push(`%${search}%`, `%${search}%`);
  }

  const [rows] = await pool.query(
    `SELECT a.*, COUNT(ea.event_id) AS total_event
     FROM artists a
     LEFT JOIN event_artists ea ON ea.artist_id = a.id
     ${where}
     GROUP BY a.id
     ORDER BY a.name ASC`,
    params
  );

  res.json({ success: true, data: rows });
});

export const getArtist = asyncHandler(async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM artists WHERE id = ?", [req.params.id]);
  if (!rows.length) throw new HttpError(404, "Artis tidak ditemukan.");
  res.json({ success: true, data: rows[0] });
});

export const createArtist = asyncHandler(async (req, res) => {
  const { name, genre, photo_url, bio } = req.body;

  const [result] = await pool.query(
    "INSERT INTO artists (name, genre, photo_url, bio) VALUES (?, ?, ?, ?)",
    [name.trim(), genre || null, photo_url || null, bio || null]
  );

  const [rows] = await pool.query("SELECT * FROM artists WHERE id = ?", [result.insertId]);
  res.status(201).json({ success: true, message: "Artis berhasil ditambahkan.", data: rows[0] });
});

export const updateArtist = asyncHandler(async (req, res) => {
  const { name, genre, photo_url, bio } = req.body;

  const [check] = await pool.query("SELECT id FROM artists WHERE id = ?", [req.params.id]);
  if (!check.length) throw new HttpError(404, "Artis tidak ditemukan.");

  await pool.query(
    "UPDATE artists SET name = ?, genre = ?, photo_url = ?, bio = ? WHERE id = ?",
    [name.trim(), genre || null, photo_url || null, bio || null, req.params.id]
  );

  const [rows] = await pool.query("SELECT * FROM artists WHERE id = ?", [req.params.id]);
  res.json({ success: true, message: "Data artis diperbarui.", data: rows[0] });
});

export const deleteArtist = asyncHandler(async (req, res) => {
  const [check] = await pool.query("SELECT id FROM artists WHERE id = ?", [req.params.id]);
  if (!check.length) throw new HttpError(404, "Artis tidak ditemukan.");

  await pool.query("DELETE FROM artists WHERE id = ?", [req.params.id]);
  res.json({ success: true, message: "Artis berhasil dihapus." });
});
