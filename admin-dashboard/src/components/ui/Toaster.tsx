// ============================================================
// Toaster Provider (Sonner)
// ============================================================
"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "rounded-2xl border border-slate-200 bg-white shadow-lg",
          title: "text-sm font-semibold text-slate-800",
          description: "text-xs text-slate-500",
          success: "border-emerald-200 bg-emerald-50",
          error: "border-red-200 bg-red-50",
          warning: "border-amber-200 bg-amber-50",
          info: "border-blue-200 bg-blue-50",
        },
      }}
    />
  );
}
