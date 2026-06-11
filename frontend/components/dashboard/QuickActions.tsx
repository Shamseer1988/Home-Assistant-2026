"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Zap } from "lucide-react";
import { friendlyName } from "@/lib/ha";
import { iconFor } from "@/lib/icons";
import { normalizeQuickActions, runQuickAction } from "@/lib/quickActions";
import { useSettings } from "@/lib/useSettings";
import { useEntityStore } from "@/store/entities";
import { useToastStore } from "@/store/toast";

function ActionChip({ entityId, label }: { entityId: string; label?: string }) {
  const e = useEntityStore((s) => s.entities[entityId]);
  const push = useToastStore((s) => s.push);
  const [busy, setBusy] = useState(false);
  const Icon = e ? iconFor(e) : Zap;
  const name = label || (e ? friendlyName(e) : entityId);

  const run = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await runQuickAction(entityId);
      push({ title: name, subtitle: "Activated", tone: "on" });
    } catch {
      push({ title: name, subtitle: "Couldn't run", tone: "off" });
    } finally {
      setTimeout(() => setBusy(false), 500);
    }
  };

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      onClick={run}
      disabled={busy}
      className="flex shrink-0 items-center gap-2 rounded-full border border-line/10 bg-fg/[0.04] py-1.5 pl-1.5 pr-4 text-sm font-medium text-fg shadow-sm transition hover:bg-fg/[0.08]"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sidra-blue to-sidra-sky text-white">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      </span>
      {name}
    </motion.button>
  );
}

/** A horizontally-scrollable strip of one-tap scene/script/action chips. */
export function QuickActions() {
  const { data } = useSettings();
  const actions = normalizeQuickActions(data?.quick_actions);
  if (actions.length === 0) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {actions.map((a) => (
        <ActionChip key={a.entity_id} entityId={a.entity_id} label={a.label} />
      ))}
    </div>
  );
}
