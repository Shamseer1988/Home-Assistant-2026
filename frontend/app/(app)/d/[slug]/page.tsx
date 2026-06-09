"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { apiGet } from "@/lib/api";
import { fetchDashboardBySlug } from "@/lib/dashboards";
import type { HAEntity } from "@/lib/types";
import { useEntityStore } from "@/store/entities";
import { RoomSection } from "@/components/cards/RoomSection";
import { Empty, PageHeader } from "@/components/special/common";

export default function DashboardSlugPage() {
  const params = useParams();
  const slug = String(params.slug);

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

  const rooms = data.sections.filter((s) => s.items.length > 0);

  return (
    <div className="space-y-8">
      <PageHeader title={data.name || "Dashboard"} />
      {rooms.length === 0 ? (
        <Empty msg="This dashboard has no tiles yet. Add them in the builder." />
      ) : (
        rooms.map((s) => <RoomSection key={s.id} section={s} />)
      )}
    </div>
  );
}
