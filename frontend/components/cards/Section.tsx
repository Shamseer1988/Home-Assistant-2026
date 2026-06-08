import type { ReactNode } from "react";

export function Section({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-fg">{title}</h2>
        {count != null && (
          <span className="text-xs font-medium text-muted">{count}</span>
        )}
      </div>
      {children}
    </section>
  );
}
