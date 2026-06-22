export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { getPermitMockEngine } from "@/app/api/permits/_lib/permit-mock-engine";
import { getDetectionContextStore } from "@/app/api/risk/_lib/detection-context-store";
import {
  getCompoundEventStore,
  getZoneStateStore,
} from "@/app/api/risk/_lib/zone-state-store";
import { getScenarioController } from "@/app/api/scenario/_lib/scenario-controller";
import { getSensorMockEngine } from "@/app/api/sensors/_lib/sensor-mock-engine";

interface ScenarioBody {
  scenario?: "A" | "B" | "C" | null;
  action?: "trigger" | "reset";
}

export async function POST(request: Request) {
  let body: ScenarioBody;
  try {
    body = (await request.json()) as ScenarioBody;
  } catch {
    return NextResponse.json(
      { ok: false as const, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const action = body.action ?? "trigger";
  const controller = getScenarioController();

  if (action === "reset") {
    controller.reset();
    getZoneStateStore().reset();
    getCompoundEventStore().clear();
    getDetectionContextStore().clearDemoOverrides();
    getSensorMockEngine().clearManualOverrides();
    return NextResponse.json({
      ok: true as const,
      mode: getSensorMockEngine().getMode(),
    });
  }

  if (!body.scenario || !["A", "B", "C"].includes(body.scenario)) {
    return NextResponse.json(
      { ok: false as const, error: "scenario must be A, B, or C" },
      { status: 400 },
    );
  }

  controller.trigger(body.scenario);

  return NextResponse.json({
    ok: true as const,
    scenario: body.scenario,
    mode: getSensorMockEngine().getMode(),
    permits: getPermitMockEngine().getActivePermits(),
  });
}

export async function GET() {
  const engine = getSensorMockEngine();
  return NextResponse.json({
    ok: true as const,
    mode: engine.getMode(),
    manualOverrides: engine.getManualOverrides(),
    permits: getPermitMockEngine().getActivePermits(),
    activeScenario: getScenarioController().getActiveScenario(),
  });
}
