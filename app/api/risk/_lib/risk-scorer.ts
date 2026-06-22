import type { RuleMatch, ZoneRiskState } from "@/app/lib/compound-risk-types";
import type { RiskLevel } from "@/app/lib/plant-zone-types";

const SEVERITY_RANK: Record<string, number> = {
  WARNING: 1,
  HIGH: 2,
  CRITICAL: 3,
};

const SCORE_WEIGHTS: Record<string, number> = {
  CRITICAL: 40,
  HIGH: 20,
  WARNING: 5,
};

export function scoreZoneRisk(
  zoneId: string,
  matches: RuleMatch[],
  evaluatedAt: string,
): ZoneRiskState {
  if (matches.length === 0) {
    return {
      zoneId,
      riskLevel: "NOMINAL",
      compoundScore: 0,
      firedRuleIds: [],
      contributingSignals: [],
      evaluatedAt,
    };
  }

  let riskLevel: RiskLevel = "WARNING";
  let compoundScore = 0;
  const firedRuleIds: string[] = [];
  const signalMap = new Map<string, RuleMatch["contributingSignals"][number]>();

  for (const match of matches) {
    firedRuleIds.push(match.ruleId);
    compoundScore += SCORE_WEIGHTS[match.severity] ?? 0;
    if (SEVERITY_RANK[match.severity] > SEVERITY_RANK[riskLevel]) {
      riskLevel = match.severity as RiskLevel;
    }
    for (const signal of match.contributingSignals) {
      signalMap.set(`${signal.type}:${signal.label}`, signal);
    }
  }

  const criticalCount = matches.filter(
    (match) => match.severity === "CRITICAL",
  ).length;

  return {
    zoneId,
    riskLevel,
    compoundScore: criticalCount >= 2 ? 100 : Math.min(100, compoundScore),
    firedRuleIds,
    contributingSignals: [...signalMap.values()],
    evaluatedAt,
  };
}

export function hasEscalated(previous: RiskLevel, current: RiskLevel): boolean {
  return (SEVERITY_RANK[current] ?? 0) > (SEVERITY_RANK[previous] ?? 0);
}

export function hasLevelChanged(
  previous: RiskLevel,
  current: RiskLevel,
): boolean {
  return previous !== current;
}
