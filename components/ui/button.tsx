import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base: compact mono CTAs — light SaaS
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border font-mono text-xs uppercase tracking-wider whitespace-nowrap transition-colors duration-75 outline-none select-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        // Primary ink fill
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:bg-primary",
        // Bordered — secondary actions
        outline:
          "border-border bg-card text-foreground shadow-sm hover:bg-muted hover:border-op-border-active",
        // Muted fill
        secondary:
          "border-border bg-secondary text-secondary-foreground hover:bg-muted hover:border-op-border-active",
        // Ghost
        ghost:
          "border-transparent bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
        // Destructive
        destructive:
          "border-transparent bg-destructive text-white shadow-sm hover:bg-destructive/90 active:bg-destructive",
        // Text link
        link: "border-transparent bg-transparent text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 px-4",
        sm: "h-7 px-3 text-[11px]",
        lg: "h-10 px-6",
        icon: "size-8 p-0",
        "icon-sm": "size-7 p-0",
        "icon-lg": "size-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
