"use client";

import type { DashItem } from "@/lib/types";
import { EntityTile } from "./EntityTile";
import { GlanceCard } from "./GlanceCard";
import { EntitiesCard } from "./EntitiesCard";
import { GaugeCard } from "./GaugeCard";
import { GraphCard } from "./GraphCard";
import { ButtonCard } from "./ButtonCard";
import { MarkdownCard } from "./MarkdownCard";
import { CameraCardMini } from "./CameraCardMini";
import { WeatherMiniCard } from "./WeatherMiniCard";
import { IframeCard } from "./IframeCard";

export function DashCard({ item }: { item: DashItem }) {
  const cfg = (item.config || {}) as Record<string, any>;
  const ids: string[] = cfg.entities || cfg.entity_ids || [];

  switch (item.type) {
    case "glance":
      return <GlanceCard ids={ids} title={cfg.title} />;
    case "entities":
      return <EntitiesCard ids={ids} title={cfg.title} />;
    case "gauge":
      return item.entity_id ? <GaugeCard entityId={item.entity_id} label={item.label} cfg={cfg} /> : null;
    case "graph":
      return item.entity_id ? <GraphCard entityId={item.entity_id} label={item.label} cfg={cfg} /> : null;
    case "button":
      return item.entity_id ? <ButtonCard entityId={item.entity_id} label={item.label} cfg={cfg} /> : null;
    case "camera":
      return item.entity_id ? <CameraCardMini entityId={item.entity_id} /> : null;
    case "weather":
      return item.entity_id ? <WeatherMiniCard entityId={item.entity_id} /> : null;
    case "markdown":
      return <MarkdownCard content={cfg.content || ""} title={cfg.title} />;
    case "iframe":
      return <IframeCard url={cfg.url || ""} title={cfg.title} height={cfg.height} />;
    case "entity":
    default:
      return item.entity_id ? (
        <EntityTile entityId={item.entity_id} label={item.label} color={cfg.color} />
      ) : null;
  }
}
