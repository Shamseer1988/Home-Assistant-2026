import type { Health } from "./types";

// Baked at build time (see Dockerfile build arg / .env PUBLIC_API_URL).
// The browser uses this to reach the Flask backend + Socket.IO.
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
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
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`service ${domain}.${service} -> ${res.status}`);
  return res.json();
}

export type { Health };
