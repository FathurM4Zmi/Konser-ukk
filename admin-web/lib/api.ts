import { clearSession, getToken } from "./auth";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
export const ASSET_URL = API_URL.replace(/\/api\/?$/, "");

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string>;

  constructor(message: string, status: number, errors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

type Options = Omit<RequestInit, "body"> & { body?: unknown };

export async function apiFetch<T>(path: string, options: Options = {}): Promise<T> {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      body: isFormData ? (options.body as FormData) : options.body ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Tidak dapat terhubung ke server API. Pastikan backend berjalan di port 4000.", 0);
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      clearSession();
      if (!window.location.pathname.startsWith("/login")) window.location.href = "/login";
    }
    throw new ApiError(data.message || "Terjadi kesalahan.", res.status, data.errors);
  }

  return data as T;
}

/** URL lengkap untuk file upload (bukti pembayaran). */
export const assetUrl = (path?: string | null) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${ASSET_URL}${path}`;
};

/* ------------------------- Realtime dashboard ------------------------- */

export type LiveStatus = "connecting" | "live" | "offline";

/**
 * Berlangganan snapshot dashboard lewat SSE.
 * Memakai fetch + ReadableStream (bukan EventSource) supaya header
 * Authorization tetap bisa dikirim.
 * Mengembalikan fungsi untuk berhenti berlangganan.
 */
export function openDashboardStream(
  onSnapshot: (data: Record<string, unknown> & { server_time?: string }) => void,
  onStatus?: (status: LiveStatus) => void
) {
  const controller = new AbortController();
  let stopped = false;
  let retry: ReturnType<typeof setTimeout> | null = null;

  const connect = async () => {
    if (stopped) return;
    onStatus?.("connecting");

    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/dashboard/stream`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal,
        cache: "no-store",
      });

      if (!res.ok || !res.body) throw new Error("stream gagal");
      onStatus?.("live");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (!stopped) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() || "";

        for (const chunk of chunks) {
          const line = chunk.split("\n").find((row) => row.startsWith("data:"));
          if (!line) continue;
          try {
            onSnapshot(JSON.parse(line.slice(5).trim()));
          } catch {
            // Abaikan potongan data yang belum lengkap.
          }
        }
      }
    } catch {
      // Jaringan putus / server restart: coba lagi di bawah.
    }

    if (stopped) return;
    onStatus?.("offline");
    retry = setTimeout(connect, 5000);
  };

  connect();

  return () => {
    stopped = true;
    controller.abort();
    if (retry) clearTimeout(retry);
  };
}
