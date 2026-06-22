export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { getPermitMockEngine } from "@/app/api/permits/_lib/permit-mock-engine";

export async function GET() {
  const permits = getPermitMockEngine().getActivePermits();
  return NextResponse.json({
    ok: true as const,
    permits,
    timestamp: new Date().toISOString(),
  });
}
