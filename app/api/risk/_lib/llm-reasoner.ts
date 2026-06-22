import { RISK_RULES } from "@/app/api/risk/_lib/rule-engine";
import type {
  CompoundRiskEvent,
  ZoneRiskState,
} from "@/app/lib/compound-risk-types";
import { createLmStudioClientForRequest } from "@/app/lib/lmstudio-client-factory";
import { formatKbContext } from "@/lib/hazard-kb/kb-loader";
import {
  buildReasonerSystemPrompt,
  buildReasonerUserMessage,
  type ReasonerInput,
  type ReasonerOutput,
} from "@/lib/hazard-kb/reasoner-prompt";

const RISK_LLM_ENABLED = process.env.RISK_LLM_ENABLED !== "false";
const RISK_LLM_TIMEOUT_MS = Number(process.env.RISK_LLM_TIMEOUT_MS ?? 8000);

async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () => reject(new Error(`Risk reasoning timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );
  });
  try {
    return await Promise.race([operation, expired]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function hazardTypesForRules(ruleIds: string[]): string[] {
  const map: Record<string, string> = {
    R001: "fire_explosion",
    R002: "fire_explosion",
    R003: "fire_explosion",
    R004: "mechanical_failure",
    R005: "mechanical_failure",
    R006: "chemical_exposure",
    R007: "chemical_exposure",
    R008: "fire_explosion",
  };
  return [...new Set(ruleIds.map((id) => map[id]).filter(Boolean))];
}

function templateFallback(
  state: ZoneRiskState,
  zoneName: string,
): ReasonerOutput {
  const ruleNames = state.firedRuleIds
    .map((id) => RISK_RULES.find((r) => r.id === id)?.name ?? id)
    .join("; ");
  const sensorLines = state.contributingSignals
    .filter((s) => s.type === "sensor")
    .map((s) => s.label)
    .join(", ");

  return {
    explanation: `Compound risk elevated in ${zoneName}. Rules fired: ${ruleNames}. Contributing readings: ${sensorLines || "see signal panel"}. Immediate review required.`,
    immediateActions: [
      "Evacuate non-essential personnel from affected zone",
      "Notify site supervisor and HSE officer",
      "Isolate ignition sources and verify permit status",
      "Monitor sensors until readings return to nominal",
    ],
    evacuationRequired: state.riskLevel === "CRITICAL",
  };
}

export async function explainRiskEvent(
  zone: { id: string; name: string; hazardClass: string },
  state: ZoneRiskState,
  detectedClasses: string[],
  activePermits: string[],
): Promise<
  Pick<
    CompoundRiskEvent,
    "llmExplanation" | "immediateActions" | "evacuationRequired"
  >
> {
  const firedRules = state.firedRuleIds.map((id) => {
    const rule = RISK_RULES.find((r) => r.id === id);
    return {
      id,
      name: rule?.name ?? id,
      severity: rule?.severity ?? "HIGH",
    };
  });

  const input: ReasonerInput = {
    zoneId: zone.id,
    zoneName: zone.name,
    hazardClass: zone.hazardClass,
    firedRules,
    sensorReadings: state.contributingSignals.flatMap((signal) => {
      if (
        signal.type !== "sensor" ||
        signal.sensorId === undefined ||
        signal.value === undefined ||
        signal.threshold === undefined
      ) {
        return [];
      }
      return [
        {
          label: signal.sensorId,
          value: signal.value,
          threshold: signal.threshold,
        },
      ];
    }),
    activePermits,
    detectedClasses,
    timestamp: state.evaluatedAt,
  };

  if (!RISK_LLM_ENABLED) {
    const fb = templateFallback(state, zone.name);
    return {
      llmExplanation: fb.explanation,
      immediateActions: fb.immediateActions,
      evacuationRequired: fb.evacuationRequired,
    };
  }

  try {
    const kbContext = formatKbContext(hazardTypesForRules(state.firedRuleIds));
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
            { role: "system", content: buildReasonerSystemPrompt(kbContext) },
            { role: "user", content: buildReasonerUserMessage(input) },
          ],
          {
            maxTokens: 400,
            temperature: 0.1,
            structured: {
              type: "json",
              jsonSchema: {
                type: "object",
                properties: {
                  explanation: { type: "string" },
                  immediateActions: {
                    type: "array",
                    items: { type: "string" },
                  },
                  evacuationRequired: { type: "boolean" },
                },
                required: [
                  "explanation",
                  "immediateActions",
                  "evacuationRequired",
                ],
              },
            },
          },
        );
      })(),
      RISK_LLM_TIMEOUT_MS,
    );

    const raw = response?.content?.trim();
    if (!raw) throw new Error("Empty LLM response");
    const parsed = JSON.parse(raw) as ReasonerOutput;
    return {
      llmExplanation: parsed.explanation,
      immediateActions: parsed.immediateActions.slice(0, 5),
      evacuationRequired: parsed.evacuationRequired,
    };
  } catch {
    const fb = templateFallback(state, zone.name);
    return {
      llmExplanation: fb.explanation,
      immediateActions: fb.immediateActions,
      evacuationRequired: fb.evacuationRequired,
    };
  }
}
