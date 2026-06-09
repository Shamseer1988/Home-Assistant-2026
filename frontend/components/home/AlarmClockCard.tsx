"use client";

import { useState } from "react";
import { AlarmClock } from "lucide-react";
import { callService } from "@/lib/api";
import { selectAlarmClock } from "@/lib/selectors";
import { useConfiguredEntity } from "@/lib/useWidget";
import { useEntityStore } from "@/store/entities";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

function toHHMM(state: string) {
  const d = state && state.length > 8 ? new Date(state) : new Date(`1970-01-01T${state}`);
  if (Number.isNaN(d.getTime())) return "06:00";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function fmt(state: string) {
  const d = state && state.length > 8 ? new Date(state) : new Date(`1970-01-01T${state}`);
  return Number.isNaN(d.getTime())
    ? state
    : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function AlarmClockCard() {
  const entities = useEntityStore((s) => s.entities);
  const alarm = useConfiguredEntity("alarm_entity") || selectAlarmClock(entities);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("06:00");
  if (!alarm) return null;

  const openModal = () => {
    setValue(toHHMM(alarm.state));
    setOpen(true);
  };

  const save = () => {
    callService("input_datetime", "set_datetime", {
      entity_id: alarm.entity_id,
      time: `${value}:00`,
    }).catch(console.error);
    setOpen(false);
  };

  return (
    <>
      <button type="button" onClick={openModal} className="w-full text-left">
        <Card className="flex items-center gap-3 p-5 transition hover:bg-fg/[0.06]">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
            <AlarmClock className="h-6 w-6 text-white" />
          </span>
          <div>
            <p className="text-xs text-muted">Alarm</p>
            <p className="text-lg font-bold text-fg">{fmt(alarm.state)}</p>
          </div>
        </Card>
      </button>

      {open && (
        <Modal title="Set alarm" onClose={() => setOpen(false)}>
          <div className="flex flex-col items-center gap-5">
            <input
              type="time"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="rounded-2xl border border-line/10 bg-fg/5 px-6 py-4 text-center text-3xl font-bold text-fg outline-none"
            />
            <button
              type="button"
              onClick={save}
              className="w-full rounded-xl bg-gradient-to-br from-sidra-blue to-sidra-sky py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Save time
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
