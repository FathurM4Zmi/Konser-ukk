"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { formatDateTime, percent, rupiah } from "@/lib/format";
import type { EventDetail, TicketCategory } from "@/lib/types";
import { Alert, ConfirmDialog, EmptyState, Loading, Modal, Progress } from "@/components/ui";
import {
  IconArrowLeft,
  IconCalendar,
  IconEdit,
  IconMapPin,
  IconPlus,
  IconTicket,
  IconTrash,
} from "@/components/icons";

type CategoryForm = { name: string; price: string; quota: string; description: string };

const emptyCategory: CategoryForm = { name: "", price: "", quota: "", description: "" };

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TicketCategory | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyCategory);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<TicketCategory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [salesConfirm, setSalesConfirm] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ data: EventDetail }>(`/events/admin/${id}`);
      setEvent(res.data);
    } catch (err) {
      setAlert({ type: "error", message: err instanceof ApiError ? err.message : "Gagal memuat konser." });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyCategory);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (category: TicketCategory) => {
    setEditing(category);
    setForm({
      name: category.name,
      price: String(category.price),
      quota: String(category.quota),
      description: category.description || "",
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormErrors({});

    const payload = {
      name: form.name,
      price: Number(form.price),
      quota: Number(form.quota),
      description: form.description || null,
    };

    try {
      if (editing) {
        await apiFetch(`/events/categories/${editing.id}`, { method: "PUT", body: payload });
      } else {
        await apiFetch(`/events/${id}/categories`, { method: "POST", body: payload });
      }
      setModalOpen(false);
      setAlert({ type: "success", message: editing ? "Kelas tiket diperbarui." : "Kelas tiket ditambahkan." });
      load();
    } catch (err) {
      if (err instanceof ApiError) {
        setFormErrors(err.errors || {});
        if (!err.errors) setAlert({ type: "error", message: err.message });
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/events/categories/${deleteTarget.id}`, { method: "DELETE" });
      setAlert({ type: "success", message: "Kelas tiket dihapus." });
      setDeleteTarget(null);
      load();
    } catch (err) {
      setAlert({ type: "error", message: err instanceof ApiError ? err.message : "Gagal menghapus kelas tiket." });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const toggleSales = async () => {
    if (!event) return;
    const next = event.sales_status === "open" ? "closed" : "open";
    try {
      await apiFetch(`/events/admin/${event.id}/sales-status`, {
        method: "PATCH",
        body: { sales_status: next },
      });
      setAlert({
        type: "success",
        message: next === "closed" ? "Penjualan tiket ditutup." : "Penjualan tiket dibuka kembali.",
      });
      setSalesConfirm(false);
      load();
    } catch (err) {
      setAlert({ type: "error", message: err instanceof ApiError ? err.message : "Gagal mengubah status." });
    }
  };

  if (loading) return <Loading />;
  if (!event) return <Alert type="error" message={alert?.message || "Konser tidak ditemukan."} />;

  const totalQuota = event.categories.reduce((sum, c) => sum + c.quota, 0);
  const totalSold = event.categories.reduce((sum, c) => sum + c.sold, 0);
  const revenue = event.categories.reduce((sum, c) => sum + c.sold * Number(c.price), 0);

  return (
    <div className="space-y-5">
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <Link href="/events" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white">
        <IconArrowLeft className="h-4 w-4" /> Kembali ke daftar konser
      </Link>

      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10">
        <div className="absolute inset-0">
          {event.poster_url ? (
            <img src={event.poster_url} alt={event.title} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-violet-700 to-fuchsia-700" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#06060b] via-[#06060b]/85 to-[#06060b]/40" />
        </div>

        <div className="relative flex flex-col gap-5 p-6 pt-28 sm:p-8 sm:pt-32">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`badge ${
                event.status === "published"
                  ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30"
                  : "bg-slate-400/10 text-slate-300 ring-slate-400/30"
              }`}
            >
              {event.status === "published" ? "Publik" : "Draft"}
            </span>
            <span
              className={`badge ${
                event.sales_status === "open"
                  ? "bg-sky-400/10 text-sky-300 ring-sky-400/30"
                  : "bg-rose-400/10 text-rose-300 ring-rose-400/30"
              }`}
            >
              Penjualan {event.sales_status === "open" ? "dibuka" : "ditutup"}
            </span>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">{event.title}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <IconCalendar className="h-3.5 w-3.5" /> {formatDateTime(event.event_date)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <IconMapPin className="h-3.5 w-3.5" /> {event.venue}, {event.city}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSalesConfirm(true)}
              className={event.sales_status === "open" ? "btn-danger" : "btn-primary"}
            >
              {event.sales_status === "open" ? "Tutup Penjualan" : "Buka Penjualan"}
            </button>
          </div>

          {event.artists.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {event.artists.map((artist) => (
                <span
                  key={artist.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-300"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400" /> {artist.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ringkasan */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Kuota", value: totalQuota.toLocaleString("id-ID"), suffix: "tiket" },
          { label: "Tiket Terjual", value: totalSold.toLocaleString("id-ID"), suffix: `${percent(totalSold, totalQuota)}%` },
          { label: "Sisa Kuota", value: (totalQuota - totalSold).toLocaleString("id-ID"), suffix: "tiket" },
          { label: "Estimasi Pendapatan", value: rupiah(revenue), suffix: "dari tiket terjual" },
        ].map((item) => (
          <div key={item.label} className="card p-5">
            <p className="text-xs text-slate-400">{item.label}</p>
            <p className="mt-2 text-xl font-bold text-white">{item.value}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">{item.suffix}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Kelas Tiket</h3>
              <p className="text-[11px] text-slate-500">Kelola harga dan kuota tiap kelas</p>
            </div>
            <button onClick={openCreate} className="btn-primary">
              <IconPlus className="h-4 w-4" /> Tambah Kelas
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {event.categories.length === 0 && (
              <EmptyState
                icon={<IconTicket />}
                title="Belum ada kelas tiket"
                description="Tambahkan minimal satu kelas agar pelanggan dapat memesan."
              />
            )}
            {event.categories.map((category) => {
              const pct = percent(category.sold, category.quota);
              return (
                <div key={category.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white">{category.name}</p>
                        <span className="badge bg-violet-400/10 text-violet-300 ring-violet-400/30">
                          {rupiah(category.price)}
                        </span>
                      </div>
                      {category.description && (
                        <p className="mt-1 text-[11px] text-slate-500">{category.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(category)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-violet-300"
                        title="Edit"
                      >
                        <IconEdit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(category)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"
                        title="Hapus"
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        Terjual {category.sold} dari {category.quota} tiket
                      </span>
                      <span className={pct >= 90 ? "font-semibold text-rose-300" : "text-slate-300"}>
                        sisa {category.quota - category.sold}
                      </span>
                    </div>
                    <Progress value={pct} className="mt-2" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="text-sm font-bold text-white">Deskripsi Konser</h3>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-400">
              {event.description || "Belum ada deskripsi."}
            </p>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-bold text-white">Informasi</h3>
            <dl className="mt-3 space-y-3 text-sm">
              {[
                ["Venue", event.venue],
                ["Kota", event.city],
                ["Tanggal", formatDateTime(event.event_date)],
                ["Status", event.status === "published" ? "Publik" : "Draft"],
                ["Penjualan", event.sales_status === "open" ? "Dibuka" : "Ditutup"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4">
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="text-right text-xs font-medium text-slate-200">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Modal kelas tiket */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit Kelas ${editing.name}` : "Tambah Kelas Tiket"}
        description="Kuota tidak dapat dikurangi di bawah jumlah tiket yang sudah terjual."
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModalOpen(false)} disabled={saving}>
              Batal
            </button>
            <button type="submit" form="category-form" className="btn-primary" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </>
        }
      >
        <form id="category-form" onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Nama Kelas</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VIP / Festival / Tribune"
            />
            {formErrors.name && <p className="mt-1 text-xs text-rose-400">{formErrors.name}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Harga (Rp)</label>
              <input
                type="number"
                min={0}
                className="input"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="850000"
              />
              {formErrors.price && <p className="mt-1 text-xs text-rose-400">{formErrors.price}</p>}
            </div>
            <div>
              <label className="label">Kuota Tiket</label>
              <input
                type="number"
                min={1}
                className="input"
                value={form.quota}
                onChange={(e) => setForm({ ...form, quota: e.target.value })}
                placeholder="500"
              />
              {formErrors.quota && <p className="mt-1 text-xs text-rose-400">{formErrors.quota}</p>}
            </div>
          </div>

          <div>
            <label className="label">Keterangan (opsional)</label>
            <input
              className="input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Contoh: Berdiri di area festival"
            />
            {formErrors.description && <p className="mt-1 text-xs text-rose-400">{formErrors.description}</p>}
          </div>

          {editing && (
            <p className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-slate-400">
              Tiket terjual saat ini: <span className="font-semibold text-white">{editing.sold}</span>. Kuota minimal{" "}
              {editing.sold}.
            </p>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Kelas Tiket"
        message={`Hapus kelas "${deleteTarget?.name}"? Kelas yang sudah memiliki pesanan tidak dapat dihapus.`}
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <Modal
        open={salesConfirm}
        onClose={() => setSalesConfirm(false)}
        title={event.sales_status === "open" ? "Tutup Penjualan Tiket" : "Buka Penjualan Tiket"}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setSalesConfirm(false)}>
              Batal
            </button>
            <button className={event.sales_status === "open" ? "btn-danger" : "btn-primary"} onClick={toggleSales}>
              {event.sales_status === "open" ? "Ya, Tutup" : "Ya, Buka"}
            </button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-300">
          {event.sales_status === "open"
            ? "Pelanggan tidak akan bisa memesan tiket baru setelah penjualan ditutup. Pesanan yang sudah masuk tetap dapat diverifikasi."
            : "Penjualan akan dibuka kembali dan pelanggan dapat memesan tiket untuk konser ini."}
        </p>
      </Modal>
    </div>
  );
}
