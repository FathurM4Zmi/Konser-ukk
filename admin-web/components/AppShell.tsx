"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { IconMenu } from "./icons";

const titles: { match: (p: string) => boolean; title: string; subtitle: string }[] = [
  { match: (p) => p === "/", title: "Dashboard", subtitle: "Ringkasan penjualan tiket konser" },
  { match: (p) => p.startsWith("/events/"), title: "Detail Konser", subtitle: "Kelola informasi konser dan kelas tiket" },
  { match: (p) => p.startsWith("/events"), title: "Konser", subtitle: "Daftar konser dan kuota tiket" },
  { match: (p) => p.startsWith("/artists"), title: "Artis", subtitle: "Data penyanyi dan musisi" },
  { match: (p) => p.startsWith("/orders/"), title: "Detail Pesanan", subtitle: "Verifikasi pembayaran pelanggan" },
  { match: (p) => p.startsWith("/orders"), title: "Pesanan", subtitle: "Daftar pesanan tiket pelanggan" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [today, setToday] = useState("");
  const meta = titles.find((t) => t.match(pathname)) || titles[0];

  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
  }, []);

  return (
    <div className="min-h-screen">
      <Sidebar open={open} onClose={() => setOpen(false)} />

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setOpen(true)}
              className="rounded-md border border-zinc-300 p-1.5 text-zinc-600 hover:bg-zinc-50 lg:hidden"
            >
              <IconMenu />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[15px] font-semibold text-zinc-900">{meta.title}</h1>
              <p className="truncate text-xs text-zinc-500">{meta.subtitle}</p>
            </div>

            <p className="hidden text-xs text-zinc-500 md:block">{today}</p>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
