/**
 * Normalisasi tanggal dari ISO string / datetime-local menjadi format MySQL DATETIME.
 * Contoh: "2026-12-05T19:30" atau "2026-12-05T12:30:00.000Z" -> "2026-12-05 19:30:00"
 */
export const toMysqlDateTime = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
};
