"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { SensorReading } from "@/app/lib/sensor-types";

export type SensorConnectionStatus = "connecting" | "live" | "error";

const HISTORY_SECONDS = 60;

export interface UseSensorFeedResult {
  readings: SensorReading[];
  history: Map<string, SensorReading[]>;
  connectionStatus: SensorConnectionStatus;
}

export function useSensorFeed(): UseSensorFeedResult {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [history, setHistory] = useState<Map<string, SensorReading[]>>(
    () => new Map(),
  );
  const [connectionStatus, setConnectionStatus] =
    useState<SensorConnectionStatus>("connecting");
  const historyRef = useRef<Map<string, SensorReading[]>>(new Map());

  const appendHistory = useCallback((batch: SensorReading[]) => {
    const now = Date.now();
    const cutoff = now - HISTORY_SECONDS * 1000;
    const map = new Map(historyRef.current);

    for (const reading of batch) {
      const existing = map.get(reading.sensorId) ?? [];
      const pruned = existing.filter(
        (r) => new Date(r.timestamp).getTime() >= cutoff,
      );
      pruned.push(reading);
      map.set(reading.sensorId, pruned);
    }

    historyRef.current = map;
    setHistory(new Map(map));
  }, []);

  useEffect(() => {
    let source: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      setConnectionStatus("connecting");
      source = new EventSource("/api/sensors");

      source.onmessage = (event) => {
        try {
          const batch = JSON.parse(event.data) as SensorReading[];
          setReadings(batch);
          appendHistory(batch);
          setConnectionStatus("live");
        } catch {
          setConnectionStatus("error");
        }
      };

      source.onerror = () => {
        source?.close();
        setConnectionStatus("error");
        if (!cancelled) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return () => {
      cancelled = true;
      source?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [appendHistory]);

  return { readings, history, connectionStatus };
}
