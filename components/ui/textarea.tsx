import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-28 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground/60 transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15",
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";
