"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { friendlyName } from "@/lib/ha";
import { iconFor } from "@/lib/icons";
import { useDetailStore } from "@/store/detail";
import { useEntityStore } from "@/store/entities";
import { DomainControls } from "./controls";

export function EntityDetailSheet() {
  const entityId = useDetailStore((s) => s.entityId);
  const close = useDetailStore((s) => s.close);
  const entity = useEntityStore((s) => (entityId ? s.entities[entityId] : undefined));
  const Icon = entity ? iconFor(entity) : null;

  return (
    <AnimatePresence>
      {entityId && (
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-line/10 bg-panel p-5 shadow-glass sm:rounded-3xl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center gap-3">
              {Icon && (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-fg/5">
                  <Icon className="h-5 w-5 text-sidra-sky" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-fg">
                  {entity ? friendlyName(entity) : entityId}
                </p>
                <p className="truncate text-xs text-muted">{entityId}</p>
              </div>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-1 text-muted transition hover:bg-fg/10 hover:text-fg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {entity ? (
              <DomainControls entity={entity} />
            ) : (
              <p className="py-6 text-center text-sm text-muted">Entity unavailable</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
