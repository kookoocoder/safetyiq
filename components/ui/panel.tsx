import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Panel — the universal surface container.
 * White card, subtle border, soft radius.
 */
function Panel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="panel"
      className={cn(
        "flex flex-col overflow-hidden rounded-md border border-border bg-card shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

/**
 * PanelHeader — fixed-height top bar for panels.
 * Mono uppercase label on the left, optional right slot.
 * Standard sizes: sm (h-8) | default (h-10).
 */
function PanelHeader({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<"div"> & { size?: "sm" | "default" }) {
  return (
    <div
      data-slot="panel-header"
      className={cn(
        "flex shrink-0 items-center justify-between border-b border-border bg-muted/40 px-3",
        size === "sm" ? "h-9" : "h-11",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * PanelLabel — mono uppercase label used inside PanelHeader.
 */
function PanelLabel({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="panel-label"
      className={cn(
        "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

/**
 * PanelContent — scrollable flex-1 inner area.
 */
function PanelContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="panel-content"
      className={cn("flex-1 overflow-auto p-3 sm:p-4", className)}
      {...props}
    />
  );
}

export { Panel, PanelHeader, PanelLabel, PanelContent };
