import { create } from "zustand";
import type { HAEntity } from "@/lib/types";

interface EntityState {
  entities: Record<string, HAEntity>;
  connected: boolean;
  setConnected: (v: boolean) => void;
  setSnapshot: (list: HAEntity[]) => void;
  upsert: (e: HAEntity) => void;
  remove: (id: string) => void;
}

export const useEntityStore = create<EntityState>((set) => ({
  entities: {},
  connected: false,
  setConnected: (v) => set({ connected: v }),
  setSnapshot: (list) =>
    set({ entities: Object.fromEntries(list.map((e) => [e.entity_id, e])) }),
  upsert: (e) =>
    set((s) => ({ entities: { ...s.entities, [e.entity_id]: e } })),
  remove: (id) =>
    set((s) => {
      const next = { ...s.entities };
      delete next[id];
      return { entities: next };
    }),
}));
