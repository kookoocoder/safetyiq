"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { useCompoundRisk } from "@/app/hooks/useCompoundRisk";
import { usePermitRegistry } from "@/app/hooks/usePermitRegistry";
import { usePlantZones } from "@/app/hooks/usePlantZones";
import { useSensorFeed } from "@/app/hooks/useSensorFeed";
import type { CompoundRiskEvent } from "@/app/lib/compound-risk-types";
import type { RiskLevel } from "@/app/lib/plant-zone-types";
import { CompoundAlertModal } from "@/components/plant/compound-alert-modal";
import { CopilotPanel } from "@/components/plant/copilot-panel";
import { PermitBoard } from "@/components/plant/permit-board";
import { PlantSystemStatus } from "@/components/plant/plant-system-status";
import { RiskEventFeed } from "@/components/plant/risk-event-feed";
import { SensorDashboard } from "@/components/plant/sensor-dashboard";
import { PageHeader } from "@/components/shell";
import { Button } from "@/components/ui/button";

const Plant3DMap = dynamic(
  () =>
    import("@/components/plant/plant-3d").then((m) => ({
      default: m.Plant3DMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[320px] items-center justify-center rounded-md border border-border bg-[var(--map-bg)] font-mono text-xs text-muted-foreground shadow-sm lg:min-h-[420px]">
        Loading plant digital twin…
      </div>
    ),
  },
);

export default function PlantOverviewPage() {
  const { zones } = usePlantZones();
  const { readings, history, connectionStatus } = useSensorFeed();
  const {
    permits,
    permitsByZone,
    isLoading: permitsLoading,
  } = usePermitRegistry();
  const [alertEvent, setAlertEvent] = useState<CompoundRiskEvent | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const dismissedIds = useRef<Set<string>>(new Set());

  const handleCritical = useCallback((event: CompoundRiskEvent) => {
    if (dismissedIds.current.has(event.id)) return;
    setAlertEvent(event);
    setAlertOpen(true);
  }, []);

  const {
    zoneRiskStates,
    recentEvents,
    isLoading: riskLoading,
    error: riskError,
  } = useCompoundRisk({ onCritical: handleCritical });

  useEffect(() => {
    if (!alertEvent) return;
    const updated = recentEvents.find((e) => e.id === alertEvent.id);
    if (
      updated &&
      updated.llmExplanation &&
      updated.llmExplanation !== alertEvent.llmExplanation
    ) {
      setAlertEvent(updated);
    }
  }, [recentEvents, alertEvent]);

  const zoneRiskLevels = Object.fromEntries(
    zoneRiskStates.map((z) => [z.zoneId, z.riskLevel]),
  ) as Record<string, RiskLevel>;

  const highestRisk = zoneRiskStates.reduce<RiskLevel>(
    (max, z) => (rank(z.riskLevel) > rank(max) ? z.riskLevel : max),
    "NOMINAL",
  );

  const mapProps = {
    zones,
    zoneRiskLevels,
    readings,
    permitsByZone,
    className: "min-h-[320px] lg:min-h-[420px] h-[420px] lg:h-[520px]",
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background">
      <PageHeader
        title="Plant Overview"
        subtitle={
          riskLoading
            ? "Evaluating compound risk…"
            : `System status: ${highestRisk} — ${zoneRiskStates.filter((z) => z.riskLevel !== "NOMINAL").length} active zone alerts`
        }
        actions={
          <div className="flex items-center gap-2">
            <span className="hidden rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 font-mono text-[10px] text-emerald-700 sm:inline">
              LIVE DIGITAL TWIN
            </span>
            <Button variant="outline" size="sm" asChild>
              <Link href="/plant/scenario">Scenario Control</Link>
            </Button>
          </div>
        }
      />

      {riskError && (
        <div className="mx-6 mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 font-mono text-[10px] text-amber-800">
          Risk engine: {riskError} — sensor feed continues; rule-based fallback
          active
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_minmax(500px,0.8fr)]">
        <Plant3DMap {...mapProps} />

        <div className="flex flex-col gap-4">
          <SensorDashboard
            readings={readings}
            history={history}
            connectionStatus={connectionStatus}
          />
          <PermitBoard
            permits={permits}
            isLoading={permitsLoading}
            className="h-auto"
          />
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <RiskEventFeed events={recentEvents} className="h-auto" />
          <CopilotPanel />
        </div>
      </div>

      <CompoundAlertModal
        open={alertOpen}
        event={alertEvent}
        onAcknowledge={() => {
          if (alertEvent) dismissedIds.current.add(alertEvent.id);
          setAlertOpen(false);
        }}
      />

      <PlantSystemStatus />
    </div>
  );
}

function rank(level: RiskLevel): number {
  const map: Record<RiskLevel, number> = {
    NOMINAL: 0,
    WARNING: 1,
    HIGH: 2,
    CRITICAL: 3,
  };
  return map[level];
}
