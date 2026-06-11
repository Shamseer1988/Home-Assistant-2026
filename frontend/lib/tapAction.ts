"use client";

import { useRouter } from "next/navigation";
import { callService } from "./api";
import { domainOf } from "./ha";
import { useDetailStore } from "@/store/detail";

export interface TapAction {
  action?: string; // default | more-info | toggle | navigate | url | call-service | none
  navigation_path?: string;
  url_path?: string;
  service?: string;
}

export const TAP_ACTIONS: { value: string; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "more-info", label: "Show more info" },
  { value: "toggle", label: "Toggle" },
  { value: "navigate", label: "Navigate to…" },
  { value: "url", label: "Open a URL…" },
  { value: "call-service", label: "Run a service…" },
  { value: "none", label: "Do nothing" },
];

// Card types that expose a configurable tap action in the editor.
export const TAP_TYPES = ["entity", "button", "gauge"];

/**
 * A click handler that honours config.tap_action, falling back to the card's
 * native behaviour when the action is unset or "default".
 */
export function useCardTap(
  entityId: string | null | undefined,
  tap: TapAction | undefined,
  fallback: () => void
) {
  const router = useRouter();
  const openDetail = useDetailStore((s) => s.open);
  return () => {
    const a = tap?.action;
    if (!a || a === "default") return fallback();
    switch (a) {
      case "more-info":
        if (entityId) openDetail(entityId);
        break;
      case "toggle":
        if (entityId)
          callService(domainOf(entityId), "toggle", { entity_id: entityId }).catch(console.error);
        break;
      case "navigate":
        if (tap.navigation_path) router.push(tap.navigation_path);
        break;
      case "url":
        if (tap.url_path) window.open(tap.url_path, "_blank", "noopener");
        break;
      case "call-service": {
        const s = tap.service;
        if (s && s.includes(".")) {
          const [d, sv] = s.split(".");
          callService(d, sv, entityId ? { entity_id: entityId } : {}).catch(console.error);
        }
        break;
      }
      default: // "none"
        break;
    }
  };
}
