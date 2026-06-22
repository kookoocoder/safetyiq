import type * as React from "react";

import { cn } from "@/lib/utils";

interface PageHeaderProps extends React.ComponentProps<"header"> {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}

/**
 * PageHeader — page title bar with subtitle and right-side action buttons.
 * Used at the top of main content areas (Camera Management, Threat Log, etc.).
 */
function PageHeader({
  title,
  subtitle,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header
      data-slot="page-header"
      className={cn(
        "flex shrink-0 flex-col gap-3 border-b border-border bg-card px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6",
        className,
      )}
      {...props}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
        {subtitle && (
          <p className="font-mono text-xs leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </header>
  );
}

export { PageHeader };
