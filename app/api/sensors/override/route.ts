export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSensorMockEngine } from "@/app/api/sensors/_lib/sensor-mock-engine";
import { SENSOR_DEFINITION_MAP } from "@/app/lib/sensor-definitions";

interface OverrideBody {
  sensorId?: string;
  value?: number;
  clear?: boolean;
}

export async function POST(request: Request) {
  let body: OverrideBody;
  try {
    body = (await request.json()) as OverrideBody;
  } catch {
    return NextResponse.json(
      { ok: false as const, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const engine = getSensorMockEngine();

  if (body.clear) {
    engine.clearManualOverrides();
    return NextResponse.json({
      ok: true as const,
      readings: engine.getLatestReadings(),
    });
  }

  if (!body.sensorId || typeof body.value !== "number") {
    return NextResponse.json(
      { ok: false as const, error: "sensorId and value required" },
      { status: 400 },
    );
  }

  if (!SENSOR_DEFINITION_MAP.has(body.sensorId)) {
    return NextResponse.json(
      { ok: false as const, error: "Unknown sensor ID" },
      { status: 400 },
    );
  }

  engine.overrideSensor(body.sensorId, body.value);

  return NextResponse.json({
    ok: true as const,
    readings: engine.getLatestReadings(),
  });
}
