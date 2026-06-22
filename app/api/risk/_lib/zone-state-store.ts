import { nanoid } from "nanoid";
import type {
  CompoundRiskEvent,
  ZoneRiskState,
} from "@/app/lib/compound-risk-types";
import type { RiskLevel } from "@/app/lib/plant-zone-types";

const MAX_EVENTS = 50;

class ZoneStateStore {
  private levels = new Map<string, RiskLevel>();

  getLevel(zoneId: string): RiskLevel {
    return this.levels.get(zoneId) ?? "NOMINAL";
  }

  setLevel(zoneId: string, level: RiskLevel): RiskLevel {
    const previous = this.getLevel(zoneId);
    this.levels.set(zoneId, level);
    return previous;
  }

  reset(): void {
    this.levels.clear();
  }
}

class CompoundEventStore {
  private events: CompoundRiskEvent[] = [];

  append(event: CompoundRiskEvent): void {
    if (this.events.some((e) => e.id === event.id)) return;
    this.events = [event, ...this.events].slice(0, MAX_EVENTS);
  }

  update(
    eventId: string,
    patch: Partial<
      Pick<
        CompoundRiskEvent,
        "llmExplanation" | "immediateActions" | "evacuationRequired"
      >
    >,
  ): void {
    this.events = this.events.map((event) =>
      event.id === eventId ? { ...event, ...patch } : event,
    );
  }

  getRecent(limit = 20): CompoundRiskEvent[] {
    return this.events.slice(0, limit);
  }

  clear(): void {
    this.events = [];
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __zoneStateStore: ZoneStateStore | undefined;
  // eslint-disable-next-line no-var
  var __compoundEventStore: CompoundEventStore | undefined;
}

export function getZoneStateStore(): ZoneStateStore {
  if (!globalThis.__zoneStateStore) {
    globalThis.__zoneStateStore = new ZoneStateStore();
  }
  return globalThis.__zoneStateStore;
}

export function getCompoundEventStore(): CompoundEventStore {
  if (!globalThis.__compoundEventStore) {
    globalThis.__compoundEventStore = new CompoundEventStore();
  }
  return globalThis.__compoundEventStore;
}

export function createRiskEvent(
  zone: { id: string; name: string },
  previousLevel: RiskLevel,
  state: ZoneRiskState,
  explanation: string | null,
  immediateActions: string[],
  evacuationRequired: boolean,
): CompoundRiskEvent {
  return {
    id: `evt-${nanoid(10)}`,
    zoneId: zone.id,
    zoneName: zone.name,
    previousLevel,
    newLevel: state.riskLevel,
    firedRules: state.firedRuleIds,
    contributingSignals: state.contributingSignals,
    llmExplanation: explanation,
    immediateActions,
    evacuationRequired,
    timestamp: state.evaluatedAt,
  };
}
