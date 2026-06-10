"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, Pencil } from "lucide-react";
import { apiGet } from "@/lib/api";
import { fetchDashboardBySlug } from "@/lib/dashboards";
import { useAuth } from "@/lib/useAuth";
import type { HAEntity } from "@/lib/types";
import { useEntityStore } from "@/store/entities";
import { RoomSection } from "@/components/cards/RoomSection";
import { EditableDashboard } from "@/components/dashboard/EditableDashboard";
import { Empty } from "@/components/special/common";

export default function DashboardSlugPage() {
  const params = useParams();
  const slug = String(params.slug);
  const { user } = useAuth();
  const [edit, setEdit] = useState(false);
  const [activeView, setActiveView] = useState<number | null>(null);

  const setSnapshot = useEntityStore((s) => s.setSnapshot);
  const { data: states } = useQuery({
    queryKey: ["states"],
    queryFn: () => apiGet<HAEntity[]>("/api/ha/states"),
  });
  useEffect(() => {
    if (states && Object.keys(useEntityStore.getState().entities).length === 0) {
      setSnapshot(states);
    }
  }, [states, setSnapshot]);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", slug],
    queryFn: () => fetchDashboardBySlug(slug),
  });

  if (isLoading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-sidra-sky" />
      </div>
    );
  }
  if (!data || data.id == null) {
    return <Empty msg="Dashboard not found." />;
  }

  const views = data.views || [];
  const activeId = activeView ?? views[0]?.id ?? null;
  const activeViewObj = views.find((v) => v.id === activeId) || views[0];
  const rooms = (activeViewObj?.sections || []).filter((s) => s.items.length > 0);

  return (
    <div className="space-y-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-fg">{data.name || "Dashboard"}</h1>
        {user && (
          <button
            type="button"
            onClick={() => setEdit((v) => !v)}
            className={`flex items-center gap-2 rounded-xl border border-line/10 px-3 py-2 text-sm font-medium transition ${
              edit
                ? "bg-gradient-to-br from-sidra-blue to-sidra-sky text-white"
                : "bg-fg/[0.04] text-muted hover:bg-fg/[0.08]"
            }`}
          >
            {edit ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            {edit ? "Done" : "Edit"}
          </button>
        )}
      </div>

      {edit ? (
        <EditableDashboard dashboardId={data.id} />
      ) : (
        <>
          {views.length > 1 && (
            <div className="flex flex-wrap gap-2 border-b border-line/10 pb-2">
              {views.map((v) => {
                const active = v.id === activeId;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setActiveView(v.id)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      active
                        ? "bg-sidra-sky/15 text-fg"
                        : "text-muted hover:bg-fg/5 hover:text-fg"
                    }`}
                  >
                    {v.name}
                  </button>
                );
              })}
            </div>
          )}
          {rooms.length === 0 ? (
            <Empty msg="This view has no cards yet. Tap Edit to add some." />
          ) : (
            rooms.map((s) => <RoomSection key={s.id} section={s} />)
          )}
        </>
      )}
    </div>
  );
}
