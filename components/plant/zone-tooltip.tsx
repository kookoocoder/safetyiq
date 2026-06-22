"use client";

import type { PermitRecord } from "@/app/lib/permit-types";
import type { PlantZone, RiskLevel } from "@/app/lib/plant-zone-types";
import type { SensorReading } from "@/app/lib/sensor-types";
import { RiskBadge } from "@/components/plant/risk-badge";
import { cn } from "@/lib/utils";

interface ZoneTooltipProps {
  zone: PlantZone;
  riskLevel: RiskLevel;
  readings: SensorReading[];
  permits: PermitRecord[];
  anchor: { x: number; y: number };
  className?: string;
}

export function ZoneTooltip({
  zone,
  riskLevel,
  readings,
  permits,
  anchor,
  className,
}: ZoneTooltipProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute z-20 w-56 rounded-md border border-border bg-card p-3 shadow-lg",
        className,
      )}
      style={{
        left: `${(anchor.x / 1000) * 100}%`,
        top: `${(anchor.y / 700) * 100}%`,
        transform: "translate(-50%, -110%)",
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-medium text-foreground">
          {zone.name}
        </span>
        <RiskBadge level={riskLevel} />
      </div>
      <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        {zone.hazardClass}
      </p>

      {permits.length > 0 && (
        <div className="mb-2">
          <p className="mb-1 font-mono text-[8px] uppercase text-muted-foreground">
            Active Permits
          </p>
          <ul className="space-y-0.5">
            {permits.map((p) => (
              <li key={p.id} className="font-mono text-[9px] text-amber-700">
                {p.displayName}
              </li>
            ))}
          </ul>
        </div>
      )}

      {readings.length > 0 && (
        <div>
          <p className="mb-1 font-mono text-[8px] uppercase text-muted-foreground">
            Live Readings
          </p>
          <ul className="space-y-0.5">
            {readings.map((r) => (
              <li
                key={r.sensorId}
                className="flex justify-between font-mono text-[9px] text-muted-foreground"
              >
                <span>{r.sensorId}</span>
                <span
                  className={
                    r.status === "critical"
                      ? "text-red-700"
                      : r.status === "warning"
                        ? "text-amber-700"
                        : "text-emerald-700"
                  }
                >
                  {r.value} {r.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
