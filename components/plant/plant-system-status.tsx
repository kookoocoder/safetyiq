"use client";

import { useEffect, useState } from "react";

import { MonoLabel } from "@/components/ui/mono-label";

export function PlantSystemStatus() {
  const [mode, setMode] = useState("NOMINAL");
  const [scenario, setScenario] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch("/api/scenario");
        const data = (await res.json()) as {
          mode?: string;
          activeScenario?: string | null;
        };
        if (cancelled) return;
        setMode(data.mode ?? "NOMINAL");
        setScenario(data.activeScenario ?? null);
      } catch {
        // ignore
      }
    };
    poll();
    const id = setInterval(poll, 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="flex shrink-0 items-center justify-between border-t border-border bg-card px-4 py-1.5 sm:px-6">
      <MonoLabel size="2xs">
        SENSOR MODE: <span className="font-medium text-foreground">{mode}</span>
        {scenario ? ` · SCENARIO ${scenario} ACTIVE` : ""}
      </MonoLabel>
      <MonoLabel size="2xs" className="text-muted-foreground">
        SafetyIQ · compound risk fusion online
      </MonoLabel>
    </div>
  );
}
