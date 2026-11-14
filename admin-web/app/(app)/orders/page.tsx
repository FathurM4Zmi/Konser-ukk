"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { formatDateTime, rupiah, statusLabel } from "@/lib/format";
import type { Order } from "@/lib/types";
import { Alert, EmptyState, Loading } from "@/components/ui";
import { IconChevronRight, IconReceipt, IconSearch } from "@/components/icons";

const tabs = [
  { key: "", label: "Semua" },
  { key: "waiting_verification", label: "Perlu Verifikasi" },
  { key: "pending", label: "Belum Bayar" },
  { key: "paid", label: "Lunas" },
  { key: "rejected", label: "Ditolak" },
  { key: "cancelled", label: "Dibatalkan" },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, total: 0, total_page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("status");
    if (param) setStatus(param);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ page: String(page), limit: "10" });
      if (status) query.set("status", status);
      if (search) query.set("search", search);

      const res = await apiFetch<{ data: Order[]; meta: typeof meta }>(`/admin/orders?${query.toString()}`);
      setOrders(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat pesanan.");
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    load();
  }, [load]);

  const changeTab = (key: string) => {
    setStatus(key);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {error && <Alert type="error" message={error} />}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-1.5 overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 p-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => changeTab(tab.key)}
              className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                status === tab.key
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:max-w-xs">
          <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari kode, nama, atau konser..."
            className="input pl-10"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Loading />
        ) : orders.length === 0 ? (
          <EmptyState icon={<IconReceipt />} title="Tidak ada pesanan" description="Pesanan pelanggan akan tampil di sini." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="th">Kode Pesanan</th>
                    <th className="th">Pelanggan</th>
                    <th className="th">Konser</th>
                    <th className="th">Tiket</th>
                    <th className="th">Total</th>
                    <th className="th">Status</th>
                    <th className="th">Dibuat</th>
                    <th className="th text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {orders.map((order) => {
                    const badge = statusLabel[order.status];
                    return (
                      <tr key={order.id} className="transition hover:bg-zinc-50">
                        <td className="td">
                          <span className="font-mono text-xs font-medium text-blue-700">{order.order_code}</span>
                        </td>
                        <td className="td">
                          <p className="text-sm font-medium text-zinc-800">{order.customer_name}</p>
                          <p className="text-[11px] text-zinc-500">{order.customer_email}</p>
                        </td>
                        <td className="td max-w-[220px]">
                          <p className="truncate text-sm text-zinc-600">{order.event_title}</p>
                          <p className="text-[11px] text-zinc-500">{formatDateTime(order.event_date)}</p>
                        </td>
                        <td className="td text-center font-semibold text-zinc-800">{order.ticket_count}</td>
                        <td className="td font-semibold text-zinc-900">{rupiah(order.total_amount)}</td>
                        <td className="td">
                          <span className={`badge ${badge.className}`}>{badge.text}</span>
                        </td>
                        <td className="td whitespace-nowrap text-xs text-zinc-500">
                          {formatDateTime(order.created_at)}
                        </td>
                        <td className="td text-right">
                          <Link
                            href={`/orders/${order.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-600 transition hover:border-blue-300 hover:text-blue-600"
                          >
                            Detail <IconChevronRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-center justify-between gap-3 border-t border-zinc-200 px-5 py-3.5 sm:flex-row">
              <p className="text-[11px] text-zinc-500">
                Menampilkan {orders.length} dari {meta.total} pesanan
              </p>
              <div className="flex items-center gap-2">
                <button
                  className="btn-ghost !px-3 !py-1.5 text-xs"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Sebelumnya
                </button>
                <span className="text-xs text-zinc-500">
                  {meta.page} / {meta.total_page}
                </span>
                <button
                  className="btn-ghost !px-3 !py-1.5 text-xs"
                  disabled={page >= meta.total_page}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Berikutnya
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
