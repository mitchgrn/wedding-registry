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
            "!border-[var(--border)] !bg-white !text-[var(--ink-black)]/65 hover:!bg-[var(--soft-blue)] hover:!text-[var(--ink-black)]",
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
