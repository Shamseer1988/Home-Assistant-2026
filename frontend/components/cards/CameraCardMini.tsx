"use client";

import { useEntityStore } from "@/store/entities";
import { CameraTile } from "@/components/special/CameraTile";

export function CameraCardMini({ entityId }: { entityId: string }) {
  const e = useEntityStore((s) => s.entities[entityId]);
  if (!e) return null;
  return <CameraTile entity={e} />;
}
