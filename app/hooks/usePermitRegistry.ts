"use client";

import { useEffect, useMemo, useState } from "react";

import type { PermitRecord } from "@/app/lib/permit-types";

export interface UsePermitRegistryResult {
  permits: PermitRecord[];
  permitsByZone: Map<string, PermitRecord[]>;
  isLoading: boolean;
  error: string | null;
}

export function usePermitRegistry(pollMs = 5000): UsePermitRegistryResult {
  const [permits, setPermits] = useState<PermitRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetchPermits = async () => {
      try {
        const res = await fetch("/api/permits", { signal: controller.signal });
        const data = (await res.json()) as {
          ok: boolean;
          permits?: PermitRecord[];
          error?: string;
        };
        if (cancelled) return;
        if (!data.ok || !data.permits) {
          setError(data.error ?? "Failed to load permits");
          return;
        }
        setPermits(data.permits);
        setError(null);
      } catch (err) {
        if (
          cancelled ||
          (err instanceof DOMException && err.name === "AbortError")
        )
          return;
        setError("Permit registry unreachable");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchPermits();
    const interval = setInterval(fetchPermits, pollMs);

    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(interval);
    };
  }, [pollMs]);

  const permitsByZone = useMemo(() => {
    const map = new Map<string, PermitRecord[]>();
    for (const permit of permits) {
      const list = map.get(permit.zoneId) ?? [];
      list.push(permit);
      map.set(permit.zoneId, list);
    }
    return map;
  }, [permits]);

  return { permits, permitsByZone, isLoading, error };
}
