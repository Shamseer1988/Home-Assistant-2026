"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDashboard } from "./dashboard";

export function useDashboard() {
  return useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard });
}
