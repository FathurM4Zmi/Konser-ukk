"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { setSession } from "@/lib/auth";
import type { User } from "@/lib/types";
import { Alert } from "@/components/ui";
import { IconTicket } from "@/components/icons";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@konser.id");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch<{ data: { token: string; user: User } }>("/auth/login", {
        method: "POST",
        body: { email, password },
      });

      if (res.data.user.role !== "admin") {
        setError("Akun ini bukan admin. Gunakan akun admin untuk masuk ke panel web.");
        return;
      }

      setSession(res.data.token, res.data.user);
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal masuk. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panel kiri */}
      <div className="relative hidden overflow-hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1400&q=80"
          alt="Suasana konser"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0616]/95 via-[#0a0616]/70 to-violet-950/70" />

        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-xl shadow-violet-900/50">
              <IconTicket className="h-6 w-6 text-white" />
            </span>
            <div>
              <p className="text-lg font-bold text-white">Konseria</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Ticketing System</p>
            </div>
          </div>

          <div className="max-w-md">
            <h2 className="text-4xl font-extrabold leading-tight text-white">
              Kelola konser,
              <br />
              jual tiket,
              <br />
              <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                tanpa ribet.
              </span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Satu panel untuk mengatur jadwal konser, kelas tiket, kuota, pesanan pelanggan, hingga
              verifikasi pembayaran.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                { value: "4", label: "Konser aktif" },
                { value: "3.1K", label: "Tiket terjual" },
                { value: "99%", label: "Uptime" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xl font-bold text-white">{item.value}</p>
                  <p className="text-[11px] text-slate-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-slate-500" suppressHydrationWarning>
            © {new Date().getFullYear()} Konseria. Aplikasi Pemesanan Tiket Konser.
          </p>
        </div>
      </div>

      {/* Panel form */}
      <div className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
              <IconTicket className="h-5 w-5 text-white" />
            </span>
            <p className="text-lg font-bold text-white">Konseria</p>
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-400">
            Admin Panel
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Masuk ke akun Anda</h1>
          <p className="mt-2 text-sm text-slate-400">
            Gunakan akun administrator untuk mengelola penjualan tiket.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {error && <Alert type="error" message={error} onClose={() => setError("")} />}

            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="admin@konser.id"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Memeriksa..." : "Masuk"}
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Akun demo
            </p>
            <div className="mt-2 space-y-1 text-xs text-slate-400">
              <p>
                Admin &nbsp;·&nbsp; <span className="text-slate-200">admin@konser.id</span> /{" "}
                <span className="text-slate-200">admin123</span>
              </p>
              <p>
                Pelanggan &nbsp;·&nbsp; <span className="text-slate-200">budi@mail.com</span> /{" "}
                <span className="text-slate-200">customer123</span> (khusus mobile)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
