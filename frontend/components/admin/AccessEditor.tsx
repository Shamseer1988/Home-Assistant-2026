"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Globe, Loader2, Lock, Users } from "lucide-react";
import { type DashboardMeta, fetchUsers, updateDashboard } from "@/lib/admin";
import { Modal } from "@/components/ui/Modal";

const OPTIONS = [
  { value: "everyone", label: "Everyone", icon: Globe, hint: "Any signed-in user." },
  { value: "admins", label: "Admins only", icon: Lock, hint: "Hidden from regular users." },
  { value: "users", label: "Specific people", icon: Users, hint: "Only the people you pick." },
] as const;

export function AccessEditor({
  dashboard,
  run,
  onClose,
}: {
  dashboard: DashboardMeta;
  run: (fn: () => Promise<unknown>) => Promise<void>;
  onClose: () => void;
}) {
  const { data: users } = useQuery({ queryKey: ["admin", "users"], queryFn: fetchUsers });
  const [visibility, setVisibility] = useState(dashboard.visibility || "everyone");
  const [allowed, setAllowed] = useState<string[]>(dashboard.allowed_users || []);
  const [busy, setBusy] = useState(false);

  const toggleUser = (username: string) =>
    setAllowed((p) => (p.includes(username) ? p.filter((u) => u !== username) : [...p, username]));

  const save = async () => {
    setBusy(true);
    await run(() => updateDashboard(dashboard.id, { visibility, allowed_users: allowed }));
    setBusy(false);
    onClose();
  };

  return (
    <Modal
      title={`Who can see “${dashboard.name}”`}
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-sidra-blue to-sidra-sky py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save access
        </button>
      }
    >
      {dashboard.is_default ? (
        <p className="rounded-xl bg-fg/[0.04] px-4 py-3 text-sm text-muted">
          The home dashboard is always visible to everyone, so it can't be restricted.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            {OPTIONS.map((o) => {
              const active = visibility === o.value;
              const Icon = o.icon;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setVisibility(o.value)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                    active ? "border-sidra-sky/50 bg-sidra-sky/10" : "border-line/10 bg-fg/[0.03] hover:bg-fg/[0.06]"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-sidra-sky" : "text-muted"}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-fg">{o.label}</span>
                    <span className="block text-xs text-muted">{o.hint}</span>
                  </span>
                  {active && <Check className="h-4 w-4 text-sidra-sky" />}
                </button>
              );
            })}
          </div>

          {visibility === "users" && (
            <div className="rounded-xl border border-line/10 bg-fg/[0.02] p-2">
              <p className="px-1 pb-2 text-xs font-medium text-muted">People with access</p>
              <ul className="max-h-52 space-y-1 overflow-y-auto">
                {(users || []).map((u) => {
                  const on = u.role === "admin" || allowed.includes(u.username);
                  return (
                    <li key={u.id}>
                      <button
                        type="button"
                        disabled={u.role === "admin"}
                        onClick={() => toggleUser(u.username)}
                        className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                          u.role === "admin" ? "opacity-60" : "hover:bg-fg/[0.06]"
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                            on ? "border-sidra-sky bg-sidra-sky text-white" : "border-line/20"
                          }`}
                        >
                          {on && <Check className="h-3.5 w-3.5" />}
                        </span>
                        <span className="flex-1 truncate text-fg">{u.username}</span>
                        {u.role === "admin" && <span className="text-[10px] text-muted">admin · always</span>}
                      </button>
                    </li>
                  );
                })}
                {(users || []).length === 0 && (
                  <li className="px-2.5 py-2 text-xs text-muted">No users yet.</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
