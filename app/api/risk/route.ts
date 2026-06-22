export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { getPermitMockEngine } from "@/app/api/permits/_lib/permit-mock-engine";
import { getDetectionContextStore } from "@/app/api/risk/_lib/detection-context-store";
import { explainRiskEvent } from "@/app/api/risk/_lib/llm-reasoner";
import {
  hasLevelChanged,
  scoreZoneRisk,
} from "@/app/api/risk/_lib/risk-scorer";
import { evaluateRules } from "@/app/api/risk/_lib/rule-engine";
import {
  createRiskEvent,
  getCompoundEventStore,
  getZoneStateStore,
} from "@/app/api/risk/_lib/zone-state-store";
import { getScenarioController } from "@/app/api/scenario/_lib/scenario-controller";
import { getSensorMockEngine } from "@/app/api/sensors/_lib/sensor-mock-engine";
import { DEFAULT_PLANT_ZONES } from "@/app/lib/plant-zone-config";
import { SENSOR_DEFINITIONS } from "@/app/lib/sensor-definitions";

function buildZoneContext(zoneId: string) {
  const zone = DEFAULT_PLANT_ZONES.find((z) => z.id === zoneId);
  const readings = getSensorMockEngine().getLatestReadings();
  const zoneSensors = SENSOR_DEFINITIONS.filter((d) => d.zoneId === zoneId);
  const sensors: Record<string, number> = {};
  const thresholds: Record<string, number> = {};

  for (const def of zoneSensors) {
    const reading = readings.find((r) => r.sensorId === def.id);
    sensors[def.id] = reading?.value ?? 0;
    thresholds[def.id] = def.warningThreshold;
    thresholds[`${def.id}_critical`] = def.criticalThreshold;
  }

  const permits = getPermitMockEngine()
    .getPermitsForZone(zoneId)
    .map((p) => p.permitType);

  const detectedClasses =
    getDetectionContextStore().getDetectedClassesByZone(zoneId);

  return {
    zoneId,
    zoneName: zone?.name ?? zoneId,
    hazardClass: zone?.hazardClass ?? "general",
    detectedClasses,
    sensors,
    thresholds,
    activePermits: permits,
    zone,
  };
}

export function GET() {
  try {
    const evaluatedAt = new Date().toISOString();
    const zoneStateStore = getZoneStateStore();
    const eventStore = getCompoundEventStore();

    const sensorEngine = getSensorMockEngine();
    if (sensorEngine.getMode() !== "NOMINAL") {
      const tickMs = Number(process.env.SENSOR_TICK_INTERVAL_MS ?? 1000);
      const { advanced } = sensorEngine.tickIfDue(tickMs);
      if (advanced) getScenarioController().onSensorTick();
    }

    const zones = [];

    for (const zoneMeta of DEFAULT_PLANT_ZONES) {
      const ctx = buildZoneContext(zoneMeta.id);
      const matches = evaluateRules(ctx);
      const state = scoreZoneRisk(zoneMeta.id, matches, evaluatedAt);
      const previousLevel = zoneStateStore.getLevel(zoneMeta.id);

      if (hasLevelChanged(previousLevel, state.riskLevel)) {
        zoneStateStore.setLevel(zoneMeta.id, state.riskLevel);

        const event = createRiskEvent(
          zoneMeta,
          previousLevel,
          state,
          null,
          [],
          state.riskLevel === "CRITICAL",
        );
        eventStore.append(event);

        void explainRiskEvent(
          zoneMeta,
          state,
          ctx.detectedClasses,
          ctx.activePermits,
        ).then((explanation) => {
          eventStore.update(event.id, explanation);
        });
      } else {
        zoneStateStore.setLevel(zoneMeta.id, state.riskLevel);
      }

      zones.push(state);
    }

    return NextResponse.json({
      ok: true as const,
      zones,
      events: eventStore.getRecent(20),
      evaluatedAt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Risk evaluation failed";
    return NextResponse.json(
      { ok: false as const, error: message, zones: [], events: [] },
      { status: 500 },
    );
  }
}
