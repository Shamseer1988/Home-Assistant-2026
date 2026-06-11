import type { DashItem } from "./types";

/** A card nested inside a container (stack/grid). Lives in config.cards. */
export interface ChildCard {
  type: string;
  entity_id?: string | null;
  label?: string | null;
  config?: Record<string, any> | null;
}

/** Adapt a child spec into the DashItem shape DashCard expects. */
export function toChildItem(c: ChildCard, i: number): DashItem {
  return {
    id: -1 - i, // synthetic, negative so it never clashes with real ids
    type: c.type || "entity",
    entity_id: c.entity_id ?? null,
    label: c.label ?? null,
    icon: null,
    config: c.config ?? null,
  };
}
