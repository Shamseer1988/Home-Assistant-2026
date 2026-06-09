"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Camera, Eye, EyeOff, User, type LucideIcon } from "lucide-react";
import { friendlyName } from "@/lib/ha";
import { selectCameras, selectPersons } from "@/lib/selectors";
import { setSetting } from "@/lib/admin";
import { useSettings } from "@/lib/useSettings";
import type { HAEntity } from "@/lib/types";
import { useEntityStore } from "@/store/entities";
import { Card } from "@/components/ui/Card";

function List({
  title,
  Icon,
  items,
  hidden,
  onToggle,
}: {
  title: string;
  Icon: LucideIcon;
  items: HAEntity[];
  hidden: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-fg">
        <Icon className="h-4 w-4 text-sidra-sky" /> {title}
      </p>
      <div className="space-y-1.5">
        {items.map((e) => {
          const isHidden = hidden.has(e.entity_id);
          return (
            <button
              key={e.entity_id}
              type="button"
              onClick={() => onToggle(e.entity_id)}
              className={`flex w-full items-center justify-between rounded-xl border border-line/10 bg-fg/[0.03] px-3 py-2 text-left text-sm transition hover:bg-fg/[0.06] ${
                isHidden ? "opacity-50" : ""
              }`}
            >
              <span className="truncate text-fg">{friendlyName(e)}</span>
              {isHidden ? (
                <EyeOff className="h-4 w-4 shrink-0 text-rose-400" />
              ) : (
                <Eye className="h-4 w-4 shrink-0 text-emerald-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function VisibilityPanel() {
  const entities = useEntityStore((s) => s.entities);
  const cameras = selectCameras(entities);
  const persons = selectPersons(entities);
  const { data } = useSettings();
  const qc = useQueryClient();

  const hiddenCams = new Set<string>((data?.hidden_cameras as string[]) || []);
  const hiddenPersons = new Set<string>((data?.hidden_persons as string[]) || []);

  const toggle = async (key: string, current: Set<string>, id: string) => {
    const next = new Set(current);
    next.has(id) ? next.delete(id) : next.add(id);
    await setSetting(key, Array.from(next));
    qc.invalidateQueries({ queryKey: ["settings"] });
  };

  if (cameras.length === 0 && persons.length === 0) return null;

  return (
    <Card className="space-y-5 p-5">
      <h2 className="font-semibold text-fg">Cameras &amp; Persons</h2>
      <List
        title="Cameras"
        Icon={Camera}
        items={cameras}
        hidden={hiddenCams}
        onToggle={(id) => toggle("hidden_cameras", hiddenCams, id)}
      />
      <List
        title="Persons"
        Icon={User}
        items={persons}
        hidden={hiddenPersons}
        onToggle={(id) => toggle("hidden_persons", hiddenPersons, id)}
      />
    </Card>
  );
}
