export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { getDetectionContextStore } from "@/app/api/risk/_lib/detection-context-store";
import { DEFAULT_PLANT_ZONES } from "@/app/lib/plant-zone-config";

interface ContextBody {
  cameraId?: string;
  classes?: string[];
  zoneId?: string;
}

export async function POST(request: Request) {
  let body: ContextBody;
  try {
    body = (await request.json()) as ContextBody;
  } catch {
    return NextResponse.json(
      { ok: false as const, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  if (!body.cameraId || !Array.isArray(body.classes)) {
    return NextResponse.json(
      { ok: false as const, error: "cameraId and classes required" },
      { status: 400 },
    );
  }

  const validZoneId =
    body.zoneId && DEFAULT_PLANT_ZONES.some((zone) => zone.id === body.zoneId)
      ? body.zoneId
      : undefined;
  getDetectionContextStore().push(body.cameraId, body.classes, validZoneId);
  return NextResponse.json({ ok: true as const });
}
