import { body } from "express-validator";

export const categoryRules = [
  body("name").trim().notEmpty().withMessage("Nama kelas tiket wajib diisi.").isLength({ max: 80 }).withMessage("Nama maksimal 80 karakter."),
  body("price").notEmpty().withMessage("Harga wajib diisi.").isFloat({ min: 0 }).withMessage("Harga harus angka dan tidak boleh negatif."),
  body("quota").notEmpty().withMessage("Kuota wajib diisi.").isInt({ min: 1 }).withMessage("Kuota minimal 1 tiket."),
  body("description").optional({ values: "falsy" }).isLength({ max: 255 }).withMessage("Deskripsi maksimal 255 karakter."),
];
