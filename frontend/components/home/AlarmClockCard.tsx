"use client";

import { AlarmClock } from "lucide-react";
import { selectAlarmClock } from "@/lib/selectors";
import { useEntityStore } from "@/store/entities";
import { Card } from "@/components/ui/Card";

function fmt(state: string) {
  const t =
    state && state.length > 8 ? new Date(state) : new Date(`1970-01-01T${state}`);
  return Number.isNaN(t.getTime())
    ? state
    : t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function AlarmClockCard() {
  const entities = useEntityStore((s) => s.entities);
  const alarm = selectAlarmClock(entities);
  if (!alarm) return null;

  return (
    <Card className="flex items-center gap-3 p-5">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
        <AlarmClock className="h-6 w-6 text-white" />
      </span>
      <div>
        <p className="text-xs text-muted">Alarm</p>
        <p className="text-lg font-bold text-fg">{fmt(alarm.state)}</p>
      </div>
    </Card>
  );
}
