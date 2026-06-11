"use client";

import { useState, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { Maximize2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { callService } from "@/lib/api";
import { domainOf, friendlyName, isOn, isUnavailable, stateLabel } from "@/lib/ha";
import { iconFor } from "@/lib/icons";
import { useCardTap, type TapAction } from "@/lib/tapAction";
import type { HAEntity } from "@/lib/types";
import { useDetailStore } from "@/store/detail";

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

export function DeviceTile({
  entity,
  label,
  color,
  tapAction,
}: {
  entity: HAEntity;
  label?: string | null;
  color?: string | null;
  tapAction?: TapAction;
}) {
  const [pending, setPending] = useState(false);
  const openDetail = useDetailStore((s) => s.open);
  const domain = domainOf(entity.entity_id);
  const on = isOn(entity);
  const unavailable = isUnavailable(entity);
  const Icon = iconFor(entity);
  const accent = ACCENT[domain] ?? ACCENT.switch;
  // A custom card colour (hex) replaces the per-domain accent while on.
  const customOn: CSSProperties | undefined =
    color && on
      ? {
          background: `linear-gradient(135deg, ${color}40, ${color}1a)`,
          borderColor: `${color}4d`,
          boxShadow: `0 0 30px ${color}33`,
        }
      : undefined;

  const toggle = async () => {
    if (unavailable || pending) return;
    setPending(true);
    try {
      await callService(domain, "toggle", { entity_id: entity.entity_id });
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setPending(false), 400);
    }
  };
  const onTap = useCardTap(entity.entity_id, tapAction, toggle);

  return (
    <motion.div
      role="button"
      tabIndex={0}
      whileTap={{ scale: 0.97 }}
      onClick={onTap}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onTap();
        }
      }}
      className={cn(
        "group relative flex cursor-pointer flex-col items-start gap-3 rounded-3xl border p-4 text-left transition-all",
        on ? (color ? "" : accent.bg) : "border-line/10 bg-fg/[0.04] hover:bg-fg/[0.07]",
        unavailable && "cursor-not-allowed opacity-40",
        pending && "animate-pulse"
      )}
      style={customOn}
    >
      <div className="flex w-full items-center justify-between">
        <span
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-2xl",
            on ? "bg-fg/10" : "bg-fg/5"
          )}
        >
          <Icon
            className={cn("h-5 w-5", on ? (color ? "" : accent.icon) : "text-muted")}
            style={color && on ? { color } : undefined}
          />
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            title="Details"
            onClick={(e) => {
              e.stopPropagation();
              openDetail(entity.entity_id);
            }}
            className="rounded-lg p-1 text-muted opacity-60 transition hover:bg-fg/10 hover:text-fg sm:opacity-0 sm:group-hover:opacity-100"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
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
      </div>
      <div className="w-full">
        <p className="truncate text-sm font-medium text-fg">
          {label || friendlyName(entity)}
        </p>
        <p className="text-xs text-muted">{stateLabel(entity)}</p>
      </div>
    </motion.div>
  );
}
