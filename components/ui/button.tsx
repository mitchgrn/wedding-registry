import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-cerulean",
        secondary:
          "bg-secondary text-secondary-foreground border border-border hover:border-cerulean/30 hover:bg-fresh-sky/20",
        ghost:
          "text-muted-foreground hover:bg-muted hover:text-foreground",
        outline:
          "border border-border bg-white text-foreground hover:border-cerulean/30 hover:bg-soft-blue",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
