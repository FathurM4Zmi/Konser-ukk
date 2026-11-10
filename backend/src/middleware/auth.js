import jwt from "jsonwebtoken";
import { HttpError } from "../utils/http.js";

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

/** Wajib login (web admin maupun mobile). */
export const requireAuth = (req, _res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return next(new HttpError(401, "Token tidak ditemukan, silakan login."));

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    next(new HttpError(401, "Sesi tidak valid atau sudah kedaluwarsa."));
  }
};

/** Khusus admin (web). */
export const requireAdmin = (req, _res, next) => {
  if (!req.user) return next(new HttpError(401, "Silakan login terlebih dahulu."));
  if (req.user.role !== "admin") return next(new HttpError(403, "Akses ditolak. Halaman ini khusus admin."));
  next();
};
