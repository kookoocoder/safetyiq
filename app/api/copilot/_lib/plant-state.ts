import { getPermitMockEngine } from "@/app/api/permits/_lib/permit-mock-engine";
import { getDetectionContextStore } from "@/app/api/risk/_lib/detection-context-store";
import { scoreZoneRisk } from "@/app/api/risk/_lib/risk-scorer";
import { evaluateRules } from "@/app/api/risk/_lib/rule-engine";
import { getCompoundEventStore } from "@/app/api/risk/_lib/zone-state-store";
import { getScenarioController } from "@/app/api/scenario/_lib/scenario-controller";
import { getSensorMockEngine } from "@/app/api/sensors/_lib/sensor-mock-engine";
import type {
  CompoundRiskEvent,
  ContributingSignal,
} from "@/app/lib/compound-risk-types";
import { DEFAULT_PLANT_ZONES } from "@/app/lib/plant-zone-config";
import type { RiskLevel } from "@/app/lib/plant-zone-types";
import { SENSOR_DEFINITIONS } from "@/app/lib/sensor-definitions";
import type { SensorStatus, SensorUnit } from "@/app/lib/sensor-types";

const DEFAULT_EVENT_LIMIT = 10;

export interface PlantSensorSnapshot {
  sensorId: string;
  name: string;
  zoneId: string;
  value: number;
  unit: SensorUnit;
  status: SensorStatus;
  warningThreshold: number;
  criticalThreshold: number;
}

export interface PlantPermitSnapshot {
  id: string;
  zoneId: string;
  permitType: string;
  displayName: string;
  status: string;
  issuedBy: string;
  validUntil: string;
}

export interface PlantZoneSnapshot {
  zoneId: string;
  zoneName: string;
  hazardClass: string;
  riskLevel: RiskLevel;
  compoundScore: number;
  firedRuleIds: string[];
  contributingSignals: ContributingSignal[];
  detectedClasses: string[];
  activePermits: string[];
}

export interface LivePlantState {
  gatheredAt: string;
  zones: PlantZoneSnapshot[];
  sensors: PlantSensorSnapshot[];
  permits: PlantPermitSnapshot[];
  recentEvents: CompoundRiskEvent[];
}

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
  };
}

/** Gather full live plant state for Plant Copilot (briefing + ask). */
export function gatherLivePlantState(
  eventLimit = DEFAULT_EVENT_LIMIT,
): LivePlantState {
  const gatheredAt = new Date().toISOString();
  const sensorEngine = getSensorMockEngine();

  if (sensorEngine.getMode() !== "NOMINAL") {
    const tickMs = Number(process.env.SENSOR_TICK_INTERVAL_MS ?? 1000);
    const { advanced } = sensorEngine.tickIfDue(tickMs);
    if (advanced) getScenarioController().onSensorTick();
  }

  const readings = sensorEngine.getLatestReadings();
  const sensors: PlantSensorSnapshot[] = SENSOR_DEFINITIONS.map((def) => {
    const reading = readings.find((r) => r.sensorId === def.id);
    return {
      sensorId: def.id,
      name: def.name,
      zoneId: def.zoneId,
      value: reading?.value ?? 0,
      unit: def.unit,
      status: reading?.status ?? "offline",
      warningThreshold: def.warningThreshold,
      criticalThreshold: def.criticalThreshold,
    };
  });

  const permits: PlantPermitSnapshot[] = getPermitMockEngine()
    .getActivePermits()
    .map((p) => ({
      id: p.id,
      zoneId: p.zoneId,
      permitType: p.permitType,
      displayName: p.displayName,
      status: p.status,
      issuedBy: p.issuedBy,
      validUntil: p.validUntil,
    }));

  const zones: PlantZoneSnapshot[] = DEFAULT_PLANT_ZONES.map((zoneMeta) => {
    const ctx = buildZoneContext(zoneMeta.id);
    const matches = evaluateRules(ctx);
    const state = scoreZoneRisk(zoneMeta.id, matches, gatheredAt);
    return {
      zoneId: zoneMeta.id,
      zoneName: zoneMeta.name,
      hazardClass: zoneMeta.hazardClass,
      riskLevel: state.riskLevel,
      compoundScore: state.compoundScore,
      firedRuleIds: state.firedRuleIds,
      contributingSignals: state.contributingSignals,
      detectedClasses: ctx.detectedClasses,
      activePermits: ctx.activePermits,
    };
  });

  const recentEvents = getCompoundEventStore().getRecent(eventLimit);

  return { gatheredAt, zones, sensors, permits, recentEvents };
}

const HAZARD_CLASS_TO_KB: Record<string, string> = {
  chemical: "chemical_exposure",
  flammable: "fire_explosion",
  mechanical: "mechanical_failure",
  electrical: "mechanical_failure",
  general: "fire_explosion",
};

/** Derive KB hazard-type tags from current elevated zones (or all if calm). */
export function hazardTypesFromPlantState(state: LivePlantState): string[] {
  const elevated = state.zones.filter((z) => z.riskLevel !== "NOMINAL");
  const source = elevated.length > 0 ? elevated : state.zones;
  const types = source
    .map((z) => HAZARD_CLASS_TO_KB[z.hazardClass])
    .filter(Boolean);
  return [...new Set(types)];
}

/** Compact text dump of plant state for LLM user messages. */
export function formatPlantStateForPrompt(state: LivePlantState): string {
  const zoneLines = state.zones
    .map((z) => {
      const signals =
        z.contributingSignals.length > 0
          ? z.contributingSignals
              .map((s) => `${s.label}${s.value != null ? `=${s.value}` : ""}`)
              .join("; ")
          : "none";
      return `- ${z.zoneName} (${z.zoneId}): ${z.riskLevel} score=${z.compoundScore} rules=[${z.firedRuleIds.join(",") || "none"}] permits=[${z.activePermits.join(",") || "none"}] detections=[${z.detectedClasses.join(",") || "none"}] signals=[${signals}]`;
    })
    .join("\n");

  const sensorLines = state.sensors
    .map(
      (s) =>
        `- ${s.sensorId} (${s.name}, ${s.zoneId}): ${s.value} ${s.unit} [${s.status}] warn≥${s.warningThreshold} crit≥${s.criticalThreshold}`,
    )
    .join("\n");

  const permitLines =
    state.permits.length > 0
      ? state.permits
          .map(
            (p) =>
              `- ${p.displayName} @ ${p.zoneId} (until ${p.validUntil}, by ${p.issuedBy})`,
          )
          .join("\n")
      : "- none";

  const eventLines =
    state.recentEvents.length > 0
      ? state.recentEvents
          .map(
            (e) =>
              `- ${e.timestamp} ${e.zoneName}: ${e.previousLevel}→${e.newLevel} rules=[${e.firedRules.join(",")}] ${e.llmExplanation ?? ""}`,
          )
          .join("\n")
      : "- none";

  return `Gathered at: ${state.gatheredAt}

ZONE RISK STATES:
${zoneLines}

SENSORS (value vs thresholds):
${sensorLines}

ACTIVE PERMITS:
${permitLines}

RECENT COMPOUND EVENTS:
${eventLines}`;
}
