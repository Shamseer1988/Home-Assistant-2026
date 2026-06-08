"use client";

import { friendlyName } from "@/lib/ha";
import type { HAEntity } from "@/lib/types";
import { Card } from "@/components/ui/Card";

function fmt(ts: string) {
  const d = new Date(ts);
  return Number.isNaN(d.getTime())
    ? "--"
    : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function label(s: HAEntity) {
  return (
    friendlyName(s)
      .replace(/islamic prayer times/i, "")
      .replace(/prayer/i, "")
      .trim() || s.entity_id
  );
}

export function PrayerTimes({ sensors }: { sensors: HAEntity[] }) {
  const now = Date.now();
  const next = sensors.find((s) => new Date(s.state).getTime() > now);

  return (
    <Card className="p-5">
      <h3 className="mb-3 font-semibold text-fg">Prayer Times</h3>
      <div className="space-y-1.5">
        {sensors.map((s) => {
          const isNext = next && s.entity_id === next.entity_id;
          return (
            <div
              key={s.entity_id}
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${
                isNext ? "bg-sidra-sky/15 text-fg" : "text-muted"
              }`}
            >
              <span className="capitalize">{label(s)}</span>
              <span className="font-medium">{fmt(s.state)}</span>
            </div>
          );
        })}
        {sensors.length === 0 && (
          <p className="text-sm text-muted">No prayer-time sensors found.</p>
        )}
      </div>
    </Card>
  );
}
