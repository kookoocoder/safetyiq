"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { clearCompoundEvents } from "@/app/lib/compound-event-store";
import { ScenarioManualControls } from "@/components/plant/scenario-manual-controls";

import { PageHeader } from "@/components/shell";
import { Button } from "@/components/ui/button";
import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelLabel,
} from "@/components/ui/panel";
import { cn } from "@/lib/utils";

const SCENARIOS = [
  {
    id: "A" as const,
    title: "Scenario A — Flammable + Hot Work + Person",
    description:
      "GAS-Z3 ramps to 85ppm. Hot work permit activates in Zone 3. Person detection injected at ~18s.",
    zone: "Zone 3",
  },
  {
    id: "B" as const,
    title: "Scenario B — Overheat + Maintenance + Vibration",
    description:
      "TEMP-U2 ramps to 92°C. VIB-U2 spikes to 5.8g. Maintenance permit activates in Zone 2.",
    zone: "Zone 2",
  },
  {
    id: "C" as const,
    title: "Scenario C — Chemical + PPE + Pressure",
    description:
      "PRES-Z1 ramps to 9.2bar. Chemical permit already active. Person injected in Zone 1.",
    zone: "Zone 1",
  },
];

export default function ScenarioControlPage() {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const runScenario = useCallback(async (scenario: "A" | "B" | "C") => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario, action: "trigger" }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        setActiveScenario(scenario);
        setStatus(
          `Scenario ${scenario} triggered — watch /plant for escalation`,
        );
      } else {
        setStatus(data.error ?? "Failed to trigger scenario");
      }
    } catch {
      setStatus("Network error triggering scenario");
    } finally {
      setBusy(false);
    }
  }, []);

  const resetAll = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      const data = (await res.json()) as { ok: boolean };
      if (data.ok) {
        setActiveScenario(null);
        clearCompoundEvents();
        setStatus("All scenarios reset — zones returning to nominal");
      }
    } catch {
      setStatus("Network error resetting");
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background">
      <PageHeader
        title="Scenario Control"
        subtitle="Trigger compound risk demo scenarios for judges"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/plant">Back to Plant</Link>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={busy}
              onClick={() => void resetAll()}
            >
              Reset All
            </Button>
          </div>
        }
      />

      <div className="space-y-4 p-6">
        {status && (
          <p className="rounded-md border border-border bg-card px-3 py-2 font-mono text-xs text-muted-foreground shadow-sm">
            {status}
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          {SCENARIOS.map((scenario) => (
            <Panel
              key={scenario.id}
              className={cn(
                activeScenario === scenario.id &&
                  "border-primary ring-1 ring-primary/20",
              )}
            >
              <PanelHeader>
                <PanelLabel>{scenario.zone}</PanelLabel>
              </PanelHeader>
              <PanelContent className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">
                  {scenario.title}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {scenario.description}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() => void runScenario(scenario.id)}
                  >
                    Trigger
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy || activeScenario !== scenario.id}
                    onClick={() => void resetAll()}
                  >
                    Reset
                  </Button>
                </div>
              </PanelContent>
            </Panel>
          ))}
        </div>

        <ScenarioManualControls
          onStatus={setStatus}
          refreshKey={activeScenario}
        />

        <Panel>
          <PanelHeader>
            <PanelLabel>Demo Instructions</PanelLabel>
          </PanelHeader>
          <PanelContent className="space-y-2 font-mono text-xs text-muted-foreground">
            <p>1. Open /plant and /monitor in two tabs before triggering.</p>
            <p>
              2. Trigger Scenario A — gas climbs over ~30s, Zone 3 goes yellow
              then red.
            </p>
            <p>
              3. Watch both Zone 3 CCTV angles: gas becomes visible and workers
              begin evacuating as compound risk turns critical.
            </p>
            <p>
              4. Reset between scenarios to clear risk events and sensor ramps.
            </p>
            <p>
              5. Use manual sliders to force GAS-Z3 above 70ppm, or toggle
              permits for custom compound tests.
            </p>
          </PanelContent>
        </Panel>
      </div>
    </div>
  );
}
