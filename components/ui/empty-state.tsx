import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  className,
  icon,
  title,
  description,
  actions,
}: {
  className?: string;
  icon?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(0,52,89,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(234,245,251,0.45))] px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 flex size-12 items-center justify-center rounded-full border border-[var(--cerulean)]/15 bg-white text-[var(--cerulean)] shadow-sm">
          {icon}
        </div>
      ) : null}
      <div className="max-w-sm space-y-2">
        <h3 className="text-lg font-semibold tracking-tight text-[var(--ink-black)]">{title}</h3>
        {description ? <p className="text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{actions}</div> : null}
    </div>
  );
}
