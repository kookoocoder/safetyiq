import { getPermitMockEngine } from "@/app/api/permits/_lib/permit-mock-engine";
import { getDetectionContextStore } from "@/app/api/risk/_lib/detection-context-store";
import {
  getSensorMockEngine,
  type ScenarioMode,
} from "@/app/api/sensors/_lib/sensor-mock-engine";

const SCENARIO_MODE_MAP = {
  A: "SCENARIO_A",
  B: "SCENARIO_B",
  C: "SCENARIO_C",
} as const satisfies Record<"A" | "B" | "C", ScenarioMode>;

class ScenarioController {
  private activeScenario: "A" | "B" | "C" | null = null;
  private tickCount = 0;

  trigger(scenario: "A" | "B" | "C"): void {
    this.activeScenario = scenario;
    this.tickCount = 0;
    const sensorEngine = getSensorMockEngine();
    const permitEngine = getPermitMockEngine();
    sensorEngine.setMode(SCENARIO_MODE_MAP[scenario]);

    if (scenario === "A") permitEngine.triggerScenarioA();
    if (scenario === "B") permitEngine.triggerScenarioB();
    if (scenario === "C") permitEngine.triggerScenarioC();
  }

  reset(): void {
    this.activeScenario = null;
    this.tickCount = 0;
    getSensorMockEngine().resetToNominal();
    getPermitMockEngine().resetToNominal();
  }

  /** Called on each sensor tick to inject demo detections at the right moment. */
  onSensorTick(): void {
    if (!this.activeScenario) return;
    this.tickCount += 1;

    const store = getDetectionContextStore();
    const readings = getSensorMockEngine().getLatestReadings();

    if (this.activeScenario === "A") {
      const gas = readings.find((r) => r.sensorId === "GAS-Z3")?.value ?? 0;
      if (gas > 50 || this.tickCount >= 18) {
        store.setDemoDetections("zone-3", ["person"]);
      }
    }

    if (this.activeScenario === "C" && this.tickCount >= 12) {
      store.setDemoDetections("zone-1", ["person"]);
    }
  }

  getActiveScenario(): "A" | "B" | "C" | null {
    return this.activeScenario;
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __scenarioController: ScenarioController | undefined;
}

export function getScenarioController(): ScenarioController {
  if (!globalThis.__scenarioController) {
    globalThis.__scenarioController = new ScenarioController();
  }
  return globalThis.__scenarioController;
}

export { SCENARIO_MODE_MAP };
