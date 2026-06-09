import { apiGet } from "./api";

export interface DashSettings {
  hidden_cameras?: string[];
  hidden_persons?: string[];
  [key: string]: unknown;
}

export const fetchSettings = () => apiGet<DashSettings>("/api/settings");
