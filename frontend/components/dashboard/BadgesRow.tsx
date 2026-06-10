"use client";

import { motion } from "framer-motion";
import { friendlyName, isUnavailable, stateLabel } from "@/lib/ha";
import { iconFor } from "@/lib/icons";
import { useDetailStore } from "@/store/detail";
import { useEntityStore } from "@/store/entities";

function Badge({ entityId }: { entityId: string }) {
  const e = useEntityStore((s) => s.entities[entityId]);
  const openDetail = useDetailStore((s) => s.open);
  if (!e) return null;
  const Icon = iconFor(e);
  const off = isUnavailable(e);
  return (
    <button
      type="button"
      onClick={() => openDetail(entityId)}
      title={friendlyName(e)}
      className={`flex shrink-0 items-center gap-2 rounded-full border border-line/10 bg-panel/60 py-1 pl-1 pr-3 shadow-sm backdrop-blur transition hover:bg-fg/[0.06] ${
        off ? "opacity-50" : ""
      }`}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sidra-sky/15">
        <Icon className="h-3.5 w-3.5 text-sidra-sky" />
      </span>
      <span className="flex min-w-0 flex-col items-start leading-tight">
        <span className="max-w-[8rem] truncate text-[10px] text-muted">{friendlyName(e)}</span>
        <span className="text-xs font-semibold text-fg">{stateLabel(e)}</span>
      </span>
    </button>
  );
}

/** HA-style badges: a row of live entity chips at the top of a view. */
export function BadgesRow({ ids }: { ids?: string[] }) {
  if (!ids || ids.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-wrap items-center gap-2"
    >
      {ids.map((id) => (
        <Badge key={id} entityId={id} />
      ))}
    </motion.div>
  );
}
