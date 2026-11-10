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

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#06060b]/80 backdrop-blur-xl">
          <div className="flex items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/5 lg:hidden"
            >
              <IconMenu />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-bold text-white sm:text-xl">{meta.title}</h1>
              <p className="truncate text-xs text-slate-500">{meta.subtitle}</p>
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs text-slate-400 md:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {today}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
