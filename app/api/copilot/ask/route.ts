export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { answerPlantQuestion } from "@/app/api/copilot/_lib/copilot-llm";
import { gatherLivePlantState } from "@/app/api/copilot/_lib/plant-state";

export async function POST(request: Request) {
  try {
    let question = "";
    try {
      const body = (await request.json()) as { question?: unknown };
      question = typeof body.question === "string" ? body.question : "";
    } catch {
      question = "";
    }

    if (!question.trim()) {
      return NextResponse.json(
        { ok: false as const, error: "question is required" },
        { status: 400 },
      );
    }

    const state = gatherLivePlantState(10);
    const { answer, source } = await answerPlantQuestion(state, question);

    return NextResponse.json({
      ok: true as const,
      answer,
      source,
      gatheredAt: state.gatheredAt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Copilot ask failed";
    return NextResponse.json(
      { ok: false as const, error: message },
      { status: 500 },
    );
  }
}
