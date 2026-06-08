import { create } from "zustand";

interface DetailState {
  entityId: string | null;
  open: (id: string) => void;
  close: () => void;
}

// Which entity's detail sheet is open (rendered once in the AppShell).
export const useDetailStore = create<DetailState>((set) => ({
  entityId: null,
  open: (id) => set({ entityId: id }),
  close: () => set({ entityId: null }),
}));
