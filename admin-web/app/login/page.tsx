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
    <div className="grid min-h-screen bg-white lg:grid-cols-2">
      {/* Panel kiri */}
      <div className="relative hidden overflow-hidden bg-zinc-900 lg:block">
        <img
          src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1400&q=80"
          alt="Suasana konser"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-zinc-950/70" />

        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-white">
              <IconTicket className="h-4 w-4 text-zinc-900" />
            </span>
            <p className="text-sm font-semibold tracking-tight text-white">Konseria</p>
          </div>

          <div className="max-w-md">
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white">
              Kelola konser dan penjualan tiket dalam satu panel.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-300">
              Atur jadwal konser, kelas tiket, kuota, pesanan pelanggan, hingga verifikasi pembayaran.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                { value: "4", label: "Konser aktif" },
                { value: "3.1K", label: "Tiket terjual" },
                { value: "99%", label: "Uptime" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-white/15 p-3">
                  <p className="text-lg font-semibold text-white">{item.value}</p>
                  <p className="text-[11px] text-zinc-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-zinc-400" suppressHydrationWarning>
            © {new Date().getFullYear()} Konseria. Aplikasi Pemesanan Tiket Konser.
          </p>
        </div>
      </div>

      {/* Panel form */}
      <div className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-zinc-900">
              <IconTicket className="h-4 w-4 text-white" />
            </span>
            <p className="text-sm font-semibold tracking-tight text-zinc-900">Konseria</p>
          </div>

          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Masuk ke akun Anda</h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Gunakan akun administrator untuk mengelola penjualan tiket.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
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

          <div className="mt-7 border-t border-zinc-200 pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Akun demo</p>
            <div className="mt-2 space-y-1 text-xs text-zinc-500">
              <p>
                Admin · <span className="font-medium text-zinc-700">admin@konser.id</span> /{" "}
                <span className="font-medium text-zinc-700">admin123</span>
              </p>
              <p>
                Pelanggan · <span className="font-medium text-zinc-700">budi@mail.com</span> /{" "}
                <span className="font-medium text-zinc-700">customer123</span> (khusus mobile)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
