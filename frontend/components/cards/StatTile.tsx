import { Card } from "@/components/ui/Card";
import { friendlyName } from "@/lib/ha";
import { iconFor } from "@/lib/icons";
import type { HAEntity } from "@/lib/types";

export function StatTile({
  entity,
  label,
}: {
  entity: HAEntity;
  label?: string | null;
}) {
  const Icon = iconFor(entity);
  const unit = entity.attributes?.unit_of_measurement as string | undefined;

  return (
    <Card className="flex items-center gap-3 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
        <Icon className="h-5 w-5 text-sky-300" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs text-slate-400">
          {label || friendlyName(entity)}
        </p>
        <p className="truncate text-base font-semibold text-white">
          {entity.state}
          {unit && <span className="ml-1 text-xs text-slate-400">{unit}</span>}
        </p>
      </div>
    </Card>
  );
}
