"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { callService } from "@/lib/api";
import { domainOf, friendlyName, isOn, isUnavailable, stateLabel } from "@/lib/ha";
import { iconFor } from "@/lib/icons";
import type { HAEntity } from "@/lib/types";

// Full static class strings so Tailwind keeps them at build time.
const ACCENT: Record<string, { bg: string; icon: string }> = {
  light: {
    bg: "bg-gradient-to-br from-amber-400/25 to-orange-500/10 border-amber-300/30 shadow-[0_0_30px_rgba(251,191,36,0.20)]",
    icon: "text-amber-300",
  },
  switch: {
    bg: "bg-gradient-to-br from-blue-500/25 to-sky-400/10 border-blue-300/30 shadow-glow",
    icon: "text-sky-300",
  },
  fan: {
    bg: "bg-gradient-to-br from-cyan-400/25 to-teal-400/10 border-cyan-300/30 shadow-[0_0_30px_rgba(34,211,238,0.20)]",
    icon: "text-cyan-300",
  },
};

export function DeviceTile({ entity }: { entity: HAEntity }) {
  const [pending, setPending] = useState(false);
  const domain = domainOf(entity.entity_id);
  const on = isOn(entity);
  const unavailable = isUnavailable(entity);
  const Icon = iconFor(entity);
  const accent = ACCENT[domain] ?? ACCENT.switch;

  const toggle = async () => {
    if (unavailable || pending) return;
    setPending(true);
    try {
      await callService(domain, "toggle", { entity_id: entity.entity_id });
    } catch (err) {
      console.error(err);
    } finally {
      // The real state arrives over Socket.IO; clear the local pending flag.
      setTimeout(() => setPending(false), 400);
    }
  };

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={toggle}
      disabled={unavailable}
      className={cn(
        "group relative flex flex-col items-start gap-3 rounded-3xl border p-4 text-left transition-all",
        on ? accent.bg : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]",
        unavailable && "cursor-not-allowed opacity-40",
        pending && "animate-pulse"
      )}
    >
      <div className="flex w-full items-center justify-between">
        <span
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-2xl",
            on ? "bg-white/15" : "bg-white/5"
          )}
        >
          <Icon className={cn("h-5 w-5", on ? accent.icon : "text-slate-300")} />
        </span>
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            on
              ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]"
              : unavailable
                ? "bg-slate-600"
                : "bg-slate-500"
          )}
        />
      </div>
      <div className="w-full">
        <p className="truncate text-sm font-medium text-white">
          {friendlyName(entity)}
        </p>
        <p className="text-xs text-slate-400">{stateLabel(entity)}</p>
      </div>
    </motion.button>
  );
}
