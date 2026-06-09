"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Maximize2, VideoOff, X } from "lucide-react";
import { cameraStreamUrl } from "@/lib/api";
import { friendlyName } from "@/lib/ha";
import { selectCameras } from "@/lib/selectors";
import { useSettings } from "@/lib/useSettings";
import { useEntityStore } from "@/store/entities";
import { Card } from "@/components/ui/Card";

export function CameraViewer() {
  const entities = useEntityStore((s) => s.entities);
  const { data: settings } = useSettings();
  const hidden = new Set<string>((settings?.hidden_cameras as string[]) || []);
  const cams = selectCameras(entities).filter((c) => !hidden.has(c.entity_id));
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [full, setFull] = useState(false);
  const [error, setError] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (cams.length === 0) return null;
  const cam = cams[Math.min(idx, cams.length - 1)];
  const src = cameraStreamUrl(cam.entity_id);

  const go = (d: number) => {
    setError(false);
    setIdx((i) => (i + d + cams.length) % cams.length);
  };
  const startPress = () => {
    pressTimer.current = setTimeout(() => router.push("/cameras"), 500);
  };
  const endPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  return (
    <>
      <Card className="overflow-hidden">
        <div
          className="relative aspect-video select-none bg-black/60"
          onPointerDown={startPress}
          onPointerUp={endPress}
          onPointerLeave={endPress}
        >
          {error ? (
            <div className="flex h-full items-center justify-center text-muted">
              <VideoOff className="h-10 w-10" />
            </div>
          ) : (
            // Live MJPEG (inline element is kept across re-renders → no reload).
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={friendlyName(cam)}
              className="h-full w-full object-cover"
              onError={() => setError(true)}
            />
          )}

          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" /> LIVE
          </div>

          {cams.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-3">
            <p className="truncate text-sm font-semibold text-white drop-shadow">
              {friendlyName(cam)}
            </p>
            <div className="flex items-center gap-2">
              <div className="hidden gap-1 sm:flex">
                {cams.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full ${i === idx ? "bg-white" : "bg-white/40"}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setFull(true)}
                className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium text-white backdrop-blur transition hover:bg-white/30"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                Full View
              </button>
            </div>
          </div>
        </div>
      </Card>

      {full && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black/95" onClick={() => setFull(false)}>
          <div className="flex items-center justify-between p-4" onClick={(e) => e.stopPropagation()}>
            <p className="font-semibold text-white">{friendlyName(cam)}</p>
            <button type="button" onClick={() => setFull(false)} className="rounded-lg p-2 text-white/80 hover:bg-white/10">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="relative flex-1" onClick={(e) => e.stopPropagation()}>
            {!error && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={friendlyName(cam)} className="h-full w-full object-contain" />
            )}
            {cams.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
