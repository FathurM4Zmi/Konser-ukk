import pool from "../config/db.js";
import { asyncHandler, HttpError } from "../utils/http.js";
import { toMysqlDateTime } from "../utils/date.js";

const attachArtists = async (eventId, conn = pool) => {
  const [rows] = await conn.query(
    `SELECT a.id, a.name, a.genre, a.photo_url
     FROM event_artists ea
     JOIN artists a ON a.id = ea.artist_id
     WHERE ea.event_id = ?
     ORDER BY a.name ASC`,
    [eventId]
  );
  return rows;
};

/* ----------------------------- ADMIN ----------------------------- */

export const listEventsAdmin = asyncHandler(async (req, res) => {
  const search = (req.query.search || "").trim();
  const params = [];
  let where = "";

  if (search) {
    where = "WHERE e.title LIKE ? OR e.city LIKE ? OR e.venue LIKE ?";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const [rows] = await pool.query(
    `SELECT e.*,
            COUNT(tc.id)                     AS total_category,
            COALESCE(SUM(tc.quota), 0)       AS total_quota,
            COALESCE(SUM(tc.sold), 0)        AS total_sold,
            (SELECT COUNT(*) FROM orders o WHERE o.event_id = e.id) AS total_order
     FROM events e
     LEFT JOIN ticket_categories tc ON tc.event_id = e.id
     ${where}
     GROUP BY e.id
     ORDER BY e.event_date DESC`,
    params
  );

  res.json({ success: true, data: rows });
});

export const getEventAdmin = asyncHandler(async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM events WHERE id = ?", [req.params.id]);
  if (!rows.length) throw new HttpError(404, "Konser tidak ditemukan.");

  const event = rows[0];
  const [categories] = await pool.query(
    "SELECT * FROM ticket_categories WHERE event_id = ? ORDER BY price DESC",
    [event.id]
  );

  res.json({
    success: true,
    data: { ...event, categories, artists: await attachArtists(event.id) },
  });
});

export const createEvent = asyncHandler(async (req, res) => {
  const { title, description, venue, city, event_date, poster_url, status, artist_ids } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO events (title, description, venue, city, event_date, poster_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title.trim(), description || null, venue.trim(), city.trim(), toMysqlDateTime(event_date), poster_url || null, status || "published"]
    );

    if (Array.isArray(artist_ids) && artist_ids.length) {
      const values = artist_ids.map((artistId) => [result.insertId, artistId]);
      await conn.query("INSERT INTO event_artists (event_id, artist_id) VALUES ?", [values]);
    }

    await conn.commit();
    const [rows] = await pool.query("SELECT * FROM events WHERE id = ?", [result.insertId]);
    res.status(201).json({ success: true, message: "Konser berhasil dibuat.", data: rows[0] });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

export const updateEvent = asyncHandler(async (req, res) => {
  const { title, description, venue, city, event_date, poster_url, status, artist_ids } = req.body;

  const [check] = await pool.query("SELECT id FROM events WHERE id = ?", [req.params.id]);
  if (!check.length) throw new HttpError(404, "Konser tidak ditemukan.");

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE events
       SET title = ?, description = ?, venue = ?, city = ?, event_date = ?, poster_url = ?, status = ?
       WHERE id = ?`,
      [title.trim(), description || null, venue.trim(), city.trim(), toMysqlDateTime(event_date), poster_url || null, status || "published", req.params.id]
    );

    if (Array.isArray(artist_ids)) {
      await conn.query("DELETE FROM event_artists WHERE event_id = ?", [req.params.id]);
      if (artist_ids.length) {
        const values = artist_ids.map((artistId) => [req.params.id, artistId]);
        await conn.query("INSERT INTO event_artists (event_id, artist_id) VALUES ?", [values]);
      }
    }

    await conn.commit();
    const [rows] = await pool.query("SELECT * FROM events WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Konser berhasil diperbarui.", data: rows[0] });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const [check] = await pool.query("SELECT id FROM events WHERE id = ?", [req.params.id]);
  if (!check.length) throw new HttpError(404, "Konser tidak ditemukan.");

  const [orders] = await pool.query("SELECT COUNT(*) AS total FROM orders WHERE event_id = ?", [req.params.id]);
  if (orders[0].total > 0) {
    throw new HttpError(409, "Konser tidak bisa dihapus karena sudah memiliki pesanan. Tutup penjualannya saja.");
  }

  await pool.query("DELETE FROM events WHERE id = ?", [req.params.id]);
  res.json({ success: true, message: "Konser berhasil dihapus." });
});

export const setSalesStatus = asyncHandler(async (req, res) => {
  const { sales_status } = req.body;

  const [check] = await pool.query("SELECT id FROM events WHERE id = ?", [req.params.id]);
  if (!check.length) throw new HttpError(404, "Konser tidak ditemukan.");

  await pool.query("UPDATE events SET sales_status = ? WHERE id = ?", [sales_status, req.params.id]);

  res.json({
    success: true,
    message: sales_status === "closed" ? "Penjualan tiket ditutup." : "Penjualan tiket dibuka kembali.",
  });
});

/* ----------------------------- PUBLIC / MOBILE ----------------------------- */

export const listEventsPublic = asyncHandler(async (req, res) => {
  const search = (req.query.search || "").trim();
  const city = (req.query.city || "").trim();

  const params = [];
  const conditions = ["e.status = 'published'"];

  if (search) {
    conditions.push("(e.title LIKE ? OR e.venue LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (city) {
    conditions.push("e.city = ?");
    params.push(city);
  }

  const [rows] = await pool.query(
    `SELECT e.id, e.title, e.venue, e.city, e.event_date, e.poster_url, e.sales_status,
            MIN(tc.price) AS min_price,
            COALESCE(SUM(tc.quota), 0) AS total_quota,
            COALESCE(SUM(tc.sold), 0)  AS total_sold
     FROM events e
     LEFT JOIN ticket_categories tc ON tc.event_id = e.id
     WHERE ${conditions.join(" AND ")}
     GROUP BY e.id
     ORDER BY e.event_date ASC`,
    params
  );

  res.json({ success: true, data: rows });
});

export const getEventPublic = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, title, description, venue, city, event_date, poster_url, status, sales_status
     FROM events WHERE id = ? AND status = 'published'`,
    [req.params.id]
  );
  if (!rows.length) throw new HttpError(404, "Konser tidak ditemukan.");

  const event = rows[0];
  const [categories] = await pool.query(
    `SELECT id, name, price, quota, sold, (quota - sold) AS remaining, description
     FROM ticket_categories WHERE event_id = ? ORDER BY price DESC`,
    [event.id]
  );

  res.json({
    success: true,
    data: { ...event, categories, artists: await attachArtists(event.id) },
  });
});
