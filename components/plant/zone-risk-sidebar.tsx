"use client";

import type { ZoneRiskState } from "@/app/lib/compound-risk-types";
import { DEFAULT_PLANT_ZONES } from "@/app/lib/plant-zone-config";
import { RiskBadge } from "@/components/plant/risk-badge";
import { MonoLabel } from "@/components/ui/mono-label";
import { cn } from "@/lib/utils";

interface ZoneRiskSidebarProps {
  zoneRiskStates: ZoneRiskState[];
  isLoading?: boolean;
  className?: string;
}

export function ZoneRiskSidebar({
  zoneRiskStates,
  isLoading,
  className,
}: ZoneRiskSidebarProps) {
  const stateMap = new Map(zoneRiskStates.map((z) => [z.zoneId, z]));

  return (
    <aside
      className={cn(
        "flex w-44 shrink-0 flex-col overflow-hidden rounded-sm border border-op-border bg-op-surface",
        className,
      )}
    >
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-op-border bg-op-elevated px-3">
        <span className="material-symbols-outlined text-[14px] text-op-text-sec">
          map
        </span>
        <MonoLabel size="2xs">ZONE RISK</MonoLabel>
      </div>

      <ul className="flex-1 divide-y divide-op-border overflow-y-auto">
        {DEFAULT_PLANT_ZONES.map((zone) => {
          const state = stateMap.get(zone.id);
          const level = state?.riskLevel ?? "NOMINAL";
          const score = state?.compoundScore ?? 0;

          return (
            <li key={zone.id} className="flex flex-col gap-1 px-3 py-2.5">
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono text-[10px] uppercase text-foreground">
                  {zone.name}
                </span>
                <RiskBadge level={level} className="scale-90" />
              </div>
              <MonoLabel size="2xs" className="text-op-text-muted">
                {isLoading ? "…" : `score ${score}`}
              </MonoLabel>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
