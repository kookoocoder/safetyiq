import {
  formatPlantStateForPrompt,
  hazardTypesFromPlantState,
  type LivePlantState,
} from "@/app/api/copilot/_lib/plant-state";
import { createLmStudioClientForRequest } from "@/app/lib/lmstudio-client-factory";
import type { RiskLevel } from "@/app/lib/plant-zone-types";
import { formatKbContext } from "@/lib/hazard-kb/kb-loader";

const RISK_LLM_ENABLED = process.env.RISK_LLM_ENABLED !== "false";
const RISK_LLM_TIMEOUT_MS = Number(process.env.RISK_LLM_TIMEOUT_MS ?? 8000);

export interface BriefingTopRisk {
  zoneId: string;
  zoneName: string;
  level: RiskLevel;
  reason: string;
}

export interface SafetyBriefing {
  headline: string;
  situation: string;
  topRisks: BriefingTopRisk[];
  recommendedActions: string[];
  watchItems: string[];
}

async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () => reject(new Error(`Copilot LLM timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );
  });
  try {
    return await Promise.race([operation, expired]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function levelRank(level: RiskLevel): number {
  const map: Record<RiskLevel, number> = {
    NOMINAL: 0,
    WARNING: 1,
    HIGH: 2,
    CRITICAL: 3,
  };
  return map[level];
}

export function templateBriefing(state: LivePlantState): SafetyBriefing {
  const elevated = [...state.zones]
    .filter((z) => z.riskLevel !== "NOMINAL")
    .sort((a, b) => levelRank(b.riskLevel) - levelRank(a.riskLevel));

  const criticalCount = elevated.filter(
    (z) => z.riskLevel === "CRITICAL",
  ).length;
  const highCount = elevated.filter((z) => z.riskLevel === "HIGH").length;

  const headline =
    criticalCount > 0
      ? `CRITICAL — ${criticalCount} zone${criticalCount === 1 ? "" : "s"} require immediate attention`
      : highCount > 0
        ? `Elevated risk — ${highCount} high-priority zone${highCount === 1 ? "" : "s"}`
        : elevated.length > 0
          ? `Watch posture — ${elevated.length} zone warning${elevated.length === 1 ? "" : "s"} active`
          : "Plant status NOMINAL — no compound risk alerts";

  const sensorAlerts = state.sensors.filter((s) => s.status !== "nominal");
  const situation =
    elevated.length === 0
      ? `All ${state.zones.length} zones are NOMINAL at ${state.gatheredAt}. ${state.permits.length} active permit(s). ${sensorAlerts.length === 0 ? "All sensors within thresholds." : `${sensorAlerts.length} sensor(s) above nominal — monitor closely.`}`
      : `${elevated.length} zone(s) elevated. Highest: ${elevated[0]?.zoneName} (${elevated[0]?.riskLevel}). ${state.permits.length} active permit(s). ${sensorAlerts.length} sensor reading(s) above nominal. Recent compound events: ${state.recentEvents.length}.`;

  const topRisks: BriefingTopRisk[] = (
    elevated.length > 0 ? elevated : state.zones.slice(0, 3)
  )
    .slice(0, 5)
    .map((z) => ({
      zoneId: z.zoneId,
      zoneName: z.zoneName,
      level: z.riskLevel,
      reason:
        z.firedRuleIds.length > 0
          ? `Rules ${z.firedRuleIds.join(", ")}; signals: ${z.contributingSignals.map((s) => s.label).join(", ") || "n/a"}`
          : z.riskLevel === "NOMINAL"
            ? "No compound rules fired — within operating envelope"
            : "Elevated compound score without named rule detail",
    }));

  const recommendedActions =
    elevated.length === 0
      ? [
          "Continue routine patrol and sensor trend review",
          "Verify active permits remain within validity window",
          "Keep scenario controls ready for demo drills",
        ]
      : [
          `Prioritize ${elevated[0]?.zoneName ?? "elevated zones"} — confirm personnel and ignition sources`,
          "Notify site supervisor / HSE of current risk posture",
          "Cross-check permits against hot-work and confined-space rules",
          "Hold non-essential work in elevated zones until levels drop",
        ];

  const watchItems = [
    ...sensorAlerts
      .slice(0, 4)
      .map(
        (s) =>
          `${s.sensorId}: ${s.value} ${s.unit} (${s.status}, crit≥${s.criticalThreshold})`,
      ),
    ...state.recentEvents
      .slice(0, 3)
      .map((e) => `Event ${e.zoneName}: ${e.previousLevel}→${e.newLevel}`),
  ];

  if (watchItems.length === 0) {
    watchItems.push("No active sensor alerts or recent compound events");
  }

  return {
    headline,
    situation,
    topRisks,
    recommendedActions,
    watchItems: watchItems.slice(0, 6),
  };
}

export function templateAskAnswer(_question: string): string {
  return "AI unavailable — local model did not respond. Use the live zone risk panel, sensor gauges, and permit board for current plant status, or retry the question shortly.";
}

function buildBriefingSystemPrompt(kbContext: string): string {
  return `You are Plant Copilot for SafetyIQ, an industrial compound-risk platform.
Produce a concise Safety Briefing grounded ONLY in the provided live plant state.
Use the hazard knowledge base for phrasing of actions and consequences when relevant.

${kbContext}

Respond with JSON only matching:
{
  "headline": string,
  "situation": string (2-4 sentences),
  "topRisks": [{ "zoneId": string, "zoneName": string, "level": "NOMINAL"|"WARNING"|"HIGH"|"CRITICAL", "reason": string }],
  "recommendedActions": string[] (3-6 items),
  "watchItems": string[] (2-6 short items)
}`;
}

function buildAskSystemPrompt(kbContext: string): string {
  return `You are Plant Copilot for SafetyIQ. Answer the operator's question using ONLY the provided live plant state and hazard KB context.
Be concise (2-5 sentences). If the state does not contain enough information, say so clearly.
Do not invent sensor values, permits, or events.

${kbContext}`;
}

async function callLmStudioJson(
  system: string,
  user: string,
  schema: Record<string, unknown>,
  maxTokens: number,
): Promise<string> {
  const baseUrl = process.env.LMSTUDIO_BASE_URL ?? "ws://127.0.0.1:1234";
  const modelKey =
    process.env.RISK_LLM_MODEL_KEY ??
    process.env.LMSTUDIO_WATCH_MODEL ??
    "lfm-ucf";

  const response = await withTimeout(
    (async () => {
      const client = createLmStudioClientForRequest(baseUrl);
      const model = await client.llm.model(modelKey);
      return model.respond(
        [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        {
          maxTokens,
          temperature: 0.2,
          structured: {
            type: "json",
            jsonSchema: schema,
          },
        },
      );
    })(),
    RISK_LLM_TIMEOUT_MS,
  );

  const raw = response?.content?.trim();
  if (!raw) throw new Error("Empty LLM response");
  return raw;
}

async function callLmStudioText(
  system: string,
  user: string,
  maxTokens: number,
): Promise<string> {
  const baseUrl = process.env.LMSTUDIO_BASE_URL ?? "ws://127.0.0.1:1234";
  const modelKey =
    process.env.RISK_LLM_MODEL_KEY ??
    process.env.LMSTUDIO_WATCH_MODEL ??
    "lfm-ucf";

  const response = await withTimeout(
    (async () => {
      const client = createLmStudioClientForRequest(baseUrl);
      const model = await client.llm.model(modelKey);
      return model.respond(
        [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        {
          maxTokens,
          temperature: 0.2,
          structured: {
            type: "json",
            jsonSchema: {
              type: "object",
              properties: { answer: { type: "string" } },
              required: ["answer"],
            },
          },
        },
      );
    })(),
    RISK_LLM_TIMEOUT_MS,
  );

  const raw = response?.content?.trim();
  if (!raw) throw new Error("Empty LLM response");
  const parsed = JSON.parse(raw) as { answer?: string };
  if (!parsed.answer?.trim()) throw new Error("Missing answer field");
  return parsed.answer.trim();
}

function normalizeBriefing(
  parsed: SafetyBriefing,
  fallback: SafetyBriefing,
): SafetyBriefing {
  const levels: RiskLevel[] = ["NOMINAL", "WARNING", "HIGH", "CRITICAL"];
  const topRisks = Array.isArray(parsed.topRisks)
    ? parsed.topRisks
        .filter(
          (r) =>
            r &&
            typeof r.zoneId === "string" &&
            typeof r.zoneName === "string" &&
            typeof r.reason === "string" &&
            levels.includes(r.level as RiskLevel),
        )
        .map((r) => ({
          zoneId: r.zoneId,
          zoneName: r.zoneName,
          level: r.level as RiskLevel,
          reason: r.reason,
        }))
        .slice(0, 6)
    : fallback.topRisks;

  return {
    headline:
      typeof parsed.headline === "string" && parsed.headline.trim()
        ? parsed.headline.trim()
        : fallback.headline,
    situation:
      typeof parsed.situation === "string" && parsed.situation.trim()
        ? parsed.situation.trim()
        : fallback.situation,
    topRisks: topRisks.length > 0 ? topRisks : fallback.topRisks,
    recommendedActions: Array.isArray(parsed.recommendedActions)
      ? parsed.recommendedActions
          .filter((a): a is string => typeof a === "string" && a.trim() !== "")
          .slice(0, 6)
      : fallback.recommendedActions,
    watchItems: Array.isArray(parsed.watchItems)
      ? parsed.watchItems
          .filter((a): a is string => typeof a === "string" && a.trim() !== "")
          .slice(0, 6)
      : fallback.watchItems,
  };
}

export async function generateSafetyBriefing(
  state: LivePlantState,
): Promise<{ briefing: SafetyBriefing; source: "llm" | "template" }> {
  const fallback = templateBriefing(state);

  if (!RISK_LLM_ENABLED) {
    return { briefing: fallback, source: "template" };
  }

  try {
    const kbContext = formatKbContext(hazardTypesFromPlantState(state));
    const plantText = formatPlantStateForPrompt(state);
    const raw = await callLmStudioJson(
      buildBriefingSystemPrompt(kbContext),
      `Produce a Safety Briefing for this live plant state:\n\n${plantText}`,
      {
        type: "object",
        properties: {
          headline: { type: "string" },
          situation: { type: "string" },
          topRisks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                zoneId: { type: "string" },
                zoneName: { type: "string" },
                level: {
                  type: "string",
                  enum: ["NOMINAL", "WARNING", "HIGH", "CRITICAL"],
                },
                reason: { type: "string" },
              },
              required: ["zoneId", "zoneName", "level", "reason"],
            },
          },
          recommendedActions: {
            type: "array",
            items: { type: "string" },
          },
          watchItems: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: [
          "headline",
          "situation",
          "topRisks",
          "recommendedActions",
          "watchItems",
        ],
      },
      700,
    );

    const parsed = JSON.parse(raw) as SafetyBriefing;
    return {
      briefing: normalizeBriefing(parsed, fallback),
      source: "llm",
    };
  } catch {
    return { briefing: fallback, source: "template" };
  }
}

export async function answerPlantQuestion(
  state: LivePlantState,
  question: string,
): Promise<{ answer: string; source: "llm" | "template" }> {
  const trimmed = question.trim();
  if (!trimmed) {
    return {
      answer:
        "Ask a specific question about current plant risk, sensors, or permits.",
      source: "template",
    };
  }

  if (!RISK_LLM_ENABLED) {
    return { answer: templateAskAnswer(trimmed), source: "template" };
  }

  try {
    const kbContext = formatKbContext(hazardTypesFromPlantState(state));
    const plantText = formatPlantStateForPrompt(state);
    const answer = await callLmStudioText(
      buildAskSystemPrompt(kbContext),
      `LIVE PLANT STATE:\n${plantText}\n\nOPERATOR QUESTION:\n${trimmed}`,
      350,
    );
    return { answer, source: "llm" };
  } catch {
    return { answer: templateAskAnswer(trimmed), source: "template" };
  }
}
