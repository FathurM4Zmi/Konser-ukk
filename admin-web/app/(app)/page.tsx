"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { compactRupiah, formatDateTime, percent, rupiah, statusLabel } from "@/lib/format";
import type { DashboardData } from "@/lib/types";
import { Alert, EmptyState, Loading, Progress } from "@/components/ui";
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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const user = getUser();

  useEffect(() => {
    apiFetch<{ data: DashboardData }>("/dashboard")
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message));
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

  if (error) return <Alert type="error" message={error} />;
  if (!data) return <Loading />;

  const { stats } = data;
  const maxRevenue = Math.max(...months.map((m) => m.revenue), 1);

  const cards = [
    {
      label: "Total Pendapatan",
      value: rupiah(stats.revenue),
      hint: `${stats.paid_orders} pesanan lunas`,
      icon: IconWallet,
      accent: "from-emerald-500/20 to-emerald-500/0 text-emerald-300",
    },
    {
      label: "Tiket Terjual",
      value: stats.tickets_sold.toLocaleString("id-ID"),
      hint: `dari ${stats.tickets_quota.toLocaleString("id-ID")} kuota`,
      icon: IconTicket,
      accent: "from-violet-500/20 to-violet-500/0 text-violet-300",
    },
    {
      label: "Total Pesanan",
      value: stats.orders_total.toLocaleString("id-ID"),
      hint: `${stats.pending_payment} belum dibayar`,
      icon: IconReceipt,
      accent: "from-sky-500/20 to-sky-500/0 text-sky-300",
    },
    {
      label: "Menunggu Verifikasi",
      value: stats.pending_verification.toLocaleString("id-ID"),
      hint: "perlu ditinjau admin",
      icon: IconClock,
      accent: "from-amber-500/20 to-amber-500/0 text-amber-300",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-600/20 via-[#0d0d1a] to-fuchsia-600/10 p-6 sm:p-7">
        <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
              Selamat datang kembali
            </p>
            <h2 className="mt-1.5 text-2xl font-bold text-white">{user?.name || "Admin"}</h2>
            <p className="mt-1 max-w-lg text-sm text-slate-400">
              Ada {stats.pending_verification} pembayaran menunggu verifikasi dan {stats.events_total} konser
              terdaftar di sistem.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/orders?status=waiting_verification" className="btn-ghost">
              <IconAlert className="h-4 w-4" /> Verifikasi
            </Link>
            <Link href="/events" className="btn-primary">
              Kelola Konser <IconChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card relative overflow-hidden p-5">
              <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-60`} />
              <div className="relative">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-medium text-slate-400">{card.label}</p>
                  <span className={`rounded-lg bg-white/5 p-2 ${card.accent.split(" ").pop()}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-3 text-2xl font-bold tracking-tight text-white">{card.value}</p>
                <p className="mt-1 text-[11px] text-slate-500">{card.hint}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-3">
        {/* Penjualan per konser */}
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h3 className="text-sm font-bold text-white">Penjualan per Konser</h3>
              <p className="text-[11px] text-slate-500">Tiket terjual terhadap total kuota</p>
            </div>
            <Link href="/events" className="text-xs font-semibold text-violet-300 hover:text-violet-200">
              Lihat semua
            </Link>
          </div>

          <div className="divide-y divide-white/5">
            {data.sales_per_event.length === 0 && (
              <EmptyState icon={<IconTicket />} title="Belum ada data konser" />
            )}
            {data.sales_per_event.map((event) => {
              const pct = percent(event.sold, event.quota);
              return (
                <div key={event.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-100">{event.title}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {event.city} · {event.sold.toLocaleString("id-ID")} / {event.quota.toLocaleString("id-ID")} tiket
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-300">{compactRupiah(event.revenue)}</p>
                      <p className="text-[11px] text-slate-500">{pct}% terjual</p>
                    </div>
                  </div>
                  <Progress value={pct} className="mt-3" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Kuota tersisa */}
        <div className="card">
          <div className="border-b border-white/10 px-5 py-4">
            <h3 className="text-sm font-bold text-white">Kuota Hampir Habis</h3>
            <p className="text-[11px] text-slate-500">Kelas tiket dengan sisa paling sedikit</p>
          </div>
          <div className="divide-y divide-white/5">
            {data.category_stock.length === 0 && (
              <EmptyState icon={<IconTicket />} title="Belum ada kelas tiket" />
            )}
            {data.category_stock.map((cat) => {
              const pct = percent(cat.sold, cat.quota);
              return (
                <div key={cat.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100">{cat.name}</p>
                      <p className="truncate text-[11px] text-slate-500">{cat.event_title}</p>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-bold ${
                        cat.remaining <= 20 ? "text-rose-300" : cat.remaining <= 100 ? "text-amber-300" : "text-emerald-300"
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
              <h3 className="text-sm font-bold text-white">Pendapatan 6 Bulan Terakhir</h3>
              <p className="text-[11px] text-slate-500">Berdasarkan pesanan berstatus lunas</p>
            </div>
            <span className="badge bg-emerald-400/10 text-emerald-300 ring-emerald-400/30">
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
                    <span className="text-[10px] font-semibold text-slate-400 opacity-0 transition group-hover:opacity-100">
                      {compactRupiah(month.revenue)}
                    </span>
                    <div className="relative flex w-full flex-1 items-end">
                      <div
                        className={`w-full rounded-t-lg transition-all ${
                          month.revenue > 0
                            ? "bg-gradient-to-t from-violet-600/40 via-violet-500/70 to-fuchsia-400 group-hover:from-violet-500/60 group-hover:to-fuchsia-300"
                            : "bg-white/5"
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-[11px] capitalize text-slate-500">{month.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ringkasan sistem */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-white">Ringkasan Sistem</h3>
          <p className="text-[11px] text-slate-500">Data master yang tersimpan</p>

          <div className="mt-4 space-y-2.5">
            {[
              { label: "Total konser", value: stats.events_total, icon: IconTicket, href: "/events" },
              { label: "Total artis", value: stats.artists_total, icon: IconUsers, href: "/artists" },
              { label: "Pelanggan terdaftar", value: stats.customers_total, icon: IconUsers, href: "/orders" },
              { label: "Pesanan lunas", value: stats.paid_orders, icon: IconReceipt, href: "/orders?status=paid" },
            ].map((row) => {
              const Icon = row.icon;
              return (
                <Link
                  key={row.label}
                  href={row.href}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-3 transition hover:border-white/10 hover:bg-white/[0.05]"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-500/10 text-violet-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1 text-xs text-slate-400">{row.label}</span>
                  <span className="text-sm font-bold text-white">{row.value}</span>
                  <IconArrowLeft className="h-3.5 w-3.5 rotate-180 text-slate-600" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pesanan terbaru */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h3 className="text-sm font-bold text-white">Pesanan Terbaru</h3>
            <p className="text-[11px] text-slate-500">5 transaksi terakhir dari pelanggan</p>
          </div>
          <Link href="/orders" className="text-xs font-semibold text-violet-300 hover:text-violet-200">
            Semua pesanan
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-white/5">
                <th className="th">Kode</th>
                <th className="th">Pelanggan</th>
                <th className="th">Konser</th>
                <th className="th">Total</th>
                <th className="th">Status</th>
                <th className="th">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
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
                  <tr key={order.id} className="transition hover:bg-white/[0.02]">
                    <td className="td">
                      <Link href={`/orders/${order.id}`} className="font-mono text-xs font-semibold text-violet-300">
                        {order.order_code}
                      </Link>
                    </td>
                    <td className="td">{order.customer_name}</td>
                    <td className="td max-w-[220px] truncate">{order.event_title}</td>
                    <td className="td font-semibold text-white">{rupiah(order.total_amount)}</td>
                    <td className="td">
                      <span className={`badge ${status.className}`}>{status.text}</span>
                    </td>
                    <td className="td text-xs text-slate-500">{formatDateTime(order.created_at)}</td>
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
