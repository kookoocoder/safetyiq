"use client";

import Link from "next/link";

import { useCompoundRisk } from "@/app/hooks/useCompoundRisk";
import { usePlantZones } from "@/app/hooks/usePlantZones";
import type { PlantZone } from "@/app/lib/plant-zone-types";
import { RiskBadge } from "@/components/plant/risk-badge";
import { PageHeader } from "@/components/shell";
import { Button } from "@/components/ui/button";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelLabel,
} from "@/components/ui/panel";

const HAZARD_CLASSES: PlantZone["hazardClass"][] = [
  "chemical",
  "flammable",
  "mechanical",
  "electrical",
  "general",
];

function parseIds(value: string): string[] {
  return [
    ...new Set(
      value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  ];
}

export default function ZoneManagementPage() {
  const { zones, updateZone, isHydrated } = usePlantZones();
  const { zoneRiskStates } = useCompoundRisk();
  const riskByZone = new Map(
    zoneRiskStates.map((state) => [state.zoneId, state.riskLevel]),
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="Zone Configuration"
        subtitle="Plant zones — camera and sensor assignments"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/plant">Plant Overview</Link>
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <Panel>
          <PanelHeader>
            <PanelLabel>Configured Zones</PanelLabel>
          </PanelHeader>
          <PanelContent className="p-0">
            {!isHydrated ? (
              <p className="p-4 font-mono text-xs text-op-text-muted">
                Loading…
              </p>
            ) : (
              <ul className="divide-y divide-op-border">
                {zones.map((zone) => (
                  <li
                    key={zone.id}
                    className="grid gap-4 px-4 py-4 lg:grid-cols-[minmax(140px,0.7fr)_minmax(150px,0.8fr)_1fr_1fr]"
                  >
                    <div>
                      <p className="font-mono text-sm text-foreground">
                        {zone.name}
                      </p>
                      <div className="mt-2">
                        <RiskBadge
                          level={riskByZone.get(zone.id) ?? "NOMINAL"}
                        />
                      </div>
                    </div>
                    <label className="space-y-1 font-mono text-[10px] uppercase text-op-text-muted">
                      Hazard class
                      <select
                        value={zone.hazardClass}
                        onChange={(event) =>
                          updateZone(zone.id, {
                            hazardClass: event.target
                              .value as PlantZone["hazardClass"],
                          })
                        }
                        className="block h-9 w-full rounded-sm border border-op-border bg-op-base px-2 font-mono text-xs normal-case text-foreground"
                      >
                        {HAZARD_CLASSES.map((hazardClass) => (
                          <option key={hazardClass} value={hazardClass}>
                            {hazardClass}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 font-mono text-[10px] uppercase text-op-text-muted">
                      Camera IDs
                      <input
                        key={`${zone.id}-cameras-${zone.assignedCameraIds.join(",")}`}
                        defaultValue={zone.assignedCameraIds.join(", ")}
                        onBlur={(event) =>
                          updateZone(zone.id, {
                            assignedCameraIds: parseIds(event.target.value),
                          })
                        }
                        placeholder="cam-1, cam-2"
                        className="block h-9 w-full rounded-sm border border-op-border bg-op-base px-2 font-mono text-xs normal-case text-foreground"
                      />
                    </label>
                    <label className="space-y-1 font-mono text-[10px] uppercase text-op-text-muted">
                      Sensor IDs
                      <input
                        key={`${zone.id}-sensors-${zone.assignedSensorIds.join(",")}`}
                        defaultValue={zone.assignedSensorIds.join(", ")}
                        onBlur={(event) =>
                          updateZone(zone.id, {
                            assignedSensorIds: parseIds(event.target.value),
                          })
                        }
                        placeholder="GAS-Z1, PRES-Z1"
                        className="block h-9 w-full rounded-sm border border-op-border bg-op-base px-2 font-mono text-xs normal-case text-foreground"
                      />
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </PanelContent>
        </Panel>
      </div>
    </div>
  );
}
