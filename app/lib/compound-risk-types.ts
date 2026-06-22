import type { RiskLevel } from "@/app/lib/plant-zone-types";

export type { RiskLevel };

export interface ContributingSignal {
  type: "detection" | "sensor" | "permit";
  label: string;
  severity: "CRITICAL" | "HIGH" | "WARNING";
  sensorId?: string;
  value?: number;
  threshold?: number;
  unit?: string;
}

export interface ZoneRiskState {
  zoneId: string;
  riskLevel: RiskLevel;
  compoundScore: number;
  firedRuleIds: string[];
  contributingSignals: ContributingSignal[];
  evaluatedAt: string;
}

export interface CompoundRiskEvent {
  id: string;
  zoneId: string;
  zoneName: string;
  previousLevel: RiskLevel;
  newLevel: RiskLevel;
  firedRules: string[];
  contributingSignals: ContributingSignal[];
  llmExplanation: string | null;
  immediateActions: string[];
  evacuationRequired: boolean;
  timestamp: string;
}

export interface RuleMatch {
  ruleId: string;
  ruleName: string;
  severity: "CRITICAL" | "HIGH" | "WARNING";
  contributingSignals: ContributingSignal[];
}

export interface ZoneRiskContext {
  zoneId: string;
  zoneName: string;
  hazardClass: string;
  detectedClasses: string[];
  sensors: Record<string, number>;
  thresholds: Record<string, number>;
  activePermits: string[];
}

export interface RiskRule {
  id: string;
  name: string;
  severity: "CRITICAL" | "HIGH" | "WARNING";
  description: string;
  evaluate: (ctx: ZoneRiskContext) => RuleMatch | null;
}
