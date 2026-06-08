import type { ForecastItem, Health, HistorySeries } from "./types";

// Baked at build time (see Dockerfile build arg / .env PUBLIC_API_URL).
// The browser uses this to reach the Flask backend + Socket.IO.
//   - empty string  -> same-origin (behind the reverse proxy, requests go to /api)
//   - absolute URL  -> direct to the backend (simple/dev setup)
// `??` (not `||`) so an explicit empty string stays empty.
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export async function apiGet<T>(path: string): Promise<T> {
  // credentials: include so the httpOnly JWT cookie travels cross-origin.
  const res = await fetch(`${API_URL}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const e = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(e.error || `POST ${path} -> ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function callService(
  domain: string,
  service: string,
  data: Record<string, unknown>
): Promise<unknown> {
  const res = await fetch(`${API_URL}/api/ha/services/${domain}/${service}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`service ${domain}.${service} -> ${res.status}`);
  return res.json();
}

export const fetchHistory = (entityId: string, hours = 24) =>
  apiGet<HistorySeries>(`/api/ha/history/${entityId}?hours=${hours}`);

export const cameraUrl = (entityId: string) =>
  `${API_URL}/api/ha/camera/${entityId}`;

export const fetchForecast = (entityId: string, type = "daily") =>
  apiGet<{ entity_id: string; forecast: ForecastItem[] }>(
    `/api/ha/forecast/${entityId}?type=${type}`
  );

export type { Health };
