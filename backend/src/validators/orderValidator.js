import { body } from "express-validator";

export const createOrderRules = [
  body("event_id").notEmpty().withMessage("Konser wajib dipilih.").isInt({ min: 1 }).withMessage("ID konser tidak valid."),
  body("items").isArray({ min: 1 }).withMessage("Pilih minimal satu kelas tiket."),
  body("items.*.ticket_category_id").notEmpty().withMessage("Kelas tiket wajib dipilih.").isInt({ min: 1 }).withMessage("ID kelas tiket tidak valid."),
  body("items.*.quantity").notEmpty().withMessage("Jumlah tiket wajib diisi.").isInt({ min: 1, max: 10 }).withMessage("Jumlah tiket 1-10 per kelas."),
  body("payment_method").optional({ values: "falsy" }).isLength({ max: 50 }).withMessage("Metode pembayaran maksimal 50 karakter."),
  body("note").optional({ values: "falsy" }).isLength({ max: 1000 }).withMessage("Catatan terlalu panjang."),
];

export const verifyOrderRules = [
  body("action").notEmpty().withMessage("Aksi wajib diisi.").isIn(["approve", "reject"]).withMessage("Aksi harus approve atau reject."),
  body("note").optional({ values: "falsy" }).isLength({ max: 1000 }).withMessage("Catatan terlalu panjang."),
];
