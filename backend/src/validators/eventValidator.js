import { body } from "express-validator";

export const eventRules = [
  body("title").trim().notEmpty().withMessage("Judul konser wajib diisi.").isLength({ max: 200 }).withMessage("Judul maksimal 200 karakter."),
  body("venue").trim().notEmpty().withMessage("Lokasi/venue wajib diisi.").isLength({ max: 150 }).withMessage("Venue maksimal 150 karakter."),
  body("city").trim().notEmpty().withMessage("Kota wajib diisi.").isLength({ max: 100 }).withMessage("Kota maksimal 100 karakter."),
  body("event_date").notEmpty().withMessage("Tanggal konser wajib diisi.").isISO8601().withMessage("Format tanggal tidak valid."),
  body("poster_url").optional({ values: "falsy" }).isURL({ require_protocol: true }).withMessage("URL poster tidak valid."),
  body("status").optional().isIn(["draft", "published"]).withMessage("Status konser tidak valid."),
  body("artist_ids").optional().isArray().withMessage("Daftar artis tidak valid."),
  body("artist_ids.*").optional().isInt({ min: 1 }).withMessage("ID artis tidak valid."),
];

export const salesStatusRules = [
  body("sales_status").notEmpty().withMessage("Status penjualan wajib diisi.").isIn(["open", "closed"]).withMessage("Status penjualan tidak valid."),
];
