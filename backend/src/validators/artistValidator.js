import { body } from "express-validator";

export const artistRules = [
  body("name").trim().notEmpty().withMessage("Nama artis wajib diisi.").isLength({ max: 150 }).withMessage("Nama maksimal 150 karakter."),
  body("genre").optional({ values: "falsy" }).isLength({ max: 80 }).withMessage("Genre maksimal 80 karakter."),
  body("photo_url").optional({ values: "falsy" }).isURL({ require_protocol: true }).withMessage("URL foto tidak valid."),
  body("bio").optional({ values: "falsy" }).isLength({ max: 5000 }).withMessage("Bio terlalu panjang."),
];
