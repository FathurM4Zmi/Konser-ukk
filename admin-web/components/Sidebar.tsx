"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearSession, getUser } from "@/lib/auth";
import type { User } from "@/lib/types";
import {
  IconCalendar,
  IconDashboard,
  IconLogout,
  IconMic,
  IconReceipt,
  IconTicket,
  IconX,
} from "./icons";

const navItems = [
  { href: "/", label: "Dashboard", icon: IconDashboard },
  { href: "/events", label: "Konser & Tiket", icon: IconCalendar },
  { href: "/artists", label: "Artis", icon: IconMic },
  { href: "/orders", label: "Pesanan", icon: IconReceipt },
];

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  // Cookie hanya tersedia di browser; render setelah mount agar tidak hydration mismatch.
  useEffect(() => {
    setUser(getUser());
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const logout = () => {
    clearSession();
    router.replace("/login");
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-white/10 bg-[#08080f]/95 px-4 py-6 transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-2">
          <Link href="/" className="flex items-center gap-3" onClick={onClose}>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-900/40">
              <IconTicket className="h-5 w-5 text-white" />
            </span>
            <span>
              <span className="block text-[15px] font-bold leading-tight text-white">Konseria</span>
              <span className="block text-[11px] font-medium uppercase tracking-widest text-slate-500">
                Admin Panel
              </span>
            </span>
          </Link>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 lg:hidden">
            <IconX />
          </button>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Menu Utama
          </p>
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-gradient-to-r from-violet-500/20 to-transparent text-white"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-violet-400 to-fuchsia-400" />
                )}
                <Icon className={`h-[18px] w-[18px] ${active ? "text-violet-300" : "text-slate-500 group-hover:text-slate-300"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-500/70 to-fuchsia-500/70 text-sm font-bold text-white">
              {(user?.name || "A").charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-white">{user?.name || "Admin"}</p>
              <p className="truncate text-[11px] text-slate-500">{user?.email || "admin@konser.id"}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-2 text-xs font-semibold text-slate-300 transition hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-300"
          >
            <IconLogout className="h-4 w-4" /> Keluar
          </button>
        </div>
      </aside>
    </>
  );
}
