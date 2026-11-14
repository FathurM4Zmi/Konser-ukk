"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { formatDateTime, percent, toInputDateTime } from "@/lib/format";
import type { Artist, EventDetail, EventItem } from "@/lib/types";
import { Alert, ConfirmDialog, EmptyState, Loading, Modal, Progress } from "@/components/ui";
import {
  IconCalendar,
  IconEdit,
  IconMapPin,
  IconPlus,
  IconSearch,
  IconTicket,
  IconTrash,
} from "@/components/icons";

type FormState = {
  title: string;
  description: string;
  venue: string;
  city: string;
  event_date: string;
  poster_url: string;
  status: "draft" | "published";
  artist_ids: number[];
};

const emptyForm: FormState = {
  title: "",
  description: "",
  venue: "",
  city: "",
  event_date: "",
  poster_url: "",
  status: "published",
  artist_ids: [],
};

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EventDetail | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<EventItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusTarget, setStatusTarget] = useState<EventItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: EventItem[] }>("/events/admin/all");
      setEvents(res.data);
    } catch (err) {
      setAlert({ type: "error", message: err instanceof ApiError ? err.message : "Gagal memuat konser." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    apiFetch<{ data: Artist[] }>("/artists")
      .then((res) => setArtists(res.data))
      .catch(() => {});
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return events;
    return events.filter(
      (e) => e.title.toLowerCase().includes(q) || e.city.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q)
    );
  }, [events, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = async (event: EventItem) => {
    setFormErrors({});
    setModalOpen(true);
    try {
      const res = await apiFetch<{ data: EventDetail }>(`/events/admin/${event.id}`);
      const detail = res.data;
      setEditing(detail);
      setForm({
        title: detail.title,
        description: detail.description || "",
        venue: detail.venue,
        city: detail.city,
        event_date: toInputDateTime(detail.event_date),
        poster_url: detail.poster_url || "",
        status: detail.status,
        artist_ids: detail.artists.map((a) => a.id),
      });
    } catch (err) {
      setModalOpen(false);
      setAlert({ type: "error", message: err instanceof ApiError ? err.message : "Gagal memuat detail konser." });
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormErrors({});

    const payload = {
      ...form,
      description: form.description || null,
      poster_url: form.poster_url || null,
      event_date: form.event_date,
    };

    try {
      if (editing) {
        await apiFetch(`/events/admin/${editing.id}`, { method: "PUT", body: payload });
      } else {
        await apiFetch("/events/admin", { method: "POST", body: payload });
      }
      setModalOpen(false);
      setAlert({
        type: "success",
        message: editing ? "Data konser berhasil diperbarui." : "Konser baru berhasil dibuat.",
      });
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
      await apiFetch(`/events/admin/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      setAlert({ type: "success", message: "Konser berhasil dihapus." });
      load();
    } catch (err) {
      setAlert({ type: "error", message: err instanceof ApiError ? err.message : "Gagal menghapus konser." });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const toggleSales = async () => {
    if (!statusTarget) return;
    const next = statusTarget.sales_status === "open" ? "closed" : "open";
    try {
      await apiFetch(`/events/admin/${statusTarget.id}/sales-status`, {
        method: "PATCH",
        body: { sales_status: next },
      });
      setAlert({
        type: "success",
        message: next === "closed" ? "Penjualan tiket ditutup." : "Penjualan tiket dibuka kembali.",
      });
      setStatusTarget(null);
      load();
    } catch (err) {
      setAlert({ type: "error", message: err instanceof ApiError ? err.message : "Gagal mengubah status." });
    }
  };

  return (
    <div className="space-y-5">
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari konser, kota, venue..."
            className="input pl-10"
          />
        </div>
        <button onClick={openCreate} className="btn-primary shrink-0">
          <IconPlus className="h-4 w-4" /> Tambah Konser
        </button>
      </div>

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<IconCalendar />}
            title="Belum ada konser"
            description="Tambahkan konser pertama untuk mulai menjual tiket."
            action={
              <button onClick={openCreate} className="btn-primary">
                <IconPlus className="h-4 w-4" /> Tambah Konser
              </button>
            }
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="th">Konser</th>
                  <th className="th">Jadwal</th>
                  <th className="th">Kuota</th>
                  <th className="th">Status</th>
                  <th className="th">Penjualan</th>
                  <th className="th text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((event) => {
                  const pct = percent(event.total_sold || 0, event.total_quota || 0);
                  return (
                    <tr key={event.id} className="transition hover:bg-zinc-50">
                      <td className="td">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
                            {event.poster_url ? (
                              <img src={event.poster_url} alt={event.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="grid h-full place-items-center text-zinc-400">
                                <IconTicket className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/events/${event.id}`}
                              className="block max-w-[240px] truncate text-sm font-medium text-zinc-900 hover:text-blue-600"
                            >
                              {event.title}
                            </Link>
                            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-500">
                              <IconMapPin className="h-3 w-3" /> {event.venue}, {event.city}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="td whitespace-nowrap text-xs text-zinc-500">
                        {formatDateTime(event.event_date)}
                      </td>
                      <td className="td w-[180px]">
                        <div className="flex items-center justify-between text-[11px] text-zinc-500">
                          <span>
                            {event.total_sold || 0} / {event.total_quota || 0}
                          </span>
                          <span className="font-semibold text-zinc-600">{pct}%</span>
                        </div>
                        <Progress value={pct} className="mt-1.5" />
                        <p className="mt-1 text-[10px] text-zinc-400">{event.total_category || 0} kelas tiket</p>
                      </td>
                      <td className="td">
                        <span
                          className={`badge ${
                            event.status === "published"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : "bg-zinc-100 text-zinc-500 ring-zinc-200"
                          }`}
                        >
                          {event.status === "published" ? "Publik" : "Draft"}
                        </span>
                      </td>
                      <td className="td">
                        <button
                          onClick={() => setStatusTarget(event)}
                          className={`badge transition hover:opacity-80 ${
                            event.sales_status === "open"
                              ? "bg-blue-50 text-blue-700 ring-blue-200"
                              : "bg-rose-50 text-rose-600 ring-rose-200"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              event.sales_status === "open" ? "bg-sky-400" : "bg-rose-400"
                            }`}
                          />
                          {event.sales_status === "open" ? "Dibuka" : "Ditutup"}
                        </button>
                      </td>
                      <td className="td">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/events/${event.id}`}
                            className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                            title="Detail & kelas tiket"
                          >
                            <IconTicket className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => openEdit(event)}
                            className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-blue-600"
                            title="Edit"
                          >
                            <IconEdit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(event)}
                            className="rounded-lg p-2 text-zinc-500 transition hover:bg-rose-50 hover:text-rose-600"
                            title="Hapus"
                          >
                            <IconTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        size="lg"
        title={editing ? "Edit Konser" : "Tambah Konser Baru"}
        description="Lengkapi informasi konser. Kelas tiket dapat ditambahkan setelah konser dibuat."
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModalOpen(false)} disabled={saving}>
              Batal
            </button>
            <button type="submit" form="event-form" className="btn-primary" disabled={saving}>
              {saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Buat Konser"}
            </button>
          </>
        }
      >
        <form id="event-form" onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Judul Konser</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Contoh: Tulus: Manusia Tour 2026"
            />
            {formErrors.title && <p className="mt-1 text-xs text-rose-600">{formErrors.title}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Venue</label>
              <input
                className="input"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                placeholder="Istora Senayan"
              />
              {formErrors.venue && <p className="mt-1 text-xs text-rose-600">{formErrors.venue}</p>}
            </div>
            <div>
              <label className="label">Kota</label>
              <input
                className="input"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Jakarta"
              />
              {formErrors.city && <p className="mt-1 text-xs text-rose-600">{formErrors.city}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Tanggal & Jam</label>
              <input
                type="datetime-local"
                className="input"
                value={form.event_date}
                onChange={(e) => setForm({ ...form, event_date: e.target.value })}
              />
              {formErrors.event_date && <p className="mt-1 text-xs text-rose-600">{formErrors.event_date}</p>}
            </div>
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as "draft" | "published" })}
              >
                <option value="published">Publik (tampil di mobile)</option>
                <option value="draft">Draft (belum tampil)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">URL Poster</label>
            <input
              className="input"
              value={form.poster_url}
              onChange={(e) => setForm({ ...form, poster_url: e.target.value })}
              placeholder="https://images.unsplash.com/..."
            />
            {formErrors.poster_url && <p className="mt-1 text-xs text-rose-600">{formErrors.poster_url}</p>}
          </div>

          <div>
            <label className="label">Deskripsi</label>
            <textarea
              className="input min-h-[92px] resize-y"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Ceritakan konsep konser, line-up, dan informasi penting lainnya."
            />
          </div>

          <div>
            <label className="label">Line-up Artis</label>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 p-2">
              {artists.length === 0 && <p className="p-2 text-xs text-zinc-500">Belum ada artis terdaftar.</p>}
              {artists.map((artist) => {
                const checked = form.artist_ids.includes(artist.id);
                return (
                  <label
                    key={artist.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition ${
                      checked ? "bg-blue-50 text-blue-700" : "text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setForm({
                          ...form,
                          artist_ids: checked
                            ? form.artist_ids.filter((id) => id !== artist.id)
                            : [...form.artist_ids, artist.id],
                        })
                      }
                      className="h-4 w-4 accent-blue-600"
                    />
                    <span className="flex-1">{artist.name}</span>
                    <span className="text-[11px] text-zinc-500">{artist.genre}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Konser"
        message={`Yakin ingin menghapus "${deleteTarget?.title}"? Semua kelas tiket pada konser ini juga akan terhapus.`}
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <Modal
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        title={statusTarget?.sales_status === "open" ? "Tutup Penjualan Tiket" : "Buka Penjualan Tiket"}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setStatusTarget(null)}>
              Batal
            </button>
            <button
              className={statusTarget?.sales_status === "open" ? "btn-danger" : "btn-primary"}
              onClick={toggleSales}
            >
              {statusTarget?.sales_status === "open" ? "Ya, Tutup Penjualan" : "Ya, Buka Penjualan"}
            </button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-zinc-600">
          {statusTarget?.sales_status === "open" ? (
            <>
              Setelah ditutup, pelanggan tidak dapat lagi memesan tiket untuk{" "}
              <span className="font-semibold text-zinc-900">{statusTarget?.title}</span>. Pesanan yang sudah ada tetap
              diproses.
            </>
          ) : (
            <>
              Penjualan tiket untuk <span className="font-semibold text-zinc-900">{statusTarget?.title}</span> akan
              dibuka kembali dan pelanggan bisa memesan lagi.
            </>
          )}
        </p>
      </Modal>
    </div>
  );
}
