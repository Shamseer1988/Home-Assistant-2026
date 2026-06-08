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
import { HomeModeCard } from "@/components/home/HomeModeCard";
import { PersonsCard } from "@/components/home/PersonsCard";
import { MainCamera } from "@/components/home/MainCamera";
import { AlarmClockCard } from "@/components/home/AlarmClockCard";
import { MediaCard } from "@/components/home/MediaCard";
import { RoomsCard } from "@/components/home/RoomsCard";
import { EnergyMiniCard } from "@/components/home/EnergyMiniCard";

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
      <WelcomeHero />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <MainCamera />
          <div className="grid gap-4 sm:grid-cols-2">
            <HomeModeCard />
            <AlarmClockCard />
          </div>
          <RoomsCard />
          <MediaCard />
        </div>
        <div className="space-y-4">
          <GraphicalWeather />
          <PersonsCard />
          <EnergyMiniCard />
        </div>
      </div>
    </div>
  );
}
