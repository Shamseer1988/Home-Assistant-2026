"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  // Portal to <body> so the overlay escapes any backdrop-filter/transform
  // ancestor (a .glass-card) and truly covers the viewport.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-line/10 bg-panel shadow-glass sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line/10 px-5 py-4">
          <h3 className="font-semibold text-fg">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted transition hover:bg-fg/10 hover:text-fg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="border-t border-line/10 p-4">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
