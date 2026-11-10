import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const {
  DB_HOST = "127.0.0.1",
  DB_PORT = "3306",
  DB_USER = "root",
  DB_PASSWORD = "",
  DB_NAME = "konser_tiket",
} = process.env;

async function main() {
  console.log(`Menghubungkan ke MySQL ${DB_USER}@${DB_HOST}:${DB_PORT} ...`);

  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  });

  const schema = await fs.readFile(path.join(import.meta.dirname, "schema.sql"), "utf8");
  const seed = await fs.readFile(path.join(import.meta.dirname, "seed.sql"), "utf8");

  console.log("Membuat ulang database & tabel ...");
  await conn.query(schema);

  console.log("Mengisi data demo ...");
  await conn.query(seed);

  await conn.end();
  console.log(`\nSelesai. Database "${DB_NAME}" siap dipakai.`);
  console.log("Login admin    : admin@konser.id / admin123");
  console.log("Login customer : budi@mail.com / customer123");
}

main().catch((err) => {
  console.error("\nGagal setup database:", err.message);
  console.error("Pastikan MySQL (XAMPP/Laragon) sudah berjalan dan kredensial di .env benar.");
  process.exit(1);
});
