import crypto from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const randomToken = (length) => {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
};

/** ORD-YYYYMMDD-XXXXXX */
export const generateOrderCode = () => {
  const now = new Date();
  const ymd = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  return `ORD-${ymd}-${randomToken(6)}`;
};

/** Kode unik tiket yang dipakai sebagai isi QR Code. */
export const generateTicketCode = () => {
  const year = String(new Date().getFullYear()).slice(-2);
  return `TKT-${year}${randomToken(2)}-${randomToken(6)}`;
};
