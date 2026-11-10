import { body } from "express-validator";

export const registerRules = [
  body("name").trim().notEmpty().withMessage("Nama wajib diisi.").isLength({ max: 100 }).withMessage("Nama maksimal 100 karakter."),
  body("email").trim().notEmpty().withMessage("Email wajib diisi.").isEmail().withMessage("Format email tidak valid.").normalizeEmail(),
  body("password").notEmpty().withMessage("Password wajib diisi.").isLength({ min: 6 }).withMessage("Password minimal 6 karakter."),
  body("phone").optional({ values: "falsy" }).isLength({ min: 8, max: 20 }).withMessage("Nomor telepon 8-20 digit."),
];

export const loginRules = [
  body("email").trim().notEmpty().withMessage("Email wajib diisi.").isEmail().withMessage("Format email tidak valid.").normalizeEmail(),
  body("password").notEmpty().withMessage("Password wajib diisi."),
];
