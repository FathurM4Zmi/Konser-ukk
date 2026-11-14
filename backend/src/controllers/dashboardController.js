import pool from "../config/db.js";
import { asyncHandler } from "../utils/http.js";

const pad = (value) => String(value).padStart(2, "0");
const dateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Data ringkasan dashboard (dipakai REST & SSE). */
const buildDashboard = async () => {
  const [[revenue]] = await pool.query(
    "SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE status = 'paid'"
  );

  const [[tickets]] = await pool.query(
    "SELECT COALESCE(SUM(sold), 0) AS sold, COALESCE(SUM(quota), 0) AS quota FROM ticket_categories"
  );

  const [[orders]] = await pool.query(
    `SELECT COUNT(*) AS total,
            SUM(status = 'waiting_verification') AS waiting,
            SUM(status = 'pending') AS pending,
            SUM(status = 'paid') AS paid
     FROM orders`
  );

  const [[counts]] = await pool.query(
    `SELECT (SELECT COUNT(*) FROM events) AS events,
            (SELECT COUNT(*) FROM artists) AS artists,
            (SELECT COUNT(*) FROM users WHERE role = 'customer') AS customers`
  );

  const [salesPerEvent] = await pool.query(
    `SELECT e.id, e.title, e.event_date, e.city,
            COALESCE(SUM(tc.quota), 0) AS quota,
            COALESCE(SUM(tc.sold), 0)  AS sold,
            COALESCE((SELECT SUM(o.total_amount) FROM orders o
                      WHERE o.event_id = e.id AND o.status = 'paid'), 0) AS revenue
     FROM events e
     LEFT JOIN ticket_categories tc ON tc.event_id = e.id
     GROUP BY e.id
     ORDER BY sold DESC
     LIMIT 6`
  );

  const [recentOrders] = await pool.query(
    `SELECT o.id, o.order_code, o.total_amount, o.status, o.created_at,
            u.name AS customer_name, e.title AS event_title
     FROM orders o
     JOIN users u ON u.id = o.user_id
     JOIN events e ON e.id = o.event_id
     ORDER BY o.created_at DESC
     LIMIT 5`
  );

  const [categoryStock] = await pool.query(
    `SELECT tc.id, tc.name, tc.quota, tc.sold, (tc.quota - tc.sold) AS remaining,
            e.title AS event_title
     FROM ticket_categories tc
     JOIN events e ON e.id = tc.event_id
     ORDER BY tc.quota - tc.sold ASC
     LIMIT 5`
  );

  const [revenueByMonth] = await pool.query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') AS period,
            COALESCE(SUM(total_amount), 0) AS revenue,
            COUNT(*) AS total_order
     FROM orders
     WHERE status = 'paid' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
     GROUP BY period
     ORDER BY period ASC`
  );

  return {
    stats: {
      revenue: Number(revenue.total),
      tickets_sold: Number(tickets.sold),
      tickets_quota: Number(tickets.quota),
      orders_total: Number(orders.total || 0),
      pending_verification: Number(orders.waiting || 0),
      pending_payment: Number(orders.pending || 0),
      paid_orders: Number(orders.paid || 0),
      events_total: Number(counts.events),
      artists_total: Number(counts.artists),
      customers_total: Number(counts.customers),
    },
    sales_per_event: salesPerEvent,
    recent_orders: recentOrders,
    category_stock: categoryStock,
    revenue_by_month: revenueByMonth,
  };
};

export const getDashboard = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await buildDashboard() });
});

/** Analitik lanjutan: jam ramai, tren harian, prediksi sold out, KPI. */
export const getAnalytics = asyncHandler(async (_req, res) => {
  const [hourlyRows] = await pool.query(
    `SELECT HOUR(created_at) AS hour,
            COUNT(*) AS total_order,
            COALESCE(SUM(total_amount), 0) AS revenue
     FROM orders
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
     GROUP BY hour
     ORDER BY hour ASC`
  );

  // Lengkapi 0-23 agar grafik tetap penuh walau ada jam tanpa transaksi.
  const hourlyMap = new Map(hourlyRows.map((row) => [Number(row.hour), row]));
  const hourly = Array.from({ length: 24 }, (_, hour) => {
    const row = hourlyMap.get(hour);
    return {
      hour,
      label: `${pad(hour)}:00`,
      total_order: Number(row?.total_order || 0),
      revenue: Number(row?.revenue || 0),
    };
  });

  const [dailyRows] = await pool.query(
    `SELECT DATE(created_at) AS day,
            COUNT(*) AS total_order,
            COALESCE(SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END), 0) AS revenue
     FROM orders
     WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
     GROUP BY day
     ORDER BY day ASC`
  );

  // Lengkapi 14 hari terakhir, termasuk hari tanpa transaksi.
  const dailyMap = new Map(dailyRows.map((row) => [String(row.day), row]));
  const today = new Date();
  const daily = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (13 - index));
    const key = dateKey(date);
    const row = dailyMap.get(key);
    return {
      day: key,
      label: date.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      total_order: Number(row?.total_order || 0),
      revenue: Number(row?.revenue || 0),
    };
  });

  const [statusRows] = await pool.query(
    "SELECT status, COUNT(*) AS total FROM orders GROUP BY status"
  );
  const statusMap = new Map(statusRows.map((row) => [row.status, Number(row.total)]));
  const statusDistribution = [
    "pending",
    "waiting_verification",
    "paid",
    "rejected",
    "cancelled",
  ].map((status) => ({ status, total: statusMap.get(status) || 0 }));

  const [stockRows] = await pool.query(
    `SELECT tc.id, tc.name, tc.quota, tc.sold,
            e.id AS event_id, e.title AS event_title,
            (SELECT COALESCE(SUM(oi.quantity), 0)
             FROM order_items oi
             JOIN orders o ON o.id = oi.order_id
             WHERE oi.ticket_category_id = tc.id
               AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
               AND o.status IN ('pending', 'waiting_verification', 'paid')) AS sold_7d
     FROM ticket_categories tc
     JOIN events e ON e.id = tc.event_id
     WHERE tc.quota > tc.sold
     ORDER BY (tc.quota - tc.sold) ASC`
  );

  const now = Date.now();
  const soldOutForecast = stockRows
    .map((row) => {
      const quota = Number(row.quota);
      const sold = Number(row.sold);
      const remaining = quota - sold;
      const sold7d = Number(row.sold_7d);
      const perDay = sold7d / 7;
      const daysLeft = perDay > 0 ? Math.ceil(remaining / perDay) : null;
      return {
        category_id: row.id,
        category_name: row.name,
        event_id: row.event_id,
        event_title: row.event_title,
        quota,
        sold,
        remaining,
        percent_sold: quota > 0 ? Math.round((sold / quota) * 100) : 0,
        sold_7d: sold7d,
        per_day: Number(perDay.toFixed(2)),
        days_left: daysLeft,
        estimated_sold_out_at:
          daysLeft === null ? null : new Date(now + daysLeft * 86400000).toISOString().slice(0, 10),
      };
    })
    .filter((row) => row.days_left !== null)
    .sort((a, b) => a.days_left - b.days_left)
    .slice(0, 6);

  const [topEvents] = await pool.query(
    `SELECT e.id, e.title, e.city, e.event_date,
            COUNT(o.id) AS total_order,
            COALESCE(SUM(CASE WHEN o.status = 'paid' THEN o.total_amount ELSE 0 END), 0) AS revenue
     FROM events e
     LEFT JOIN orders o ON o.event_id = e.id
     GROUP BY e.id, e.title, e.city, e.event_date
     ORDER BY revenue DESC
     LIMIT 5`
  );

  const [[kpi]] = await pool.query(
    `SELECT
       (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'paid') AS revenue,
       (SELECT COUNT(*) FROM orders WHERE status = 'paid') AS paid_orders,
       (SELECT COUNT(*) FROM orders) AS total_orders,
       (SELECT COALESCE(SUM(oi.quantity), 0)
        FROM order_items oi JOIN orders o ON o.id = oi.order_id
        WHERE DATE(o.created_at) = CURDATE()
          AND o.status IN ('pending', 'waiting_verification', 'paid')) AS tickets_today,
       (SELECT COALESCE(SUM(o.total_amount), 0) FROM orders o
        WHERE o.status = 'paid' AND DATE(o.created_at) = CURDATE()) AS revenue_today,
       (SELECT COUNT(*) FROM events WHERE status = 'published') AS active_events`
  );

  const peak = hourly.reduce(
    (best, row) => (row.total_order > best.total_order ? row : best),
    hourly[0]
  );

  const revenue = Number(kpi.revenue);
  const paidOrders = Number(kpi.paid_orders);
  const totalOrders = Number(kpi.total_orders);

  res.json({
    success: true,
    data: {
      hourly,
      daily,
      status_distribution: statusDistribution,
      sold_out_forecast: soldOutForecast,
      top_events: topEvents,
      kpi: {
        avg_order_value: paidOrders > 0 ? Math.round(revenue / paidOrders) : 0,
        conversion_rate: totalOrders > 0 ? Number(((paidOrders / totalOrders) * 100).toFixed(1)) : 0,
        tickets_today: Number(kpi.tickets_today),
        revenue_today: Number(kpi.revenue_today),
        active_events: Number(kpi.active_events),
        peak_hour: peak ? peak.hour : 0,
        peak_hour_label: peak ? peak.label : "00:00",
        peak_hour_orders: peak ? peak.total_order : 0,
      },
    },
  });
});

/** Server-Sent Events: kirim snapshot dashboard tiap 5 detik. */
export const streamDashboard = asyncHandler(async (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders?.();

  let closed = false;
  let timer = null;

  const send = async () => {
    if (closed) return;
    try {
      const data = await buildDashboard();
      res.write(
        `event: snapshot\ndata: ${JSON.stringify({ ...data, server_time: new Date().toISOString() })}\n\n`
      );
    } catch {
      res.write(`event: error\ndata: ${JSON.stringify({ message: "Gagal memuat data dashboard." })}\n\n`);
    }
  };

  // Komentar awal agar koneksi langsung dianggap terbuka oleh browser/proxy.
  res.write(": connected\n\n");
  await send();
  timer = setInterval(send, 5000);

  req.on("close", () => {
    closed = true;
    if (timer) clearInterval(timer);
    res.end();
  });
});
