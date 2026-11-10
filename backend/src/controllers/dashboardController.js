import pool from "../config/db.js";
import { asyncHandler } from "../utils/http.js";

export const getDashboard = asyncHandler(async (_req, res) => {
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

  res.json({
    success: true,
    data: {
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
    },
  });
});
