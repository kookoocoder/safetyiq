import type { RiskLevel } from "@/app/lib/plant-zone-types";
import { cn } from "@/lib/utils";

const LEVEL_STYLES: Record<RiskLevel, string> = {
  NOMINAL: "risk-badge-nominal",
  WARNING: "risk-badge-warning",
  HIGH: "risk-badge-high",
  CRITICAL: "risk-badge-critical animate-pulse",
};

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

export function RiskBadge({ level, className }: RiskBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest",
        LEVEL_STYLES[level],
        className,
      )}
    >
      {level}
    </span>
  );
}

export const RISK_ZONE_COLORS: Record<
  RiskLevel,
  { fill: string; stroke: string; opacity: number }
> = {
  NOMINAL: { fill: "#16a34a", stroke: "#15803d", opacity: 0.12 },
  WARNING: { fill: "#ca8a04", stroke: "#a16207", opacity: 0.18 },
  HIGH: { fill: "#ea580c", stroke: "#c2410c", opacity: 0.22 },
  CRITICAL: { fill: "#dc2626", stroke: "#b91c1c", opacity: 0.28 },
};
