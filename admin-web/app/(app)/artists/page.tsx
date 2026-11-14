"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import type { Artist } from "@/lib/types";
import { Alert, ConfirmDialog, EmptyState, Loading, Modal } from "@/components/ui";
import { IconEdit, IconMic, IconPlus, IconSearch, IconTrash } from "@/components/icons";

type FormState = { name: string; genre: string; photo_url: string; bio: string };

const emptyForm: FormState = { name: "", genre: "", photo_url: "", bio: "" };

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Artist | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Artist | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: Artist[] }>("/artists");
      setArtists(res.data);
    } catch (err) {
      setAlert({ type: "error", message: err instanceof ApiError ? err.message : "Gagal memuat artis." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return artists;
    return artists.filter((a) => a.name.toLowerCase().includes(q) || (a.genre || "").toLowerCase().includes(q));
  }, [artists, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (artist: Artist) => {
    setEditing(artist);
    setForm({
      name: artist.name,
      genre: artist.genre || "",
      photo_url: artist.photo_url || "",
      bio: artist.bio || "",
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
      genre: form.genre || null,
      photo_url: form.photo_url || null,
      bio: form.bio || null,
    };

    try {
      if (editing) {
        await apiFetch(`/artists/${editing.id}`, { method: "PUT", body: payload });
      } else {
        await apiFetch("/artists", { method: "POST", body: payload });
      }
      setModalOpen(false);
      setAlert({ type: "success", message: editing ? "Data artis diperbarui." : "Artis berhasil ditambahkan." });
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
      await apiFetch(`/artists/${deleteTarget.id}`, { method: "DELETE" });
      setAlert({ type: "success", message: "Artis berhasil dihapus." });
      setDeleteTarget(null);
      load();
    } catch (err) {
      setAlert({ type: "error", message: err instanceof ApiError ? err.message : "Gagal menghapus artis." });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
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
            placeholder="Cari nama artis atau genre..."
            className="input pl-10"
          />
        </div>
        <button onClick={openCreate} className="btn-primary shrink-0">
          <IconPlus className="h-4 w-4" /> Tambah Artis
        </button>
      </div>

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<IconMic />}
            title="Belum ada artis"
            description="Tambahkan penyanyi atau band yang tampil di konser Anda."
            action={
              <button onClick={openCreate} className="btn-primary">
                <IconPlus className="h-4 w-4" /> Tambah Artis
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((artist) => (
            <div key={artist.id} className="card group overflow-hidden">
              <div className="relative h-40 overflow-hidden bg-zinc-100">
                {artist.photo_url ? (
                  <img
                    src={artist.photo_url}
                    alt={artist.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="grid h-full place-items-center">
                    <span className="text-4xl font-semibold text-zinc-400">{artist.name.charAt(0)}</span>
                  </div>
                )}
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => openEdit(artist)}
                    className="rounded-lg bg-white/90 p-2 text-zinc-600 shadow-sm transition hover:text-blue-600"
                  >
                    <IconEdit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(artist)}
                    className="rounded-lg bg-white/90 p-2 text-zinc-600 shadow-sm transition hover:text-rose-600"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{artist.name}</p>
                    <p className="text-[11px] text-blue-600">{artist.genre || "Tanpa genre"}</p>
                  </div>
                  <span className="badge bg-zinc-100 text-zinc-600 ring-zinc-200">
                    {artist.total_event || 0} konser
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-zinc-500">
                  {artist.bio || "Belum ada bio."}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Artis" : "Tambah Artis"}
        description="Data artis dipakai sebagai line-up pada konser."
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModalOpen(false)} disabled={saving}>
              Batal
            </button>
            <button type="submit" form="artist-form" className="btn-primary" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </>
        }
      >
        <form id="artist-form" onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Nama Artis / Band</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: Tulus"
            />
            {formErrors.name && <p className="mt-1 text-xs text-rose-600">{formErrors.name}</p>}
          </div>

          <div>
            <label className="label">Genre</label>
            <input
              className="input"
              value={form.genre}
              onChange={(e) => setForm({ ...form, genre: e.target.value })}
              placeholder="Pop / Indie / Rock"
            />
            {formErrors.genre && <p className="mt-1 text-xs text-rose-600">{formErrors.genre}</p>}
          </div>

          <div>
            <label className="label">URL Foto</label>
            <input
              className="input"
              value={form.photo_url}
              onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
              placeholder="https://..."
            />
            {formErrors.photo_url && <p className="mt-1 text-xs text-rose-600">{formErrors.photo_url}</p>}
          </div>

          <div>
            <label className="label">Bio Singkat</label>
            <textarea
              className="input min-h-[90px] resize-y"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Deskripsi singkat tentang artis."
            />
            {formErrors.bio && <p className="mt-1 text-xs text-rose-600">{formErrors.bio}</p>}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Artis"
        message={`Hapus "${deleteTarget?.name}"? Artis akan dihapus dari semua line-up konser.`}
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
