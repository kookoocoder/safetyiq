"use client";

import { SENSOR_DEFINITIONS } from "@/app/lib/sensor-definitions";
import type { SensorReading, SensorStatus } from "@/app/lib/sensor-types";
import { SensorSparkline } from "@/components/plant/sensor-sparkline";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelLabel,
} from "@/components/ui/panel";
import { cn } from "@/lib/utils";

interface SensorDashboardProps {
  readings: SensorReading[];
  history: Map<string, SensorReading[]>;
  connectionStatus: "connecting" | "live" | "error";
  className?: string;
}

export function SensorDashboard({
  readings,
  history,
  connectionStatus,
  className,
}: SensorDashboardProps) {
  const readingMap = new Map(readings.map((r) => [r.sensorId, r]));

  return (
    <Panel className={cn("shrink-0", className)}>
      <PanelHeader>
        <PanelLabel>Sensor Readings</PanelLabel>
        <span
          className={cn(
            "font-mono text-[9px] uppercase tracking-widest",
            connectionStatus === "live"
              ? "text-emerald-700"
              : connectionStatus === "error"
                ? "text-red-700"
                : "text-op-text-muted",
          )}
        >
          {connectionStatus === "live" ? "● LIVE SSE" : connectionStatus}
        </span>
      </PanelHeader>
      <PanelContent className="overflow-visible p-2">
        <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 min-[500px]:grid-cols-3">
          {SENSOR_DEFINITIONS.map((def) => {
            const reading = readingMap.get(def.id);
            const sensorHistory = history.get(def.id) ?? [];
            const value = reading?.value ?? def.nominalMax / 2;
            const status = reading?.status ?? "offline";
            const valuePercentage = Math.min(
              100,
              (value / def.criticalThreshold) * 100,
            );
            return (
              <div
                key={def.id}
                className="rounded-sm border border-op-border bg-op-elevated px-2.5 py-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-[9px] uppercase tracking-wider text-op-text-sec">
                      {def.id}
                    </p>
                    <p className="mt-0.5 font-mono text-lg font-medium leading-none tabular-nums text-foreground">
                      {value}
                      <span className="ml-1 text-[9px] font-normal text-op-text-muted">
                        {unitLabel(def.unit)}
                      </span>
                    </p>
                  </div>
                  <span
                    className={cn(
                      "mt-0.5 inline-flex shrink-0 items-center gap-1 font-mono text-[8px] uppercase tracking-wide",
                      STATUS_TEXT[status],
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-1.5 rounded-full",
                        STATUS_DOT[status],
                      )}
                    />
                    {status}
                  </span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-op-text-muted">
                  <div
                    className={cn("h-full rounded-full", STATUS_DOT[status])}
                    style={{ width: `${valuePercentage}%` }}
                  />
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <SensorSparkline
                    history={sensorHistory}
                    warningAt={def.warningThreshold}
                    criticalAt={def.criticalThreshold}
                    className="min-w-0 flex-1"
                  />
                  <span className="shrink-0 font-mono text-[8px] text-op-text-muted">
                    W {def.warningThreshold} · C {def.criticalThreshold}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </PanelContent>
    </Panel>
  );
}

const STATUS_TEXT: Record<SensorStatus, string> = {
  nominal: "text-emerald-700",
  warning: "text-amber-700",
  critical: "text-red-700",
  offline: "text-op-text-muted",
};

const STATUS_DOT: Record<SensorStatus, string> = {
  nominal: "bg-emerald-500",
  warning: "bg-amber-500",
  critical: "bg-red-500",
  offline: "bg-op-text-muted",
};

function unitLabel(unit: string): string {
  return unit === "celsius" ? "°C" : unit === "ppm" ? "ppm" : unit;
}
