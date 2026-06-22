"use client";

import { useCallback, useEffect, useState } from "react";

import type { PermitType } from "@/app/lib/permit-types";
import { Button } from "@/components/ui/button";
import { MonoLabel } from "@/components/ui/mono-label";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelLabel,
} from "@/components/ui/panel";
import { Slider } from "@/components/ui/slider";

const SENSOR_SLIDERS = [
  {
    id: "GAS-Z3",
    label: "GAS-Z3 — Zone 3 gas",
    min: 0,
    max: 100,
    step: 1,
    default: 8,
  },
  {
    id: "TEMP-U2",
    label: "TEMP-U2 — Unit 2 temp °C",
    min: 40,
    max: 100,
    step: 1,
    default: 65,
  },
  {
    id: "PRES-Z1",
    label: "PRES-Z1 — Zone 1 pressure bar",
    min: 2,
    max: 12,
    step: 0.1,
    default: 5.2,
  },
  {
    id: "VIB-U2",
    label: "VIB-U2 — Unit 2 vibration g",
    min: 0,
    max: 7,
    step: 0.1,
    default: 1.1,
  },
] as const;

const PERMIT_TOGGLES: {
  zoneId: string;
  permitType: PermitType;
  label: string;
}[] = [
  { zoneId: "zone-3", permitType: "hot_work", label: "Hot Work — Zone 3" },
  {
    zoneId: "zone-2",
    permitType: "maintenance",
    label: "Maintenance — Zone 2",
  },
  { zoneId: "zone-1", permitType: "chemical", label: "Chemical — Zone 1" },
  {
    zoneId: "zone-1",
    permitType: "confined_space",
    label: "Confined Space — Zone 1",
  },
  { zoneId: "zone-4", permitType: "electrical", label: "Electrical — Zone 4" },
];

interface ScenarioManualControlsProps {
  onStatus?: (message: string) => void;
  refreshKey?: string | null;
}

export function ScenarioManualControls({
  onStatus,
  refreshKey,
}: ScenarioManualControlsProps) {
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(SENSOR_SLIDERS.map((s) => [s.id, s.default])),
  );
  const [activePermits, setActivePermits] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const refreshPermits = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/scenario?refresh=${encodeURIComponent(refreshKey ?? "idle")}`,
      );
      const data = (await res.json()) as {
        permits?: { zoneId: string; permitType: string }[];
      };
      if (data.permits) {
        setActivePermits(
          new Set(data.permits.map((p) => `${p.zoneId}:${p.permitType}`)),
        );
      }
    } catch {
      // ignore
    }
  }, [refreshKey]);

  useEffect(() => {
    void refreshPermits();
  }, [refreshPermits]);

  const applySensor = async (sensorId: string, value: number) => {
    setBusy(true);
    try {
      const res = await fetch("/api/sensors/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sensorId, value }),
      });
      if (res.ok) {
        onStatus?.(`Set ${sensorId} → ${value}`);
      }
    } finally {
      setBusy(false);
    }
  };

  const togglePermit = async (
    zoneId: string,
    permitType: PermitType,
    active: boolean,
  ) => {
    setBusy(true);
    try {
      const res = await fetch("/api/permits/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zoneId, permitType, active }),
      });
      if (res.ok) {
        await refreshPermits();
        onStatus?.(
          `${active ? "Enabled" : "Disabled"} ${permitType} in ${zoneId}`,
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const clearOverrides = async () => {
    setBusy(true);
    try {
      await fetch("/api/sensors/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clear: true }),
      });
      setValues(
        Object.fromEntries(SENSOR_SLIDERS.map((s) => [s.id, s.default])),
      );
      onStatus?.("Manual sensor overrides cleared");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel>
        <PanelHeader>
          <PanelLabel>Manual Sensor Override</PanelLabel>
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => void clearOverrides()}
          >
            Clear
          </Button>
        </PanelHeader>
        <PanelContent className="space-y-4">
          {SENSOR_SLIDERS.map((sensor) => (
            <div key={sensor.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <MonoLabel size="2xs">{sensor.label}</MonoLabel>
                <MonoLabel size="2xs" className="text-foreground">
                  {values[sensor.id]?.toFixed(1) ?? sensor.default}
                </MonoLabel>
              </div>
              <Slider
                min={sensor.min}
                max={sensor.max}
                step={sensor.step}
                value={[values[sensor.id] ?? sensor.default]}
                onValueChange={([v]) =>
                  setValues((prev) => ({ ...prev, [sensor.id]: v }))
                }
                onValueCommit={([v]) => void applySensor(sensor.id, v)}
                disabled={busy}
              />
            </div>
          ))}
        </PanelContent>
      </Panel>

      <Panel>
        <PanelHeader>
          <PanelLabel>Permit Toggles</PanelLabel>
        </PanelHeader>
        <PanelContent className="space-y-2">
          {PERMIT_TOGGLES.map((permit) => {
            const key = `${permit.zoneId}:${permit.permitType}`;
            const isActive = activePermits.has(key);
            return (
              <div
                key={key}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2"
              >
                <span className="font-mono text-[10px] text-muted-foreground">
                  {permit.label}
                </span>
                <Button
                  size="sm"
                  variant={isActive ? "default" : "outline"}
                  disabled={busy}
                  onClick={() =>
                    void togglePermit(
                      permit.zoneId,
                      permit.permitType,
                      !isActive,
                    )
                  }
                >
                  {isActive ? "ON" : "OFF"}
                </Button>
              </div>
            );
          })}
        </PanelContent>
      </Panel>
    </div>
  );
}
