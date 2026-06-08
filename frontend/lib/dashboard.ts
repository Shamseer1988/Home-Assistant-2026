import { apiGet, apiPost } from "./api";
import type { DashConfig } from "./types";

export const fetchDashboard = () => apiGet<DashConfig>("/api/dashboard");

export interface ImportResult {
  ok: boolean;
  sections: number;
  items: number;
}

export const importDashboard = () => apiPost<ImportResult>("/api/admin/import");
