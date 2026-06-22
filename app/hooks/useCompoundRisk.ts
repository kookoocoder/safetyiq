"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { upsertCompoundEvent } from "@/app/lib/compound-event-store";
import type {
  CompoundRiskEvent,
  ZoneRiskState,
} from "@/app/lib/compound-risk-types";
import { syncCompoundEventToThreatLog } from "@/app/lib/compound-threat-bridge";
import type { RiskLevel } from "@/app/lib/plant-zone-types";

export interface UseCompoundRiskOptions {
  pollMs?: number;
  onCritical?: (event: CompoundRiskEvent) => void;
}

export interface UseCompoundRiskResult {
  zoneRiskStates: ZoneRiskState[];
  recentEvents: CompoundRiskEvent[];
  isLoading: boolean;
  error: string | null;
}

export function useCompoundRisk(
  options: UseCompoundRiskOptions = {},
): UseCompoundRiskResult {
  const { pollMs = 2000, onCritical } = options;
  const [zoneRiskStates, setZoneRiskStates] = useState<ZoneRiskState[]>([]);
  const [recentEvents, setRecentEvents] = useState<CompoundRiskEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousLevels = useRef<Map<string, RiskLevel>>(new Map());
  const seenEventIds = useRef<Set<string>>(new Set());
  const onCriticalRef = useRef(onCritical);
  onCriticalRef.current = onCritical;

  const processEvents = useCallback((events: CompoundRiskEvent[]) => {
    for (const event of events) {
      const isNew = !seenEventIds.current.has(event.id);
      seenEventIds.current.add(event.id);
      upsertCompoundEvent(event);
      if (isNew) {
        syncCompoundEventToThreatLog(event);
      }
      if (isNew && event.newLevel === "CRITICAL") {
        onCriticalRef.current?.(event);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetchRisk = async () => {
      try {
        const res = await fetch("/api/risk", { signal: controller.signal });
        const data = (await res.json()) as {
          ok: boolean;
          zones?: ZoneRiskState[];
          events?: CompoundRiskEvent[];
          error?: string;
        };
        if (cancelled) return;
        if (!data.ok || !data.zones) {
          setError(data.error ?? "Risk evaluation failed");
          return;
        }

        for (const zone of data.zones) {
          previousLevels.current.set(zone.zoneId, zone.riskLevel);
        }

        setZoneRiskStates(data.zones);
        if (data.events) {
          processEvents(data.events);
          setRecentEvents(data.events);
        }
        setError(null);
      } catch (err) {
        if (
          cancelled ||
          (err instanceof DOMException && err.name === "AbortError")
        )
          return;
        setError("Risk API unreachable");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchRisk();
    const interval = setInterval(fetchRisk, pollMs);

    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(interval);
    };
  }, [pollMs, processEvents]);

  return { zoneRiskStates, recentEvents, isLoading, error };
}
