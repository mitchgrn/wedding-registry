import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
