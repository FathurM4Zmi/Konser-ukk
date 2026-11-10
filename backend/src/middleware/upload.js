import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import { HttpError } from "../utils/http.js";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(import.meta.dirname, "../../uploads")),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`);
  },
});

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

export const uploadImage = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) {
      return cb(new HttpError(422, "File harus berupa gambar (JPG, PNG, atau WEBP)."));
    }
    cb(null, true);
  },
});
