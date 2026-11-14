"use client";

import { useEffect } from "react";
import { IconAlert, IconCheck, IconX } from "./icons";

/* ------------------------------- Modal ------------------------------- */

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-950/40 p-4 sm:items-center">
      <div
        className={`my-8 w-full ${size === "lg" ? "max-w-3xl" : "max-w-xl"} rounded-xl border border-zinc-200 bg-white shadow-xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
            {description && <p className="mt-1 text-xs text-zinc-500">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="-mr-1 rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Tutup"
          >
            <IconX />
          </button>
        </div>

        <div className="px-5 py-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-zinc-200 bg-zinc-50/70 px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- Alert ------------------------------- */

export function Alert({
  type,
  message,
  onClose,
}: {
  type: "success" | "error";
  message: string;
  onClose?: () => void;
}) {
  const isError = type === "error";
  return (
    <div
      className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm ${
        isError
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      {isError ? <IconAlert className="mt-0.5 h-4 w-4 shrink-0" /> : <IconCheck className="mt-0.5 h-4 w-4 shrink-0" />}
      <p className="flex-1">{message}</p>
      {onClose && (
        <button onClick={onClose} className="shrink-0 opacity-60 transition hover:opacity-100">
          <IconX className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/* ---------------------------- Confirm ------------------------------- */

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Hapus",
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} disabled={loading}>
            Batal
          </button>
          <button className="btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Memproses..." : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-zinc-600">{message}</p>
    </Modal>
  );
}

/* --------------------------- Empty state ---------------------------- */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="grid h-10 w-10 place-items-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-400">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-800">{title}</p>
        {description && <p className="mt-1 text-xs text-zinc-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/* ----------------------------- Progress ----------------------------- */

export function Progress({ value, className = "" }: { value: number; className?: string }) {
  const safe = Math.max(0, Math.min(value, 100));
  const color = safe >= 90 ? "bg-rose-500" : safe >= 60 ? "bg-amber-500" : "bg-blue-600";

  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 ${className}`}>
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${safe}%` }} />
    </div>
  );
}

/* ----------------------------- Spinner ------------------------------ */

export function Loading({ label = "Memuat data..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-zinc-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-600" />
      {label}
    </div>
  );
}
