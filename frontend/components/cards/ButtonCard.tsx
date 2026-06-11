"use client";

import { callService } from "@/lib/api";
import { domainOf, friendlyName, isOn } from "@/lib/ha";
import { iconFor } from "@/lib/icons";
import { useCardTap } from "@/lib/tapAction";
import type { HAEntity } from "@/lib/types";
import { useEntityStore } from "@/store/entities";
import { Card } from "@/components/ui/Card";

export function ButtonCard({
  entityId,
  label,
  cfg,
}: {
  entityId: string;
  label?: string | null;
  cfg?: Record<string, any>;
}) {
  const e = useEntityStore((s) => s.entities[entityId]);
  const stub: HAEntity = e || { entity_id: entityId, state: "", attributes: {} };
  const Icon = iconFor(stub);
  const on = e ? isOn(e) : false;
  const color = (cfg?.color as string | undefined) || undefined;

  const press = () => {
    const service = cfg?.service as string | undefined;
    if (service && service.includes(".")) {
      const [d, s] = service.split(".");
      callService(d, s, { entity_id: entityId }).catch(console.error);
    } else {
      callService(domainOf(entityId), "toggle", { entity_id: entityId }).catch(console.error);
    }
  };
  const onTap = useCardTap(entityId, cfg?.tap_action, press);

  return (
    <button type="button" onClick={onTap} className="w-full">
      <Card
        className={`flex flex-col items-center gap-2 p-5 transition hover:bg-fg/[0.06] ${
          on && !color ? "border-sidra-sky/40" : ""
        }`}
        style={color && on ? { borderColor: `${color}66` } : undefined}
      >
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
            on && !color ? "bg-sidra-sky/20 text-sidra-sky" : on ? "" : "bg-fg/5 text-muted"
          }`}
          style={color ? (on ? { backgroundColor: `${color}33`, color } : { color }) : undefined}
        >
          <Icon className="h-6 w-6" />
        </span>
        <span className="w-full truncate text-center text-sm font-medium text-fg">
          {label || (e ? friendlyName(e) : entityId)}
        </span>
      </Card>
    </button>
  );
}
