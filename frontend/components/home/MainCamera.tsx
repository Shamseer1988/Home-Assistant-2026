"use client";

import { useState } from "react";
import { VideoOff } from "lucide-react";
import { cameraStreamUrl } from "@/lib/api";
import { friendlyName } from "@/lib/ha";
import { selectMainCamera } from "@/lib/selectors";
import { useEntityStore } from "@/store/entities";
import { Card } from "@/components/ui/Card";

export function MainCamera() {
  const entities = useEntityStore((s) => s.entities);
  const cam = selectMainCamera(entities);
  const [error, setError] = useState(false);
  if (!cam) return null;

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video bg-black/50">
        {error ? (
          <div className="flex h-full items-center justify-center text-muted">
            <VideoOff className="h-10 w-10" />
          </div>
        ) : (
          // Live MJPEG stream — frame-by-frame, no buffering.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cameraStreamUrl(cam.entity_id)}
            alt={friendlyName(cam)}
            className="h-full w-full object-cover"
            onError={() => setError(true)}
          />
        )}
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
          <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" /> LIVE
        </div>
        <p className="absolute bottom-3 left-3 text-sm font-semibold text-white drop-shadow">
          {friendlyName(cam)}
        </p>
      </div>
    </Card>
  );
}
