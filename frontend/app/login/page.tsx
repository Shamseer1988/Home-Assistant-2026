"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { useAuth } from "@/lib/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { login, loggingIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const u = await login({ username, password });
      router.replace(u?.landing_slug ? `/d/${u.landing_slug}` : "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl border border-line/10 bg-fg/[0.04] p-8 shadow-glass backdrop-blur-xl">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sidra-blue to-sidra-sky shadow-glow">
            <Lock className="h-6 w-6 text-white" />
          </span>
          <div>
            <h1 className="bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-2xl font-black tracking-[0.2em] text-transparent">
              SIDRA
            </h1>
            <p className="mt-1 text-sm text-muted">
              Sign in with your Home Assistant account
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Username
            </label>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-line/10 bg-fg/5 px-4 py-2.5 text-sm text-fg outline-none transition focus:border-sidra-sky/60"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-line/10 bg-fg/5 px-4 py-2.5 text-sm text-fg outline-none transition focus:border-sidra-sky/60"
              required
            />
          </div>

          {error && (
            <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loggingIn}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-sidra-blue to-sidra-sky py-2.5 text-sm font-semibold text-fg transition hover:opacity-90 disabled:opacity-60"
          >
            {loggingIn && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
