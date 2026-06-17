"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Mobile-first modal for admin create/edit forms. Renders as a full-width
 * bottom sheet on phones and a centered dialog on larger screens. The body
 * scrolls internally (max-h) so tall forms never overflow the viewport or
 * cause horizontal scrolling.
 */
export function FormModal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  // Close on Escape and lock background scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl duration-200 animate-in fade-in slide-in-from-bottom-8 sm:max-h-[85vh] sm:max-w-2xl sm:rounded-2xl sm:zoom-in-95"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="shrink-0 rounded-full text-slate-500"
          >
            <X className="size-5" />
          </Button>
        </div>
        <div className="overflow-y-auto p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
