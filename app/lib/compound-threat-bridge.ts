import type { CompoundRiskEvent } from "@/app/lib/compound-risk-types";
import { appendThreatLogEntry } from "@/app/lib/threat-log-store";

/** Mirror compound risk events into the threat log for a unified demo audit trail. */
export function syncCompoundEventToThreatLog(event: CompoundRiskEvent): void {
  if (event.newLevel !== "CRITICAL" && event.newLevel !== "HIGH") return;

  const confidence = event.newLevel === "CRITICAL" ? 96 : 82;
  const signals = event.contributingSignals.map((s) => s.label).join("; ");

  appendThreatLogEntry({
    requestId: event.id,
    timestamp: event.timestamp,
    cameraId: `ZONE:${event.zoneName}`,
    classification: `COMPOUND RISK — ${event.newLevel}`,
    confidence,
    previewText:
      event.llmExplanation ??
      `Rules: ${event.firedRules.join(", ")}. Signals: ${signals}`,
    vlmAnalysis: event.immediateActions.length
      ? event.immediateActions
      : [signals],
    verification: {
      applied: true,
      matchesPrompt: true,
      overturned: false,
      reason: "Compound risk rule engine",
      modelKey: "lfm-ucf",
      latencyMs: null,
    },
    tags: ["compound-risk", "safetyiq", event.zoneId, ...event.firedRules],
  });
}
