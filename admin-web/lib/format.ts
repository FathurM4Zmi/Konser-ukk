export const rupiah = (value: number | string | null | undefined) => {
  const number = Number(value || 0);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(number);
};

export const compactRupiah = (value: number) => {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1).replace(".0", "")} M`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1).replace(".0", "")} jt`;
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)} rb`;
  return rupiah(value);
};

export const formatDate = (value?: string | null, withTime = false) => {
  if (!value) return "-";
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
};

export const formatDateTime = (value?: string | null) => formatDate(value, true);

/** Format untuk input datetime-local */
export const toInputDateTime = (value?: string | null) => {
  if (!value) return "";
  return value.replace(" ", "T").slice(0, 16);
};

export const percent = (sold: number, quota: number) =>
  quota > 0 ? Math.min(Math.round((sold / quota) * 100), 100) : 0;

export const statusLabel: Record<string, { text: string; className: string }> = {
  pending: { text: "Belum bayar", className: "bg-amber-400/10 text-amber-300 ring-amber-400/30" },
  waiting_verification: {
    text: "Menunggu verifikasi",
    className: "bg-sky-400/10 text-sky-300 ring-sky-400/30",
  },
  paid: { text: "Lunas", className: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30" },
  rejected: { text: "Ditolak", className: "bg-rose-400/10 text-rose-300 ring-rose-400/30" },
  cancelled: { text: "Dibatalkan", className: "bg-slate-400/10 text-slate-300 ring-slate-400/30" },
};
