import type { PermitStatus } from "@/app/lib/permit-types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<PermitStatus, string> = {
  active: "bg-amber-50 text-amber-700 border-amber-200",
  expired: "bg-muted text-muted-foreground border-border",
  suspended: "bg-red-50 text-red-700 border-red-200",
};

interface PermitStatusBadgeProps {
  status: PermitStatus;
  className?: string;
}

export function PermitStatusBadge({
  status,
  className,
}: PermitStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-sm border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest",
        STATUS_STYLES[status],
        className,
      )}
    >
      {status}
    </span>
  );
}
