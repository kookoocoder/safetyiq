import { nanoid } from "nanoid";
import { PERMIT_TYPE_MAP } from "@/app/api/permits/_lib/permit-definitions";
import type { PermitRecord, PermitType } from "@/app/lib/permit-types";

function makePermit(
  zoneId: string,
  permitType: PermitType,
  issuedBy: string,
  hoursValid = 8,
): PermitRecord {
  const def = PERMIT_TYPE_MAP.get(permitType);
  const issuedAt = new Date();
  const validUntil = new Date(issuedAt.getTime() + hoursValid * 60 * 60 * 1000);
  return {
    id: `ptw-${nanoid(8)}`,
    zoneId,
    permitType,
    displayName: def?.displayName ?? permitType,
    issuedBy,
    issuedAt: issuedAt.toISOString(),
    validUntil: validUntil.toISOString(),
    status: "active",
  };
}

class PermitMockEngine {
  private permits: PermitRecord[] = [];

  constructor() {
    this.resetToNominal();
  }

  resetToNominal(): void {
    this.permits = [
      makePermit("zone-1", "chemical", "J. Martinez"),
      makePermit("zone-4", "electrical", "R. Chen"),
    ];
  }

  getActivePermits(): PermitRecord[] {
    return this.permits.filter((p) => p.status === "active");
  }

  getPermitsForZone(zoneId: string): PermitRecord[] {
    return this.getActivePermits().filter((p) => p.zoneId === zoneId);
  }

  togglePermit(
    zoneId: string,
    permitType: PermitType,
    active: boolean,
    issuedBy = "Demo Operator",
  ): PermitRecord | null {
    if (active) {
      const existing = this.permits.find(
        (p) =>
          p.zoneId === zoneId &&
          p.permitType === permitType &&
          p.status === "active",
      );
      if (existing) return existing;
      const record = makePermit(zoneId, permitType, issuedBy);
      this.permits.push(record);
      return record;
    }

    const idx = this.permits.findIndex(
      (p) =>
        p.zoneId === zoneId &&
        p.permitType === permitType &&
        p.status === "active",
    );
    if (idx >= 0) {
      this.permits[idx] = { ...this.permits[idx], status: "expired" };
      return this.permits[idx];
    }
    return null;
  }

  triggerScenarioA(): void {
    this.togglePermit("zone-3", "hot_work", true, "A. Singh");
  }

  triggerScenarioB(): void {
    this.togglePermit("zone-2", "maintenance", true, "K. Okafor");
  }

  triggerScenarioC(): void {
    // Chemical permit already active in zone-1 at startup
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __permitMockEngine: PermitMockEngine | undefined;
}

export function getPermitMockEngine(): PermitMockEngine {
  if (!globalThis.__permitMockEngine) {
    globalThis.__permitMockEngine = new PermitMockEngine();
  }
  return globalThis.__permitMockEngine;
}
