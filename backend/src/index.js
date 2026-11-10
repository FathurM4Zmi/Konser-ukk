import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "node:path";
import multer from "multer";

import authRoutes from "./routes/auth.js";
import artistRoutes from "./routes/artists.js";
import eventRoutes from "./routes/events.js";
import orderRoutes from "./routes/orders.js";
import adminOrderRoutes from "./routes/adminOrders.js";
import dashboardRoutes from "./routes/dashboard.js";
import { HttpError } from "./utils/http.js";

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// file upload (bukti pembayaran)
app.use("/uploads", express.static(path.join(import.meta.dirname, "../uploads")));

app.get("/api/health", (_req, res) =>
  res.json({ success: true, message: "API Tiket Konser berjalan.", time: new Date().toISOString() })
);

app.use("/api/auth", authRoutes);
app.use("/api/artists", artistRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((req, _res, next) => {
  next(new HttpError(404, `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`));
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "Ukuran file maksimal 3 MB." : "Gagal mengunggah file.";
    return res.status(422).json({ success: false, message, errors: { payment_proof: message } });
  }

  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ success: false, message: "Data sudah ada (duplikat)." });
  }
  if (err.code === "ER_ROW_IS_REFERENCED_2" || err.code === "ER_ROW_IS_REFERENCED") {
    return res.status(409).json({ success: false, message: "Data masih dipakai pada tabel lain." });
  }

  const status = err.status || 500;
  if (status >= 500) console.error(err);

  res.status(status).json({
    success: false,
    message: status >= 500 ? "Terjadi kesalahan pada server." : err.message,
    errors: err.details || undefined,
  });
});

app.listen(PORT, () => {
  console.log(`API Tiket Konser siap di http://localhost:${PORT}`);
});
