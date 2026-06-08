import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function IconButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "rounded-lg p-1.5 text-muted transition hover:bg-fg/10 hover:text-fg disabled:opacity-30 disabled:hover:bg-transparent",
        className
      )}
    />
  );
}
