"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Power, X } from "lucide-react";
import { useToastStore } from "@/store/toast";

const TONE = {
  on: "border-emerald-400/40 text-emerald-300",
  off: "border-slate-400/30 text-slate-300",
  info: "border-sidra-sky/40 text-sidra-sky",
} as const;

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(92vw,20rem)] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className={`pointer-events-auto flex items-center gap-3 rounded-2xl border bg-panel/95 p-3 shadow-glass backdrop-blur-xl ${TONE[t.tone]}`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-fg/5">
              <Power className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-fg">{t.title}</p>
              {t.subtitle && <p className="truncate text-xs text-muted">{t.subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="rounded-lg p-1 text-muted transition hover:bg-fg/10 hover:text-fg"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}
