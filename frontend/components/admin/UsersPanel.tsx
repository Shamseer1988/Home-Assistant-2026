"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ShieldCheck, User as UserIcon, UsersRound } from "lucide-react";
import { type AppUser, fetchUsers, updateUserRole } from "@/lib/admin";
import { useAuth } from "@/lib/useAuth";
import { Card } from "@/components/ui/Card";

export function UsersPanel() {
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const { data: users } = useQuery({ queryKey: ["admin", "users"], queryFn: fetchUsers });
  const [error, setError] = useState<string | null>(null);

  const setRole = async (u: AppUser, role: string) => {
    setError(null);
    try {
      await updateUserRole(u.id, role);
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update role");
    }
  };

  return (
    <Card className="space-y-3 p-5">
      <div className="flex items-center gap-2">
        <UsersRound className="h-4 w-4 text-sidra-sky" />
        <h2 className="font-semibold text-fg">People</h2>
      </div>
      <p className="text-sm text-muted">
        Admins manage everything. Regular users only see dashboards shared with them. Roles update
        the next time the person signs in.
      </p>

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <ul className="space-y-1.5">
        {(users || []).map((u) => {
          const isMe = me?.id === u.id;
          const admin = u.role === "admin";
          return (
            <li
              key={u.id}
              className="flex items-center gap-2 rounded-xl border border-line/10 bg-fg/[0.03] px-3 py-2"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-fg/5">
                {admin ? (
                  <ShieldCheck className="h-4 w-4 text-amber-400" />
                ) : (
                  <UserIcon className="h-4 w-4 text-muted" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-fg">
                  {u.username}
                  {isMe && <span className="ml-1 text-[11px] text-muted">(you)</span>}
                </span>
                {u.email && <span className="block truncate text-xs text-muted">{u.email}</span>}
              </span>
              <div className="flex rounded-lg border border-line/10 bg-fg/5 p-0.5 text-xs">
                {["admin", "user"].map((role) => (
                  <button
                    key={role}
                    type="button"
                    disabled={isMe}
                    onClick={() => u.role !== role && setRole(u, role)}
                    className={`rounded-md px-2.5 py-1 font-medium capitalize transition ${
                      u.role === role ? "bg-sidra-sky text-white" : "text-muted hover:text-fg"
                    } ${isMe ? "cursor-not-allowed opacity-60" : ""}`}
                    title={isMe ? "You can't change your own role" : `Make ${role}`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
        {(users || []).length === 0 && (
          <li className="rounded-xl border border-line/10 bg-fg/[0.03] px-3 py-4 text-center text-sm text-muted">
            No users yet.
          </li>
        )}
      </ul>
    </Card>
  );
}
