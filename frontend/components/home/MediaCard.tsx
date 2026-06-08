"use client";

import { Music, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { callService } from "@/lib/api";
import { selectMedia } from "@/lib/selectors";
import { useEntityStore } from "@/store/entities";
import { Card } from "@/components/ui/Card";
import { Slider } from "@/components/ui/Slider";

export function MediaCard() {
  const entities = useEntityStore((s) => s.entities);
  const m = selectMedia(entities);
  if (!m) return null;

  const a = m.attributes || {};
  const playing = m.state === "playing";
  const idle = ["off", "idle", "unavailable", "standby"].includes(m.state);
  const call = (service: string, data: Record<string, unknown> = {}) =>
    callService("media_player", service, { entity_id: m.entity_id, ...data }).catch(
      console.error
    );

  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600">
          <Music className="h-7 w-7 text-white" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-fg">
            {a.media_title || (idle ? "Nothing playing" : m.state)}
          </p>
          {a.media_artist && (
            <p className="truncate text-sm text-muted">{a.media_artist}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => call("media_previous_track")} className="text-muted hover:text-fg">
            <SkipBack className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => call("media_play_pause")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sidra-blue to-sidra-sky text-white"
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          <button type="button" onClick={() => call("media_next_track")} className="text-muted hover:text-fg">
            <SkipForward className="h-5 w-5" />
          </button>
        </div>
      </div>
      {a.volume_level != null && (
        <div className="mt-4">
          <Slider
            label="Volume"
            suffix="%"
            value={Math.round(a.volume_level * 100)}
            min={0}
            max={100}
            onCommit={(v) => call("volume_set", { volume_level: v / 100 })}
          />
        </div>
      )}
    </Card>
  );
}
