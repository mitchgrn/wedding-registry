"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      richColors
      closeButton
      position="bottom-center"
      className="toaster group"
      toastOptions={{
        classNames: {
          closeButton:
            "!border-border !bg-white !text-ink-black/65 hover:!bg-soft-blue hover:!text-ink-black",
        },
        style: {
          background: "rgba(255,255,255,0.98)",
          border: "1px solid rgba(0, 23, 31, 0.1)",
          color: "var(--ink-black)",
        },
      }}
      {...props}
    />
  );
}
