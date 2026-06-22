import { clamp, gaussianNoise } from "@/app/api/sensors/_lib/noise";
import {
  SENSOR_DEFINITION_MAP,
  SENSOR_DEFINITIONS,
} from "@/app/lib/sensor-definitions";
import type { SensorReading } from "@/app/lib/sensor-types";
import { sensorStatusForValue } from "@/app/lib/sensor-types";

export type ScenarioMode =
  | "NOMINAL"
  | "SCENARIO_A"
  | "SCENARIO_B"
  | "SCENARIO_C";

const NOMINAL_MIDPOINTS: Record<string, number> = {
  "GAS-Z3": 8,
  "GAS-Z1": 8,
  "TEMP-U2": 65,
  "TEMP-Z3": 28,
  "PRES-Z1": 5.2,
  "VIB-U2": 1.1,
  "VIB-U4": 0.9,
};

const SCENARIO_RAMP_STEPS = Number(process.env.SCENARIO_RAMP_STEPS ?? 30);

function getScenarioTargets(): Partial<
  Record<ScenarioMode, Record<string, { target: number; rampTicks: number }>>
> {
  return {
    SCENARIO_A: {
      "GAS-Z3": { target: 85, rampTicks: SCENARIO_RAMP_STEPS },
    },
    SCENARIO_B: {
      "TEMP-U2": {
        target: 92,
        rampTicks: Math.round(SCENARIO_RAMP_STEPS * 0.85),
      },
      "VIB-U2": {
        target: 5.8,
        rampTicks: Math.round(SCENARIO_RAMP_STEPS * 0.35),
      },
    },
    SCENARIO_C: {
      "PRES-Z1": {
        target: 9.2,
        rampTicks: Math.round(SCENARIO_RAMP_STEPS * 0.65),
      },
    },
  };
}

class SensorMockEngine {
  private values = new Map<string, number>();
  private manualOverrides = new Set<string>();
  private mode: ScenarioMode = "NOMINAL";
  private scenarioTicks = 0;
  private lastTickAt = 0;

  constructor() {
    this.resetToNominal();
  }

  /** Advance mock state at most once per intervalMs (shared by SSE + risk poll). */
  tickIfDue(intervalMs = 1000): {
    readings: SensorReading[];
    advanced: boolean;
  } {
    const now = Date.now();
    if (now - this.lastTickAt < intervalMs) {
      return { readings: this.getLatestReadings(), advanced: false };
    }
    this.lastTickAt = now;
    return { readings: this.tick(), advanced: true };
  }

  resetToNominal(): void {
    this.mode = "NOMINAL";
    this.scenarioTicks = 0;
    this.manualOverrides.clear();
    for (const def of SENSOR_DEFINITIONS) {
      const mid =
        NOMINAL_MIDPOINTS[def.id] ?? (def.nominalMin + def.nominalMax) / 2;
      this.values.set(def.id, mid + gaussianNoise(0, 0.5));
    }
  }

  setMode(mode: ScenarioMode): void {
    this.mode = mode;
    this.scenarioTicks = 0;
  }

  getMode(): ScenarioMode {
    return this.mode;
  }

  tick(): SensorReading[] {
    if (this.mode !== "NOMINAL") {
      this.scenarioTicks += 1;
    }

    for (const def of SENSOR_DEFINITIONS) {
      if (this.manualOverrides.has(def.id)) continue;

      const current = this.values.get(def.id) ?? NOMINAL_MIDPOINTS[def.id] ?? 0;
      const scenarioConfig = getScenarioTargets()[this.mode]?.[def.id];

      if (scenarioConfig) {
        const { target, rampTicks } = scenarioConfig;
        const start =
          NOMINAL_MIDPOINTS[def.id] ?? (def.nominalMin + def.nominalMax) / 2;
        const progress = Math.min(1, this.scenarioTicks / rampTicks);
        const linear = start + (target - start) * progress;
        this.values.set(
          def.id,
          clamp(
            linear + gaussianNoise(0, 1.2),
            def.nominalMin * 0.5,
            target + 5,
          ),
        );
      } else if (this.mode === "NOMINAL") {
        const drift = gaussianNoise(0, 0.3);
        const next = current + drift;
        const floor =
          def.unit === "g" ? Math.max(def.nominalMin, 0.5) : def.nominalMin;
        this.values.set(def.id, clamp(next, floor, def.nominalMax + 2));
      }
    }

    const now = new Date().toISOString();
    return SENSOR_DEFINITIONS.map((def) => {
      const value = this.values.get(def.id) ?? 0;
      return {
        sensorId: def.id,
        value: Math.round(value * 10) / 10,
        unit: def.unit,
        status: sensorStatusForValue(def, value),
        timestamp: now,
      };
    });
  }

  getLatestReadings(): SensorReading[] {
    const now = new Date().toISOString();
    return SENSOR_DEFINITIONS.map((def) => {
      const value = this.values.get(def.id) ?? NOMINAL_MIDPOINTS[def.id] ?? 0;
      return {
        sensorId: def.id,
        value: Math.round(value * 10) / 10,
        unit: def.unit,
        status: sensorStatusForValue(def, value),
        timestamp: now,
      };
    });
  }

  overrideSensor(sensorId: string, value: number): void {
    if (!SENSOR_DEFINITION_MAP.has(sensorId)) return;
    this.manualOverrides.add(sensorId);
    this.values.set(sensorId, value);
  }

  clearManualOverrides(): void {
    for (const id of this.manualOverrides) {
      const def = SENSOR_DEFINITION_MAP.get(id);
      if (def) {
        this.values.set(
          id,
          NOMINAL_MIDPOINTS[id] ?? (def.nominalMin + def.nominalMax) / 2,
        );
      }
    }
    this.manualOverrides.clear();
  }

  getManualOverrides(): string[] {
    return [...this.manualOverrides];
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __sensorMockEngine: SensorMockEngine | undefined;
}

export function getSensorMockEngine(): SensorMockEngine {
  const existing = globalThis.__sensorMockEngine;
  if (existing && typeof existing.tickIfDue === "function") {
    return existing;
  }
  const engine = new SensorMockEngine();
  globalThis.__sensorMockEngine = engine;
  return engine;
}
