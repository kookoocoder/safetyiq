export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { getPermitMockEngine } from "@/app/api/permits/_lib/permit-mock-engine";
import type { PermitType } from "@/app/lib/permit-types";

const VALID_TYPES: PermitType[] = [
  "hot_work",
  "maintenance",
  "chemical",
  "confined_space",
  "electrical",
];

interface ToggleBody {
  zoneId?: string;
  permitType?: string;
  active?: boolean;
}

export async function POST(request: Request) {
  let body: ToggleBody;
  try {
    body = (await request.json()) as ToggleBody;
  } catch {
    return NextResponse.json(
      { ok: false as const, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  if (!body.zoneId || !body.permitType || typeof body.active !== "boolean") {
    return NextResponse.json(
      { ok: false as const, error: "zoneId, permitType, and active required" },
      { status: 400 },
    );
  }

  if (!VALID_TYPES.includes(body.permitType as PermitType)) {
    return NextResponse.json(
      { ok: false as const, error: "Invalid permit type" },
      { status: 400 },
    );
  }

  const record = getPermitMockEngine().togglePermit(
    body.zoneId,
    body.permitType as PermitType,
    body.active,
  );

  return NextResponse.json({
    ok: true as const,
    permit: record,
    permits: getPermitMockEngine().getActivePermits(),
  });
}
