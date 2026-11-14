export type Role = "admin" | "customer";

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
}

export interface Artist {
  id: number;
  name: string;
  genre: string | null;
  photo_url: string | null;
  bio: string | null;
  total_event?: number;
}

export interface TicketCategory {
  id: number;
  event_id: number;
  name: string;
  price: number;
  quota: number;
  sold: number;
  remaining?: number;
  description: string | null;
}

export interface EventItem {
  id: number;
  title: string;
  description: string | null;
  venue: string;
  city: string;
  event_date: string;
  poster_url: string | null;
  status: "draft" | "published";
  sales_status: "open" | "closed";
  total_category?: number;
  total_quota?: number;
  total_sold?: number;
  total_order?: number;
}

export interface EventDetail extends EventItem {
  categories: TicketCategory[];
  artists: Artist[];
}

export type OrderStatus = "pending" | "waiting_verification" | "paid" | "rejected" | "cancelled";

export interface OrderItem {
  id: number;
  order_id: number;
  ticket_category_id: number;
  category_name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  id: number;
  order_code: string;
  user_id: number;
  event_id: number;
  total_amount: number;
  status: OrderStatus;
  payment_method: string | null;
  payment_proof: string | null;
  note: string | null;
  paid_at: string | null;
  verified_at: string | null;
  created_at: string;
  event_title: string;
  event_date: string;
  venue: string;
  city: string;
  poster_url: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  ticket_count?: number;
  items?: OrderItem[];
}

export interface DashboardData {
  stats: {
    revenue: number;
    tickets_sold: number;
    tickets_quota: number;
    orders_total: number;
    pending_verification: number;
    pending_payment: number;
    paid_orders: number;
    events_total: number;
    artists_total: number;
    customers_total: number;
  };
  sales_per_event: {
    id: number;
    title: string;
    event_date: string;
    city: string;
    quota: number;
    sold: number;
    revenue: number;
  }[];
  recent_orders: {
    id: number;
    order_code: string;
    total_amount: number;
    status: OrderStatus;
    created_at: string;
    customer_name: string;
    event_title: string;
  }[];
  category_stock: {
    id: number;
    name: string;
    quota: number;
    sold: number;
    remaining: number;
    event_title: string;
  }[];
  revenue_by_month: { period: string; revenue: number; total_order: number }[];
  server_time?: string;
}

export interface HourlyPoint {
  hour: number;
  label: string;
  total_order: number;
  revenue: number;
}

export interface DailyPoint {
  day: string;
  label: string;
  total_order: number;
  revenue: number;
}

export interface SoldOutForecast {
  category_id: number;
  category_name: string;
  event_id: number;
  event_title: string;
  quota: number;
  sold: number;
  remaining: number;
  percent_sold: number;
  sold_7d: number;
  per_day: number;
  days_left: number | null;
  estimated_sold_out_at: string | null;
}

export interface AnalyticsData {
  hourly: HourlyPoint[];
  daily: DailyPoint[];
  status_distribution: { status: OrderStatus; total: number }[];
  sold_out_forecast: SoldOutForecast[];
  top_events: {
    id: number;
    title: string;
    city: string;
    event_date: string;
    total_order: number;
    revenue: number;
  }[];
  kpi: {
    avg_order_value: number;
    conversion_rate: number;
    tickets_today: number;
    revenue_today: number;
    active_events: number;
    peak_hour: number;
    peak_hour_label: string;
    peak_hour_orders: number;
  };
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; total_page: number };
}
