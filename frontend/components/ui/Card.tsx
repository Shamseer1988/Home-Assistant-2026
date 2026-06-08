import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

// Theme-aware frosted card (light + dark via the .glass-card token).
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("glass-card", className)} {...props} />;
}
