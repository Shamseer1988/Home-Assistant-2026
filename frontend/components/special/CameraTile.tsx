"use client";

import { useEffect, useState } from "react";
import { VideoOff } from "lucide-react";
import { cameraUrl } from "@/lib/api";
import { friendlyName, isUnavailable } from "@/lib/ha";
import type { HAEntity } from "@/lib/types";
import { Card } from "@/components/ui/Card";

export function CameraTile({ entity }: { entity: HAEntity }) {
  const [tick, setTick] = useState(() => Date.now());
  const [error, setError] = useState(false);
  const unavailable = isUnavailable(entity);

  useEffect(() => {
    // Refresh the snapshot every 5s for a live-ish feed.
    const id = setInterval(() => {
      setError(false);
      setTick(Date.now());
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video bg-black/40">
        {unavailable || error ? (
          <div className="flex h-full items-center justify-center text-muted">
            <VideoOff className="h-8 w-8" />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${cameraUrl(entity.entity_id)}?t=${tick}`}
            alt={friendlyName(entity)}
            className="h-full w-full object-cover"
            onError={() => setError(true)}
          />
        )}
      </div>
      <div className="flex items-center justify-between px-4 py-3">
        <p className="truncate text-sm font-medium text-fg">
          {friendlyName(entity)}
        </p>
        <span className="text-xs capitalize text-muted">{entity.state}</span>
      </div>
    </Card>
  );
}
