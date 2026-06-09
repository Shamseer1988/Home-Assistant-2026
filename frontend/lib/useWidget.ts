"use client";

import type { HAEntity } from "./types";
import { useSettings } from "./useSettings";
import { useEntityStore } from "@/store/entities";

/** Resolve a single admin-configured entity for a widget (or undefined). */
export function useConfiguredEntity(key: string): HAEntity | undefined {
  const { data } = useSettings();
  const entities = useEntityStore((s) => s.entities);
  const id = data?.[key] as string | undefined;
  return id ? entities[id] : undefined;
}

/** Resolve an admin-configured list of entities for a widget. */
export function useConfiguredList(key: string): HAEntity[] {
  const { data } = useSettings();
  const entities = useEntityStore((s) => s.entities);
  const ids = (data?.[key] as string[]) || [];
  return ids.map((id) => entities[id]).filter(Boolean);
}
