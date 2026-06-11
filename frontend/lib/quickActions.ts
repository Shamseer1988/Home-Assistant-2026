"use client";

import { callService } from "./api";
import { domainOf } from "./ha";

export interface QuickAction {
  entity_id: string;
  label?: string;
}

/** Run the most sensible service for a quick-action entity, by domain. */
export function runQuickAction(entityId: string): Promise<unknown> {
  const d = domainOf(entityId);
  if (d === "scene") return callService("scene", "turn_on", { entity_id: entityId });
  if (d === "script") return callService("script", "turn_on", { entity_id: entityId });
  if (d === "automation") return callService("automation", "trigger", { entity_id: entityId });
  if (d === "button" || d === "input_button")
    return callService(d, "press", { entity_id: entityId });
  if (["light", "switch", "fan", "input_boolean", "cover", "media_player", "lock"].includes(d))
    return callService(d, "toggle", { entity_id: entityId });
  return callService("homeassistant", "toggle", { entity_id: entityId });
}

/** Coerce stored JSON into a clean QuickAction[]. */
export function normalizeQuickActions(raw: unknown): QuickAction[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (q): q is QuickAction =>
        !!q && typeof q === "object" && typeof (q as QuickAction).entity_id === "string"
    )
    .map((q) => ({ entity_id: q.entity_id, label: q.label || undefined }));
}

// Entity domains offered first in the picker (the natural "actions").
export const ACTION_DOMAINS = ["scene", "script", "automation", "button", "input_button"];
