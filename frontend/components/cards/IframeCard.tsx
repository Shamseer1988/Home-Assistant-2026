"use client";

import { Card } from "@/components/ui/Card";

export function IframeCard({
  url,
  title,
  height,
}: {
  url: string;
  title?: string;
  height?: number;
}) {
  if (!url) return null;
  return (
    <Card className="overflow-hidden">
      {title && <p className="px-4 py-3 font-medium text-fg">{title}</p>}
      <iframe
        src={url}
        title={title || "embed"}
        className="w-full border-0 bg-fg/5"
        style={{ height: height || 320 }}
      />
    </Card>
  );
}
