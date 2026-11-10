import bcrypt from "bcryptjs";
import pool from "../config/db.js";
import { asyncHandler, HttpError } from "../utils/http.js";
import { signToken } from "../middleware/auth.js";

const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  created_at: u.created_at,
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const [existing] = await pool.query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
  if (existing.length) throw new HttpError(409, "Email sudah terdaftar, silakan login.");

  const hash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    "INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, 'customer')",
    [name.trim(), email.toLowerCase().trim(), hash, phone || null]
  );

  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [result.insertId]);
  const user = rows[0];

  res.status(201).json({
    success: true,
    message: "Registrasi berhasil. Selamat datang!",
    data: { token: signToken(user), user: publicUser(user) },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await pool.query("SELECT * FROM users WHERE email = ? LIMIT 1", [
    email.toLowerCase().trim(),
  ]);
  const user = rows[0];

  if (!user) throw new HttpError(401, "Email atau password salah.");
  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new HttpError(401, "Email atau password salah.");

  res.json({
    success: true,
    message: `Halo, ${user.name}!`,
    data: { token: signToken(user), user: publicUser(user) },
  });
});

export const me = asyncHandler(async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ? LIMIT 1", [req.user.id]);
  if (!rows.length) throw new HttpError(404, "Pengguna tidak ditemukan.");
  res.json({ success: true, data: publicUser(rows[0]) });
});
