"use client";

import { ExternalLink } from "lucide-react";
import type { ServiceLink } from "@/lib/services";
import { Card } from "@/components/ui/Card";

export function ServiceEmbed({ service }: { service: ServiceLink }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="font-medium text-fg">{service.name}</p>
          {service.description && (
            <p className="text-xs text-muted">{service.description}</p>
          )}
        </div>
        <a
          href={service.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-xs text-sidra-sky hover:underline"
        >
          Open <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
      {/* Some services block embedding (X-Frame-Options); the link above is the fallback. */}
      <iframe src={service.url} title={service.name} className="h-80 w-full border-0 bg-fg/5" />
    </Card>
  );
}
