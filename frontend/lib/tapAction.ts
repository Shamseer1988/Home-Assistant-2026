"use client";

import { useRef } from "react";
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

export interface CardActions {
  tap?: TapAction;
  hold?: TapAction;
  double_tap?: TapAction;
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

// Card types that expose configurable tap/hold/double-tap actions in the editor.
export const TAP_TYPES = ["entity", "button", "gauge"];

const isSet = (a?: TapAction) => !!a?.action && a.action !== "default";

/** Pull the three actions out of a card's config. */
export function cardActions(cfg: Record<string, any> | null | undefined): CardActions {
  return {
    tap: cfg?.tap_action,
    hold: cfg?.hold_action,
    double_tap: cfg?.double_tap_action,
  };
}

function useActionRunner(entityId: string | null | undefined) {
  const router = useRouter();
  const openDetail = useDetailStore((s) => s.open);
  return (tap: TapAction | undefined, fallback: () => void) => {
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

/**
 * Gesture handlers honouring tap / hold / double-tap actions. The tap falls
 * back to the card's native behaviour when unset; hold and double-tap only
 * engage when configured (so a single tap stays instant by default).
 */
export function useCardGestures(
  entityId: string | null | undefined,
  actions: CardActions,
  fallback: () => void
) {
  const run = useActionRunner(entityId);
  const held = useRef(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const onPointerDown = () => {
    held.current = false;
    if (isSet(actions.hold)) {
      holdTimer.current = setTimeout(() => {
        held.current = true;
        run(actions.hold, fallback);
      }, 500);
    }
  };

  const fire = () => {
    clearHold();
    if (held.current) {
      held.current = false; // the hold already ran; swallow the trailing click
      return;
    }
    if (!isSet(actions.double_tap)) {
      run(actions.tap, fallback);
      return;
    }
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      run(actions.double_tap, fallback);
    } else {
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null;
        run(actions.tap, fallback);
      }, 250);
    }
  };

  return {
    handlers: {
      onPointerDown,
      onPointerUp: clearHold,
      onPointerLeave: clearHold,
      onPointerCancel: clearHold,
      onClick: fire,
    },
    fire, // for keyboard activation
  };
}
