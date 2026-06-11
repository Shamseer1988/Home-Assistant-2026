import { API_URL } from "./api";

export interface User {
  id: number;
  username: string;
  email?: string | null;
  role: string;
  landing_slug?: string | null;
}

export async function login(
  username: string,
  password: string
): Promise<User> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Login failed");
  }
  return (await res.json()).user as User;
}

export async function logout(): Promise<void> {
  await fetch(`${API_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}

/** Set (or clear, with null) the user's preferred landing dashboard. */
export async function setLanding(slug: string | null): Promise<User> {
  const res = await fetch(`${API_URL}/api/auth/landing`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ slug }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not save start page");
  }
  return (await res.json()).user as User;
}

/** Returns the current user, or null when not authenticated. */
export async function fetchMe(): Promise<User | null> {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    credentials: "include",
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`me -> ${res.status}`);
  return (await res.json()).user as User;
}
