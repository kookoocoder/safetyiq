"use client";

import * as React from "react";

import type { CompoundRiskEvent } from "@/app/lib/compound-risk-types";

const STORAGE_KEY = "safetyiq.compound-events";
const STORE_EVENT = "safetyiq:compound-events-updated";
const MAX_ENTRIES = 100;

function readEvents(): CompoundRiskEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as CompoundRiskEvent[];
  } catch {
    return [];
  }
}

function writeEvents(events: CompoundRiskEvent[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  window.dispatchEvent(new CustomEvent(STORE_EVENT));
}

export function appendCompoundEvent(event: CompoundRiskEvent): void {
  const existing = readEvents();
  if (existing.some((e) => e.id === event.id)) return;
  const next = [event, ...existing].slice(0, MAX_ENTRIES);
  writeEvents(next);
}

export function upsertCompoundEvent(event: CompoundRiskEvent): void {
  const existing = readEvents();
  const index = existing.findIndex((entry) => entry.id === event.id);
  if (index === -1) {
    writeEvents([event, ...existing].slice(0, MAX_ENTRIES));
    return;
  }
  if (JSON.stringify(existing[index]) === JSON.stringify(event)) return;
  const next = [...existing];
  next[index] = event;
  writeEvents(next);
}

export function getCompoundEvents(): CompoundRiskEvent[] {
  return readEvents().sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function clearCompoundEvents(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(STORE_EVENT));
}

export function useCompoundEvents(): {
  events: CompoundRiskEvent[];
  isHydrated: boolean;
} {
  const [events, setEvents] = React.useState<CompoundRiskEvent[]>([]);
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    setEvents(getCompoundEvents());
    setIsHydrated(true);

    const refresh = () => setEvents(getCompoundEvents());
    window.addEventListener(STORE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(STORE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return { events, isHydrated };
}

export type { CompoundRiskEvent };
