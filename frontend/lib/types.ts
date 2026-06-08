export interface HAEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
  last_changed?: string;
  last_updated?: string;
}

export interface Health {
  status: string;
  ha_configured: boolean;
  ha_connected: boolean;
  entity_count: number;
}
