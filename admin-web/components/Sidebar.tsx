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
      {open && <div className="fixed inset-0 z-30 bg-zinc-950/30 lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-zinc-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-4">
          <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
            <span className="grid h-8 w-8 place-items-center rounded-md bg-zinc-900">
              <IconTicket className="h-4 w-4 text-white" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-zinc-900">Konseria</span>
          </Link>
          <button onClick={onClose} className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 lg:hidden">
            <IconX />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          <p className="px-2.5 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Menu
          </p>
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition ${
                  active
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-zinc-900" : "text-zinc-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-200 p-3">
          <div className="flex items-center gap-2.5 px-1 py-1">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700">
              {(user?.name || "A").charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-zinc-900">{user?.name || "Admin"}</p>
              <p className="truncate text-[11px] text-zinc-500">{user?.email || "admin@konser.id"}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-2 flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[13px] font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900"
          >
            <IconLogout className="h-4 w-4 text-zinc-400" /> Keluar
          </button>
        </div>
      </aside>
    </>
  );
}
