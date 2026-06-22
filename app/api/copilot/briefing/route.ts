export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { generateSafetyBriefing } from "@/app/api/copilot/_lib/copilot-llm";
import { gatherLivePlantState } from "@/app/api/copilot/_lib/plant-state";

export async function POST() {
  try {
    const state = gatherLivePlantState(10);
    const { briefing, source } = await generateSafetyBriefing(state);

    return NextResponse.json({
      ok: true as const,
      briefing,
      source,
      gatheredAt: state.gatheredAt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Briefing generation failed";
    return NextResponse.json(
      { ok: false as const, error: message },
      { status: 500 },
    );
  }
}
