import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // Base: compact mono uppercase — light SaaS
  "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-md border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider whitespace-nowrap transition-colors [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        muted:
          "border-border bg-muted text-muted-foreground",
        outline:
          "border-border bg-transparent text-foreground",
        nominal:
          "risk-badge-nominal border",
        "outline-nominal":
          "border-emerald-300 bg-transparent text-emerald-700",
        warning:
          "risk-badge-warning border",
        "outline-warning":
          "border-amber-300 bg-transparent text-amber-700",
        critical:
          "risk-badge-critical border",
        "outline-critical":
          "border-red-300 bg-transparent text-red-700",
        destructive:
          "border-red-200 bg-red-50 text-red-700",
        secondary:
          "border-border bg-secondary text-secondary-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
