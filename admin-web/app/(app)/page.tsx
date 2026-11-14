"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch, openDashboardStream, type LiveStatus } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { compactRupiah, formatDateTime, percent, rupiah, statusLabel } from "@/lib/format";
import type { AnalyticsData, DashboardData, OrderStatus } from "@/lib/types";
import { Alert, EmptyState, Loading, Progress } from "@/components/ui";
import { AreaTrend, DonutChart } from "@/components/charts";
import {
  IconAlert,
  IconArrowLeft,
  IconChevronRight,
  IconClock,
  IconReceipt,
  IconTicket,
  IconTrend,
  IconUsers,
  IconWallet,
} from "@/components/icons";

const statusColors: Record<OrderStatus, string> = {
  pending: "#d97706",
  waiting_verification: "#2563eb",
  paid: "#059669",
  rejected: "#e11d48",
  cancelled: "#a1a1aa",
};

const liveCopy: Record<LiveStatus, { text: string; dot: string; badge: string }> = {
  connecting: { text: "Menghubungkan", dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700 ring-amber-200" },
  live: { text: "Live", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  offline: { text: "Terputus", dot: "bg-rose-500", badge: "bg-rose-50 text-rose-700 ring-rose-200" },
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState("");
  const [live, setLive] = useState<LiveStatus>("connecting");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const user = getUser();

  useEffect(() => {
    apiFetch<{ data: DashboardData }>("/dashboard")
      .then((res) => {
        setData(res.data);
        setUpdatedAt(new Date());
      })
      .catch((err) => setError(err.message));

    const loadAnalytics = () =>
      apiFetch<{ data: AnalyticsData }>("/dashboard/analytics")
        .then((res) => setAnalytics(res.data))
        .catch(() => setAnalytics(null));

    loadAnalytics();
    const analyticsTimer = setInterval(loadAnalytics, 30000);

    // Realtime: snapshot dashboard dikirim backend tiap 5 detik.
    const stop = openDashboardStream(
      (snapshot) => {
        setData(snapshot as unknown as DashboardData);
        setUpdatedAt(snapshot.server_time ? new Date(snapshot.server_time) : new Date());
      },
      setLive
    );

    return () => {
      stop();
      clearInterval(analyticsTimer);
    };
  }, []);

  // Selalu tampilkan 6 bulan terakhir, termasuk bulan tanpa pendapatan.
  const months = useMemo(() => {
    if (!data) return [];
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const found = data.revenue_by_month.find((m) => m.period === key);
      return {
        key,
        label: date.toLocaleDateString("id-ID", { month: "short" }),
        revenue: found?.revenue || 0,
      };
    });
  }, [data]);

  const hourlyMax = useMemo(
    () => Math.max(...(analytics?.hourly.map((h) => h.total_order) || [0]), 1),
    [analytics]
  );

  if (error) return <Alert type="error" message={error} />;
  if (!data) return <Loading />;

  const { stats } = data;
  const maxRevenue = Math.max(...months.map((m) => m.revenue), 1);
  const liveMeta = liveCopy[live];
  const kpi = analytics?.kpi;

  const cards = [
    {
      label: "Total Pendapatan",
      value: rupiah(stats.revenue),
      hint: `${stats.paid_orders} pesanan lunas`,
      icon: IconWallet,
    },
    {
      label: "Tiket Terjual",
      value: stats.tickets_sold.toLocaleString("id-ID"),
      hint: `dari ${stats.tickets_quota.toLocaleString("id-ID")} kuota`,
      icon: IconTicket,
    },
    {
      label: "Total Pesanan",
      value: stats.orders_total.toLocaleString("id-ID"),
      hint: `${stats.pending_payment} belum dibayar`,
      icon: IconReceipt,
    },
    {
      label: "Menunggu Verifikasi",
      value: stats.pending_verification.toLocaleString("id-ID"),
      hint: "perlu ditinjau admin",
      icon: IconClock,
    },
  ];

  const donutSegments = (analytics?.status_distribution || []).map((item) => ({
    label: statusLabel[item.status]?.text || item.status,
    value: item.total,
    color: statusColors[item.status],
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
              Selamat datang, {user?.name || "Admin"}
            </h2>
            <span className={`badge ${liveMeta.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${liveMeta.dot}`} />
              {liveMeta.text}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {stats.pending_verification} pembayaran menunggu verifikasi dan {stats.events_total} konser terdaftar.
          </p>
          <p className="mt-1 text-[11px] text-zinc-400">
            Diperbarui otomatis setiap 5 detik
            {updatedAt ? ` · terakhir ${updatedAt.toLocaleTimeString("id-ID")}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href="/orders?status=waiting_verification" className="btn-ghost">
            <IconAlert className="h-4 w-4" /> Verifikasi
          </Link>
          <Link href="/events" className="btn-primary">
            Kelola Konser <IconChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* KPI cepat */}
      {kpi && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Rata-rata Nilai Pesanan",
              value: rupiah(kpi.avg_order_value),
              hint: "per pesanan lunas",
            },
            {
              label: "Tingkat Konversi",
              value: `${kpi.conversion_rate}%`,
              hint: "pesanan menjadi lunas",
            },
            {
              label: "Tiket Hari Ini",
              value: kpi.tickets_today.toLocaleString("id-ID"),
              hint: `${compactRupiah(kpi.revenue_today)} pendapatan`,
            },
            {
              label: "Jam Paling Ramai",
              value: kpi.peak_hour_label,
              hint: `${kpi.peak_hour_orders} pesanan / 30 hari`,
            },
          ].map((item) => (
            <div key={item.label} className="card p-4">
              <p className="text-[11px] font-medium text-zinc-500">{item.label}</p>
              <p className="mt-1.5 text-lg font-semibold tracking-tight text-zinc-900">{item.value}</p>
              <p className="mt-0.5 text-[11px] text-zinc-400">{item.hint}</p>
            </div>
          ))}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium text-zinc-500">{card.label}</p>
                <span className="grid h-8 w-8 place-items-center rounded-md bg-zinc-100 text-zinc-500">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">{card.value}</p>
              <p className="mt-1 text-[11px] text-zinc-400">{card.hint}</p>
            </div>
          );
        })}
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-3">
        {/* Penjualan per konser */}
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Penjualan per Konser</h3>
              <p className="text-[11px] text-zinc-500">Tiket terjual terhadap total kuota</p>
            </div>
            <Link href="/events" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              Lihat semua
            </Link>
          </div>

          <div className="divide-y divide-zinc-100">
            {data.sales_per_event.length === 0 && (
              <EmptyState icon={<IconTicket />} title="Belum ada data konser" />
            )}
            {data.sales_per_event.map((event) => {
              const pct = percent(event.sold, event.quota);
              return (
                <div key={event.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900">{event.title}</p>
                      <p className="mt-0.5 text-[11px] text-zinc-500">
                        {event.city} · {event.sold.toLocaleString("id-ID")} / {event.quota.toLocaleString("id-ID")} tiket
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-700">{compactRupiah(event.revenue)}</p>
                      <p className="text-[11px] text-zinc-500">{pct}% terjual</p>
                    </div>
                  </div>
                  <Progress value={pct} className="mt-3" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribusi status pesanan */}
        <div className="card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-zinc-900">Distribusi Status</h3>
            <p className="text-[11px] text-zinc-500">Komposisi seluruh pesanan</p>
          </div>

          {!analytics ? (
            <Loading label="Memuat analitik..." />
          ) : (
            <div className="flex flex-col items-center gap-4">
              <DonutChart
                segments={donutSegments}
                centerLabel="total pesanan"
                centerValue={analytics.status_distribution
                  .reduce((sum, item) => sum + item.total, 0)
                  .toLocaleString("id-ID")}
              />
              <div className="w-full space-y-2">
                {donutSegments.map((segment) => (
                  <div key={segment.label} className="flex items-center gap-2.5 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: segment.color }} />
                    <span className="flex-1 text-zinc-500">{segment.label}</span>
                    <span className="font-semibold text-zinc-800">{segment.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-3">
        {/* Jam ramai */}
        <div className="card p-5 xl:col-span-2">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Jam Ramai Pembelian</h3>
              <p className="text-[11px] text-zinc-500">Jumlah pesanan per jam, 30 hari terakhir</p>
            </div>
            {kpi && (
              <span className="badge bg-amber-50 text-amber-700 ring-amber-200">
                <IconClock className="h-3 w-3" /> Puncak {kpi.peak_hour_label}
              </span>
            )}
          </div>

          {!analytics ? (
            <Loading label="Memuat analitik..." />
          ) : (
            <div className="flex h-40 items-end gap-[3px] sm:gap-1.5">
              {analytics.hourly.map((point) => {
                const ratio = point.total_order / hourlyMax;
                const isPeak = kpi?.peak_hour === point.hour && point.total_order > 0;
                return (
                  <div key={point.hour} className="group flex h-full flex-1 flex-col items-center justify-end gap-1">
                    <span className="text-[9px] font-semibold text-zinc-500 opacity-0 transition group-hover:opacity-100">
                      {point.total_order}
                    </span>
                    <div className="relative flex w-full flex-1 items-end">
                      <div
                        className={`w-full rounded-t-md transition-all duration-500 ${
                          isPeak ? "ring-1 ring-amber-300" : ""
                        }`}
                        style={{
                          height: point.total_order > 0 ? `${Math.max(ratio * 100, 8)}%` : "3px",
                          background: point.total_order > 0 ? (isPeak ? "#d97706" : "#2563eb") : "#f4f4f5",
                        }}
                      />
                    </div>
                    <span
                      className={`text-[8px] sm:text-[9px] ${
                        isPeak ? "font-bold text-amber-700" : "text-zinc-400"
                      }`}
                    >
                      {point.hour % 3 === 0 ? point.hour : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-3 text-[10px] text-zinc-400">
            Sumbu horizontal menunjukkan jam (0-23). Batang terang = volume pesanan tinggi.
          </p>
        </div>

        {/* Prediksi sold out */}
        <div className="card">
          <div className="border-b border-zinc-200 px-5 py-4">
            <h3 className="text-sm font-semibold text-zinc-900">Prediksi Sold Out</h3>
            <p className="text-[11px] text-zinc-500">Berdasarkan kecepatan jual 7 hari</p>
          </div>
          <div className="divide-y divide-zinc-100">
            {!analytics && <Loading label="Memuat analitik..." />}
            {analytics && analytics.sold_out_forecast.length === 0 && (
              <EmptyState icon={<IconTrend />} title="Belum ada pergerakan penjualan" />
            )}
            {analytics?.sold_out_forecast.map((item) => {
              const slow = (item.days_left ?? 0) > 90;
              return (
                <div key={item.category_id} className="px-5 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900">{item.category_name}</p>
                      <p className="truncate text-[11px] text-zinc-500">{item.event_title}</p>
                    </div>
                    <span
                      className={`badge shrink-0 ${
                        slow
                          ? "bg-zinc-100 text-zinc-600 ring-zinc-200"
                          : (item.days_left ?? 99) <= 3
                            ? "bg-rose-50 text-rose-600 ring-rose-200"
                            : (item.days_left ?? 99) <= 7
                              ? "bg-amber-50 text-amber-700 ring-amber-200"
                              : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      }`}
                    >
                      {slow ? "stabil" : `${item.days_left} hari`}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500">
                    <span>
                      {item.remaining} sisa · {item.per_day}/hari
                    </span>
                    <span>{slow ? "penjualan lambat" : item.estimated_sold_out_at}</span>
                  </div>
                  <Progress value={item.percent_sold} className="mt-2" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-3">
        {/* Tren 14 hari */}
        <div className="card p-5 xl:col-span-2">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Tren Pesanan 14 Hari</h3>
              <p className="text-[11px] text-zinc-500">Jumlah pesanan masuk per hari</p>
            </div>
            <span className="badge bg-blue-50 text-blue-700 ring-blue-200">
              <IconTrend className="h-3 w-3" /> {analytics?.daily.reduce((sum, d) => sum + d.total_order, 0) || 0} pesanan
            </span>
          </div>
          {!analytics ? (
            <Loading label="Memuat analitik..." />
          ) : (
            <AreaTrend
              points={analytics.daily.map((day) => ({ label: day.label, value: day.total_order }))}
              color="#2563eb"
            />
          )}
        </div>

        {/* Kuota tersisa */}
        <div className="card">
          <div className="border-b border-zinc-200 px-5 py-4">
            <h3 className="text-sm font-semibold text-zinc-900">Kuota Hampir Habis</h3>
            <p className="text-[11px] text-zinc-500">Kelas tiket dengan sisa paling sedikit</p>
          </div>
          <div className="divide-y divide-zinc-100">
            {data.category_stock.length === 0 && (
              <EmptyState icon={<IconTicket />} title="Belum ada kelas tiket" />
            )}
            {data.category_stock.map((cat) => {
              const pct = percent(cat.sold, cat.quota);
              return (
                <div key={cat.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900">{cat.name}</p>
                      <p className="truncate text-[11px] text-zinc-500">{cat.event_title}</p>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-bold ${
                        cat.remaining <= 20 ? "text-rose-600" : cat.remaining <= 100 ? "text-amber-700" : "text-emerald-700"
                      }`}
                    >
                      {cat.remaining} sisa
                    </span>
                  </div>
                  <Progress value={pct} className="mt-2.5" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Grafik pendapatan */}
        <div className="card p-5 xl:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Pendapatan 6 Bulan Terakhir</h3>
              <p className="text-[11px] text-zinc-500">Berdasarkan pesanan berstatus lunas</p>
            </div>
            <span className="badge bg-emerald-50 text-emerald-700 ring-emerald-200">
              <IconTrend className="h-3 w-3" /> {rupiah(stats.revenue)}
            </span>
          </div>

          {months.length === 0 ? (
            <EmptyState icon={<IconTrend />} title="Belum ada pendapatan tercatat" />
          ) : (
            <div className="flex h-48 items-end gap-3 sm:gap-5">
              {months.map((month) => {
                const height = month.revenue > 0 ? Math.max(Math.round((month.revenue / maxRevenue) * 100), 8) : 0;
                return (
                  <div key={month.key} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <span className="text-[10px] font-semibold text-zinc-500 opacity-0 transition group-hover:opacity-100">
                      {compactRupiah(month.revenue)}
                    </span>
                    <div className="relative flex w-full flex-1 items-end">
                      <div
                        className={`w-full rounded-t-lg transition-all ${
                          month.revenue > 0
                            ? "bg-zinc-800 group-hover:bg-zinc-700"
                            : "bg-zinc-100"
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-[11px] capitalize text-zinc-500">{month.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ringkasan sistem */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-zinc-900">Ringkasan Sistem</h3>
          <p className="text-[11px] text-zinc-500">Data master yang tersimpan</p>

          <div className="mt-4 space-y-2.5">
            {[
              { label: "Total konser", value: stats.events_total, icon: IconTicket, href: "/events", color: "bg-zinc-100 text-zinc-500" },
              { label: "Total artis", value: stats.artists_total, icon: IconUsers, href: "/artists", color: "bg-zinc-100 text-zinc-500" },
              { label: "Pelanggan terdaftar", value: stats.customers_total, icon: IconUsers, href: "/orders", color: "bg-zinc-100 text-zinc-500" },
              { label: "Pesanan lunas", value: stats.paid_orders, icon: IconReceipt, href: "/orders?status=paid", color: "bg-zinc-100 text-zinc-500" },
            ].map((row) => {
              const Icon = row.icon;
              return (
                <Link
                  key={row.label}
                  href={row.href}
                  className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3 transition hover:border-zinc-300 hover:bg-zinc-100"
                >
                  <span className={`grid h-8 w-8 place-items-center rounded-lg ${row.color}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1 text-xs text-zinc-500">{row.label}</span>
                  <span className="text-sm font-semibold text-zinc-900">{row.value}</span>
                  <IconArrowLeft className="h-3.5 w-3.5 rotate-180 text-zinc-400" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pesanan terbaru */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Pesanan Terbaru</h3>
            <p className="text-[11px] text-zinc-500">5 transaksi terakhir dari pelanggan</p>
          </div>
          <Link href="/orders" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
            Semua pesanan
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="th">Kode</th>
                <th className="th">Pelanggan</th>
                <th className="th">Konser</th>
                <th className="th">Total</th>
                <th className="th">Status</th>
                <th className="th">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {data.recent_orders.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <EmptyState icon={<IconReceipt />} title="Belum ada pesanan" />
                  </td>
                </tr>
              )}
              {data.recent_orders.map((order) => {
                const status = statusLabel[order.status];
                return (
                  <tr key={order.id} className="transition hover:bg-zinc-50">
                    <td className="td">
                      <Link href={`/orders/${order.id}`} className="font-mono text-xs font-medium text-blue-700">
                        {order.order_code}
                      </Link>
                    </td>
                    <td className="td">{order.customer_name}</td>
                    <td className="td max-w-[220px] truncate">{order.event_title}</td>
                    <td className="td font-semibold text-zinc-900">{rupiah(order.total_amount)}</td>
                    <td className="td">
                      <span className={`badge ${status.className}`}>{status.text}</span>
                    </td>
                    <td className="td text-xs text-zinc-500">{formatDateTime(order.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
