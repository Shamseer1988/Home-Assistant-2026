"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchSettings } from "./settings";

export function useSettings() {
  return useQuery({ queryKey: ["settings"], queryFn: fetchSettings, staleTime: 30_000 });
}
