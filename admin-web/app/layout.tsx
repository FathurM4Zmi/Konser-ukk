import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Konseria Admin — Manajemen Tiket Konser",
  description: "Panel admin untuk mengelola konser, artis, tiket, pesanan, dan verifikasi pembayaran.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
