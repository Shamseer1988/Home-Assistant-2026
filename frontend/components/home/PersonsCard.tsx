"use client";

import { MapPin } from "lucide-react";
import { imageUrl } from "@/lib/api";
import { friendlyName } from "@/lib/ha";
import { selectPersons } from "@/lib/selectors";
import { useSettings } from "@/lib/useSettings";
import { useEntityStore } from "@/store/entities";
import { Card } from "@/components/ui/Card";

export function PersonsCard() {
  const entities = useEntityStore((s) => s.entities);
  const { data: settings } = useSettings();
  const hidden = new Set<string>((settings?.hidden_persons as string[]) || []);
  const persons = selectPersons(entities).filter((p) => !hidden.has(p.entity_id));
  if (persons.length === 0) return null;

  return (
    <Card className="p-5">
      <h3 className="mb-3 font-semibold text-fg">Persons</h3>
      <div className="grid grid-cols-2 gap-3">
        {persons.map((p) => {
          const home = p.state === "home";
          const pic = imageUrl(p.attributes?.entity_picture);
          return (
            <div
              key={p.entity_id}
              className="flex flex-col items-center gap-2 rounded-2xl border border-line/10 bg-fg/[0.03] p-3 text-center"
            >
              <div className="relative">
                {pic ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pic} alt="" className="h-14 w-14 rounded-full object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-fg/10 text-lg font-bold text-fg">
                    {friendlyName(p).charAt(0)}
                  </div>
                )}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-panel ${
                    home ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-fg">{friendlyName(p)}</p>
                <p className="flex items-center justify-center gap-1 truncate text-xs text-muted">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {p.state}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
