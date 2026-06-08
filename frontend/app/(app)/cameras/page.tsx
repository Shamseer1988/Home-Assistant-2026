"use client";

import { useEntityStore } from "@/store/entities";
import { selectCameras } from "@/lib/selectors";
import { CameraTile } from "@/components/special/CameraTile";
import { Empty, PageHeader } from "@/components/special/common";

export default function CamerasPage() {
  const entities = useEntityStore((s) => s.entities);
  const cameras = selectCameras(entities);

  return (
    <div>
      <PageHeader
        title="Cameras"
        subtitle={`${cameras.length} ${cameras.length === 1 ? "camera" : "cameras"}`}
      />
      {cameras.length === 0 ? (
        <Empty msg="No camera entities found in Home Assistant." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cameras.map((c) => (
            <CameraTile key={c.entity_id} entity={c} />
          ))}
        </div>
      )}
    </div>
  );
}
