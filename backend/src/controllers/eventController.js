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

/** Estimasi sold out dari kecepatan penjualan 7 hari terakhir. */
const forecastSoldOut = (remaining, sold7d) => {
  const perDay = Number(sold7d) / 7;
  if (perDay <= 0 || remaining <= 0) return { per_day: Number(perDay.toFixed(2)), days_left: null, estimated_sold_out_at: null };

  const daysLeft = Math.ceil(remaining / perDay);
  return {
    per_day: Number(perDay.toFixed(2)),
    days_left: daysLeft,
    estimated_sold_out_at: new Date(Date.now() + daysLeft * 86400000).toISOString().slice(0, 10),
  };
};

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

  const data = rows.map((row) => {
    const quota = Number(row.total_quota);
    const sold = Number(row.total_sold);
    return {
      ...row,
      remaining: Math.max(quota - sold, 0),
      percent_sold: quota > 0 ? Math.round((sold / quota) * 100) : 0,
      is_sold_out: quota > 0 && sold >= quota,
    };
  });

  res.json({ success: true, data });
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

  const totalQuota = categories.reduce((sum, cat) => sum + Number(cat.quota), 0);
  const totalSold = categories.reduce((sum, cat) => sum + Number(cat.sold), 0);

  res.json({
    success: true,
    data: {
      ...event,
      total_quota: totalQuota,
      total_sold: totalSold,
      remaining: Math.max(totalQuota - totalSold, 0),
      percent_sold: totalQuota > 0 ? Math.round((totalSold / totalQuota) * 100) : 0,
      is_sold_out: totalQuota > 0 && totalSold >= totalQuota,
      categories: categories.map((cat) => ({
        ...cat,
        percent_sold: Number(cat.quota) > 0 ? Math.round((Number(cat.sold) / Number(cat.quota)) * 100) : 0,
      })),
      artists: await attachArtists(event.id),
    },
  });
});

/**
 * Statistik live sebuah konser untuk aplikasi mobile:
 * sisa kuota, kecepatan penjualan, dan estimasi sold out.
 */
export const getEventStats = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    "SELECT id, title, sales_status FROM events WHERE id = ? AND status = 'published'",
    [req.params.id]
  );
  if (!rows.length) throw new HttpError(404, "Konser tidak ditemukan.");

  const [categories] = await pool.query(
    `SELECT tc.id, tc.name, tc.price, tc.quota, tc.sold,
            (SELECT COALESCE(SUM(oi.quantity), 0)
             FROM order_items oi
             JOIN orders o ON o.id = oi.order_id
             WHERE oi.ticket_category_id = tc.id
               AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
               AND o.status IN ('pending', 'waiting_verification', 'paid')) AS sold_7d
     FROM ticket_categories tc
     WHERE tc.event_id = ?
     ORDER BY tc.price DESC`,
    [req.params.id]
  );

  const [[recent]] = await pool.query(
    `SELECT COALESCE(SUM(oi.quantity), 0) AS sold_24h
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE o.event_id = ?
       AND o.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       AND o.status IN ('pending', 'waiting_verification', 'paid')`,
    [req.params.id]
  );

  const items = categories.map((cat) => {
    const quota = Number(cat.quota);
    const sold = Number(cat.sold);
    const remaining = Math.max(quota - sold, 0);
    return {
      ...cat,
      quota,
      sold,
      remaining,
      percent_sold: quota > 0 ? Math.round((sold / quota) * 100) : 0,
      is_sold_out: quota > 0 && sold >= quota,
      ...forecastSoldOut(remaining, cat.sold_7d),
    };
  });

  const totalQuota = items.reduce((sum, cat) => sum + cat.quota, 0);
  const totalSold = items.reduce((sum, cat) => sum + cat.sold, 0);

  // Konser baru benar-benar sold out saat semua kelas habis,
  // jadi estimasi event = kelas yang paling lama habis.
  const estimates = items.map((cat) => cat.estimated_sold_out_at).filter(Boolean).sort();
  const allKnown = items.every((cat) => cat.is_sold_out || cat.estimated_sold_out_at);

  res.json({
    success: true,
    data: {
      event_id: rows[0].id,
      event_title: rows[0].title,
      sales_status: rows[0].sales_status,
      total_quota: totalQuota,
      total_sold: totalSold,
      remaining: Math.max(totalQuota - totalSold, 0),
      percent_sold: totalQuota > 0 ? Math.round((totalSold / totalQuota) * 100) : 0,
      is_sold_out: totalQuota > 0 && totalSold >= totalQuota,
      sold_24h: Number(recent.sold_24h),
      estimated_sold_out_at: allKnown && estimates.length ? estimates[estimates.length - 1] : null,
      categories: items,
    },
  });
});
