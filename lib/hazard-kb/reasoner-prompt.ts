export interface ReasonerInput {
  zoneId: string;
  zoneName: string;
  hazardClass: string;
  firedRules: { id: string; name: string; severity: string }[];
  sensorReadings: { label: string; value: number; threshold: number }[];
  activePermits: string[];
  detectedClasses: string[];
  timestamp: string;
}

export interface ReasonerOutput {
  explanation: string;
  immediateActions: string[];
  evacuationRequired: boolean;
}

export function buildReasonerSystemPrompt(kbContext: string): string {
  return `You are an industrial safety analyst embedded in a real-time compound risk monitoring system.

${kbContext}

Respond with JSON only: { "explanation": string (max 3 sentences), "immediateActions": string[] (max 5 items), "evacuationRequired": boolean }`;
}

export function buildReasonerUserMessage(input: ReasonerInput): string {
  const rules = input.firedRules
    .map((r) => `${r.id}: ${r.name} (${r.severity})`)
    .join(", ");
  const sensors = input.sensorReadings
    .map((s) => `${s.label}: ${s.value} (threshold: ${s.threshold})`)
    .join(", ");
  return `Zone: ${input.zoneName} (${input.zoneId}), hazard class: ${input.hazardClass}
Time: ${input.timestamp}
Fired rules: ${rules}
Sensors: ${sensors}
Active permits: ${input.activePermits.join(", ") || "none"}
Detections: ${input.detectedClasses.join(", ") || "none"}`;
}
