"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

// Minimal inline bold (**text**) renderer — no HTML injection.
function inline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-semibold text-fg">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

export function MarkdownCard({ content, title }: { content: string; title?: string }) {
  const lines = (content || "").split("\n");
  return (
    <Card className="p-5">
      {title && <p className="mb-2 font-semibold text-fg">{title}</p>}
      <div className="space-y-1 text-sm text-fg/90">
        {lines.map((ln, i) => {
          if (ln.startsWith("### ")) return <p key={i} className="text-base font-bold text-fg">{ln.slice(4)}</p>;
          if (ln.startsWith("## ")) return <p key={i} className="text-lg font-bold text-fg">{ln.slice(3)}</p>;
          if (ln.startsWith("# ")) return <p key={i} className="text-xl font-bold text-fg">{ln.slice(2)}</p>;
          if (ln.startsWith("- ") || ln.startsWith("* "))
            return <p key={i} className="pl-4 text-muted">• {inline(ln.slice(2))}</p>;
          if (ln.trim() === "") return <div key={i} className="h-2" />;
          return <p key={i}>{inline(ln)}</p>;
        })}
      </div>
    </Card>
  );
}
