"use client";

import { callService } from "@/lib/api";
import { domainOf, friendlyName, isOn } from "@/lib/ha";
import { iconFor } from "@/lib/icons";
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

  const press = () => {
    const service = cfg?.service as string | undefined;
    if (service && service.includes(".")) {
      const [d, s] = service.split(".");
      callService(d, s, { entity_id: entityId }).catch(console.error);
    } else {
      callService(domainOf(entityId), "toggle", { entity_id: entityId }).catch(console.error);
    }
  };

  return (
    <button type="button" onClick={press} className="w-full">
      <Card
        className={`flex flex-col items-center gap-2 p-5 transition hover:bg-fg/[0.06] ${
          on ? "border-sidra-sky/40" : ""
        }`}
      >
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
            on ? "bg-sidra-sky/20 text-sidra-sky" : "bg-fg/5 text-muted"
          }`}
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
