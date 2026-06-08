import { API_URL } from "./api";

export interface User {
  id: number;
  username: string;
  email?: string | null;
  role: string;
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

/** Returns the current user, or null when not authenticated. */
export async function fetchMe(): Promise<User | null> {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    credentials: "include",
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`me -> ${res.status}`);
  return (await res.json()).user as User;
}
