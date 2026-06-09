"use client";

import { useState } from "react";
import { Check, Home as HomeIcon } from "lucide-react";
import { callService } from "@/lib/api";
import { selectHomeMode } from "@/lib/selectors";
import { useConfiguredEntity } from "@/lib/useWidget";
import { useEntityStore } from "@/store/entities";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

export function HomeModeCard() {
  const entities = useEntityStore((s) => s.entities);
  const mode = useConfiguredEntity("mode_entity") || selectHomeMode(entities);
  const [open, setOpen] = useState(false);
  if (!mode) return null;

  const options: string[] = mode.attributes?.options || [];
  const select = (option: string) => {
    callService("input_select", "select_option", {
      entity_id: mode.entity_id,
      option,
    }).catch(console.error);
    setOpen(false);
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="w-full text-left">
        <Card className="flex items-center gap-3 p-5 transition hover:bg-fg/[0.06]">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sidra-blue to-sidra-sky">
            <HomeIcon className="h-6 w-6 text-white" />
          </span>
          <div>
            <p className="text-xs text-muted">Home Mode</p>
            <p className="text-lg font-bold text-fg">{mode.state}</p>
          </div>
        </Card>
      </button>

      {open && (
        <Modal title="Home Mode" onClose={() => setOpen(false)}>
          <div className="space-y-2">
            {options.map((opt) => {
              const active = opt === mode.state;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => select(opt)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                    active
                      ? "border-sidra-sky/50 bg-sidra-sky/10 text-fg"
                      : "border-line/10 bg-fg/[0.03] text-muted hover:bg-fg/[0.06]"
                  }`}
                >
                  <span className="font-medium">{opt}</span>
                  {active && <Check className="h-4 w-4 text-sidra-sky" />}
                </button>
              );
            })}
            {options.length === 0 && (
              <p className="text-sm text-muted">This input_select has no options.</p>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
