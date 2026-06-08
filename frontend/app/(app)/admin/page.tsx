"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { LogOut, Users, Boxes, LayoutDashboard } from "lucide-react";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { Card } from "@/components/ui/Card";

interface Overview {
  users: number;
  entities: number;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data } = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => apiGet<Overview>("/api/admin/overview"),
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
            <Boxes className="h-5 w-5 text-sidra-sky" />
          </span>
          <div>
            <p className="text-lg font-bold text-white">{data?.entities ?? "—"}</p>
            <p className="text-xs text-slate-400">HA entities</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
            <Users className="h-5 w-5 text-sidra-sky" />
          </span>
          <div>
            <p className="text-lg font-bold text-white">{data?.users ?? "—"}</p>
            <p className="text-xs text-slate-400">Admin users</p>
          </div>
        </Card>
      </div>

      <Card className="flex items-start gap-4 p-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sidra-blue to-sidra-sky">
          <LayoutDashboard className="h-5 w-5 text-white" />
        </span>
        <div>
          <h2 className="font-semibold text-white">Dashboard builder</h2>
          <p className="mt-1 max-w-prose text-sm text-slate-400">
            Coming in Phase 3 &amp; 4: import your Home Assistant rooms, add and
            reorder sections, place entities into rooms, and override names and
            icons — all from here, no YAML. This page is the secured entry point
            those tools will plug into.
          </p>
        </div>
      </Card>
    </div>
  );
}
