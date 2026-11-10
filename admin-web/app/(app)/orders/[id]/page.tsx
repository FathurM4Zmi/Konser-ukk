"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch, assetUrl, ApiError } from "@/lib/api";
import { formatDateTime, rupiah, statusLabel } from "@/lib/format";
import type { Order } from "@/lib/types";
import { Alert, Loading, Modal } from "@/components/ui";
import {
  IconArrowLeft,
  IconCalendar,
  IconCheck,
  IconImage,
  IconMapPin,
  IconReceipt,
  IconTicket,
  IconUsers,
  IconWallet,
  IconX,
} from "@/components/icons";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [note, setNote] = useState("");
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ data: Order }>(`/orders/${id}`);
      setOrder(res.data);
    } catch (err) {
      setAlert({ type: "error", message: err instanceof ApiError ? err.message : "Gagal memuat pesanan." });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const submitVerification = async () => {
    if (!action || !order) return;
    setProcessing(true);
    try {
      const res = await apiFetch<{ message: string }>(`/admin/orders/${order.id}/verify`, {
        method: "PATCH",
        body: { action, note: note || null },
      });
      setAlert({ type: "success", message: res.message });
      setAction(null);
      setNote("");
      load();
    } catch (err) {
      setAlert({ type: "error", message: err instanceof ApiError ? err.message : "Gagal memproses verifikasi." });
      setAction(null);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <Loading />;
  if (!order) return <Alert type="error" message={alert?.message || "Pesanan tidak ditemukan."} />;

  const badge = statusLabel[order.status];
  const canVerify = order.status === "pending" || order.status === "waiting_verification";
  const proofUrl = assetUrl(order.payment_proof);
  const ticketCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div className="space-y-5">
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <Link href="/orders" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white">
        <IconArrowLeft className="h-4 w-4" /> Kembali ke daftar pesanan
      </Link>

      {/* Header */}
      <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-300">
            <IconReceipt className="h-6 w-6" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-mono text-lg font-bold text-white">{order.order_code}</h2>
              <span className={`badge ${badge.className}`}>{badge.text}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Dibuat {formatDateTime(order.created_at)} · {ticketCount} tiket
            </p>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-[11px] uppercase tracking-wider text-slate-500">Total Pembayaran</p>
          <p className="text-xl font-bold text-white">{rupiah(order.total_amount)}</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          {/* Rincian tiket */}
          <div className="card">
            <div className="border-b border-white/10 px-5 py-4">
              <h3 className="text-sm font-bold text-white">Rincian Tiket</h3>
            </div>
            <div className="divide-y divide-white/5">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-violet-300">
                      <IconTicket className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{item.category_name}</p>
                      <p className="text-[11px] text-slate-500">
                        {item.quantity} × {rupiah(item.price)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-white">{rupiah(item.subtotal)}</p>
                </div>
              ))}
              <div className="flex items-center justify-between px-5 py-4">
                <p className="text-sm font-semibold text-slate-300">Total</p>
                <p className="text-base font-bold text-emerald-300">{rupiah(order.total_amount)}</p>
              </div>
            </div>
          </div>

          {/* Bukti pembayaran */}
          <div className="card">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h3 className="text-sm font-bold text-white">Bukti Pembayaran</h3>
                <p className="text-[11px] text-slate-500">
                  Metode: {order.payment_method || "belum dipilih"}
                </p>
              </div>
              {order.paid_at && (
                <span className="badge bg-white/5 text-slate-300 ring-white/10">
                  Dibayar {formatDateTime(order.paid_at)}
                </span>
              )}
            </div>

            <div className="p-5">
              {proofUrl ? (
                <a href={proofUrl} target="_blank" rel="noreferrer" className="block">
                  <img
                    src={proofUrl}
                    alt="Bukti pembayaran"
                    className="max-h-[420px] w-full rounded-xl border border-white/10 object-contain bg-black/40"
                  />
                  <p className="mt-2 text-center text-[11px] text-slate-500">Klik untuk membuka ukuran penuh</p>
                </a>
              ) : (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/10 py-10 text-center">
                  <IconImage className="h-6 w-6 text-slate-600" />
                  <p className="text-xs text-slate-500">Pelanggan belum mengunggah bukti pembayaran.</p>
                </div>
              )}

              {order.note && (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Catatan</p>
                  <p className="mt-1 text-xs text-slate-300">{order.note}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-white">
              <IconUsers className="h-4 w-4 text-violet-300" /> Data Pelanggan
            </h3>
            <div className="mt-3 space-y-2.5 text-xs">
              <div>
                <p className="text-slate-500">Nama</p>
                <p className="font-medium text-slate-200">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-slate-500">Email</p>
                <p className="font-medium text-slate-200">{order.customer_email}</p>
              </div>
              <div>
                <p className="text-slate-500">Telepon</p>
                <p className="font-medium text-slate-200">{order.customer_phone || "-"}</p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-white">
              <IconCalendar className="h-4 w-4 text-violet-300" /> Konser
            </h3>
            <p className="mt-3 text-sm font-semibold text-slate-100">{order.event_title}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
              <IconMapPin className="h-3 w-3" /> {order.venue}, {order.city}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
              <IconCalendar className="h-3 w-3" /> {formatDateTime(order.event_date)}
            </p>
            <Link
              href={`/events/${order.event_id}`}
              className="mt-3 inline-block text-[11px] font-semibold text-violet-300 hover:text-violet-200"
            >
              Lihat detail konser →
            </Link>
          </div>

          <div className="card p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-white">
              <IconWallet className="h-4 w-4 text-violet-300" /> Verifikasi
            </h3>

            {canVerify ? (
              <>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                  Periksa bukti transfer sebelum menyetujui. Tiket & QR Code dibuat otomatis setelah disetujui.
                </p>
                <div className="mt-4 space-y-2">
                  <button className="btn-primary w-full" onClick={() => setAction("approve")}>
                    <IconCheck className="h-4 w-4" /> Setujui Pembayaran
                  </button>
                  <button className="btn-danger w-full" onClick={() => setAction("reject")}>
                    <IconX className="h-4 w-4" /> Tolak Pembayaran
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-xs text-slate-300">
                  Pesanan sudah diproses{badge ? ` dengan status "${badge.text}"` : ""}.
                </p>
                {order.verified_at && (
                  <p className="mt-1 text-[11px] text-slate-500">Diverifikasi {formatDateTime(order.verified_at)}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={!!action}
        onClose={() => setAction(null)}
        title={action === "approve" ? "Setujui Pembayaran" : "Tolak Pembayaran"}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setAction(null)} disabled={processing}>
              Batal
            </button>
            <button
              className={action === "approve" ? "btn-primary" : "btn-danger"}
              onClick={submitVerification}
              disabled={processing}
            >
              {processing ? "Memproses..." : action === "approve" ? "Ya, Setujui" : "Ya, Tolak"}
            </button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-300">
          {action === "approve"
            ? `Pembayaran untuk pesanan ${order.order_code} akan ditandai lunas dan ${ticketCount} tiket aktif akan dibuat.`
            : `Pesanan ${order.order_code} akan ditolak dan kuota tiket dikembalikan ke stok.`}
        </p>

        <div className="mt-4">
          <label className="label">Catatan (opsional)</label>
          <textarea
            className="input min-h-[80px] resize-y"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={action === "reject" ? "Alasan penolakan, misal: nominal transfer tidak sesuai" : "Catatan tambahan"}
          />
        </div>
      </Modal>
    </div>
  );
}
