"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Boxes,
  DownloadCloud,
  LayoutDashboard,
  Loader2,
  LogOut,
  Rows3,
  Users,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import { importDashboard, type ImportResult } from "@/lib/dashboard";
import { useAuth } from "@/lib/useAuth";
import { Card } from "@/components/ui/Card";

interface Overview {
  users: number;
  entities: number;
  sections: number;
  items: number;
  ha_connected: boolean;
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Boxes;
  value: number | string;
  label: string;
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
        <Icon className="h-5 w-5 text-sidra-sky" />
      </span>
      <div>
        <p className="text-lg font-bold text-white">{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </Card>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user, logout } = useAuth();

  const { data } = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => apiGet<Overview>("/api/admin/overview"),
  });

  const importMutation = useMutation<ImportResult>({
    mutationFn: importDashboard,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "overview"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const onLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Admin</p>
          <h1 className="text-2xl font-bold text-white">
            Welcome, {user?.username}
          </h1>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300 transition hover:bg-white/[0.08]"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Boxes} value={data?.entities ?? "—"} label="HA entities" />
        <StatCard icon={LayoutDashboard} value={data?.sections ?? "—"} label="Rooms" />
        <StatCard icon={Rows3} value={data?.items ?? "—"} label="Tiles" />
        <StatCard icon={Users} value={data?.users ?? "—"} label="Admins" />
      </div>

      <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sidra-blue to-sidra-sky">
            <DownloadCloud className="h-5 w-5 text-white" />
          </span>
          <div>
            <h2 className="font-semibold text-white">Sync rooms from Home Assistant</h2>
            <p className="mt-1 max-w-prose text-sm text-slate-400">
              Rebuilds the dashboard from your HA areas — one room per area, with
              its lights, switches, fans, climate and sensors. Disabled, hidden,
              and diagnostic entities are skipped.
            </p>
          </div>
        </div>
        <button
          onClick={() => importMutation.mutate()}
          disabled={importMutation.isPending || !data?.ha_connected}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-sidra-blue to-sidra-sky px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {importMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {data?.ha_connected ? "Sync now" : "HA offline"}
        </button>
      </Card>

      {importMutation.isSuccess && (
        <p className="rounded-xl bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
          Imported {importMutation.data.sections} rooms and{" "}
          {importMutation.data.items} tiles. The dashboard is updated.
        </p>
      )}
      {importMutation.isError && (
        <p className="rounded-xl bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">
          {(importMutation.error as Error).message}
        </p>
      )}

      <Card className="flex items-start gap-4 p-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/5">
          <LayoutDashboard className="h-5 w-5 text-sidra-sky" />
        </span>
        <div>
          <h2 className="font-semibold text-white">Dashboard builder</h2>
          <p className="mt-1 max-w-prose text-sm text-slate-400">
            Coming in Phase 4: add and reorder rooms, drop entities into rooms,
            and override names, icons and visibility — all from here. The import
            above gives you the starting layout to refine.
          </p>
        </div>
      </Card>
    </div>
  );
}
