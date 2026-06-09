"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { HAEntity } from "@/lib/types";
import { useEntityStore } from "@/store/entities";
import { Card } from "@/components/ui/Card";
import { WelcomeHero } from "@/components/home/WelcomeHero";
import { GraphicalWeather } from "@/components/home/GraphicalWeather";
import { CameraViewer } from "@/components/home/CameraViewer";
import { ClimateDialCard } from "@/components/home/ClimateDialCard";
import { QuickControls } from "@/components/home/QuickControls";
import { HomeModeCard } from "@/components/home/HomeModeCard";
import { AlarmClockCard } from "@/components/home/AlarmClockCard";
import { RoomsCard } from "@/components/home/RoomsCard";
import { MediaCard } from "@/components/home/MediaCard";
import { EnergyMiniCard } from "@/components/home/EnergyMiniCard";
import { PersonsCard } from "@/components/home/PersonsCard";

export default function HomePage() {
  const setSnapshot = useEntityStore((s) => s.setSnapshot);
  const count = useEntityStore((s) => Object.keys(s.entities).length);

  const { data: states } = useQuery({
    queryKey: ["states"],
    queryFn: () => apiGet<HAEntity[]>("/api/ha/states"),
  });

  useEffect(() => {
    if (states && Object.keys(useEntityStore.getState().entities).length === 0) {
      setSnapshot(states);
    }
  }, [states, setSnapshot]);

  if (count === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 p-12 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-sidra-sky" />
        <p className="text-sm text-muted">Loading your home…</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Two-column hero */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WelcomeHero />
        </div>
        <GraphicalWeather />
      </div>

      {/* Camera + control rail */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <CameraViewer />
          <RoomsCard />
          <div className="grid gap-4 sm:grid-cols-2">
            <EnergyMiniCard />
            <MediaCard />
          </div>
        </div>
        <div className="space-y-4">
          <ClimateDialCard />
          <QuickControls />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <HomeModeCard />
            <AlarmClockCard />
          </div>
          <PersonsCard />
        </div>
      </div>
    </div>
  );
}
