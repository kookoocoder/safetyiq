"use client";

import { useCallback, useEffect, useState } from "react";

import { DEFAULT_PLANT_ZONES } from "@/app/lib/plant-zone-config";
import type { PlantZone } from "@/app/lib/plant-zone-types";

const STORAGE_KEY = "safetyiq.zone-config";
const STORE_EVENT = "safetyiq:zone-config-updated";

function readZones(): PlantZone[] {
  if (typeof window === "undefined") return DEFAULT_PLANT_ZONES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PLANT_ZONES;
    return JSON.parse(raw) as PlantZone[];
  } catch {
    return DEFAULT_PLANT_ZONES;
  }
}

function writeZones(zones: PlantZone[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(zones));
  window.dispatchEvent(new CustomEvent(STORE_EVENT));
}

export function usePlantZones() {
  const [zones, setZones] = useState<PlantZone[]>(DEFAULT_PLANT_ZONES);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setZones(readZones());
    setIsHydrated(true);

    const onUpdate = () => setZones(readZones());
    window.addEventListener(STORE_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener(STORE_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const updateZone = useCallback((id: string, patch: Partial<PlantZone>) => {
    const current = readZones();
    const next = current.map((z) => (z.id === id ? { ...z, ...patch } : z));
    writeZones(next);
    setZones(next);
  }, []);

  return { zones, updateZone, isHydrated };
}
