import type {
  RiskRule,
  RuleMatch,
  ZoneRiskContext,
} from "@/app/lib/compound-risk-types";

function sensor(ctx: ZoneRiskContext, key: string): number {
  return ctx.sensors[key] ?? 0;
}

function threshold(ctx: ZoneRiskContext, key: string): number {
  return ctx.thresholds[key] ?? Number.POSITIVE_INFINITY;
}

function hasPermit(ctx: ZoneRiskContext, type: string): boolean {
  return ctx.activePermits.includes(type);
}

function hasDetection(ctx: ZoneRiskContext, className: string): boolean {
  return ctx.detectedClasses.includes(className.toLowerCase());
}

function match(
  ruleId: string,
  ruleName: string,
  severity: RuleMatch["severity"],
  signals: RuleMatch["contributingSignals"],
): RuleMatch {
  return { ruleId, ruleName, severity, contributingSignals: signals };
}

function sensorSignal(
  sensorId: string,
  value: number,
  limit: number,
  unit: string,
  severity: RuleMatch["severity"],
  limitLabel = "threshold",
): RuleMatch["contributingSignals"][number] {
  return {
    type: "sensor",
    label: `${sensorId}: ${value}${unit} (${limitLabel}: ${limit}${unit})`,
    severity,
    sensorId,
    value,
    threshold: limit,
    unit,
  };
}

export const RISK_RULES: RiskRule[] = [
  {
    id: "R001",
    name: "Flammable Atm + Ignition + Personnel",
    severity: "CRITICAL",
    description:
      "Gas above critical threshold with hot work and person present",
    evaluate(ctx) {
      const gas = sensor(ctx, "GAS-Z3");
      const crit = threshold(ctx, "GAS-Z3_critical") || 70;
      if (
        gas <= crit ||
        !hasPermit(ctx, "hot_work") ||
        !hasDetection(ctx, "person")
      )
        return null;
      return match("R001", "Flammable Atm + Ignition + Personnel", "CRITICAL", [
        sensorSignal("GAS-Z3", gas, crit, "ppm", "CRITICAL"),
        { type: "permit", label: "Hot Work Permit active", severity: "HIGH" },
        {
          type: "detection",
          label: "Person detected (CCTV)",
          severity: "CRITICAL",
        },
      ]);
    },
  },
  {
    id: "R002",
    name: "Flammable Atmosphere + Hot Work",
    severity: "HIGH",
    description: "Elevated gas with hot work permit",
    evaluate(ctx) {
      const gas = sensor(ctx, "GAS-Z3");
      if (gas <= 50 || !hasPermit(ctx, "hot_work")) return null;
      return match("R002", "Flammable Atmosphere + Hot Work", "HIGH", [
        sensorSignal("GAS-Z3", gas, 50, "ppm", "HIGH"),
        { type: "permit", label: "Hot Work Permit active", severity: "HIGH" },
      ]);
    },
  },
  {
    id: "R003",
    name: "Gas Leak — Threshold Breach",
    severity: "WARNING",
    description: "Gas sensor above warning threshold",
    evaluate(ctx) {
      for (const key of ["GAS-Z3", "GAS-Z1"] as const) {
        if (!(key in ctx.sensors)) continue;
        const val = sensor(ctx, key);
        const warn = threshold(ctx, key);
        if (val > warn) {
          return match("R003", "Gas Leak — Threshold Breach", "WARNING", [
            sensorSignal(key, val, warn, "ppm", "WARNING", "warning"),
          ]);
        }
      }
      return null;
    },
  },
  {
    id: "R004",
    name: "Overheat + Maintenance + Vibration Spike",
    severity: "HIGH",
    description: "Temperature and vibration elevated during maintenance",
    evaluate(ctx) {
      const temp = sensor(ctx, "TEMP-U2");
      const vib = sensor(ctx, "VIB-U2");
      const tempLimit = threshold(ctx, "TEMP-U2");
      const vibLimit = threshold(ctx, "VIB-U2");
      if (
        temp <= tempLimit ||
        vib <= vibLimit ||
        !hasPermit(ctx, "maintenance")
      )
        return null;
      return match("R004", "Overheat + Maintenance + Vibration Spike", "HIGH", [
        sensorSignal("TEMP-U2", temp, tempLimit, "°C", "HIGH"),
        sensorSignal("VIB-U2", vib, vibLimit, "g", "HIGH"),
        {
          type: "permit",
          label: "Maintenance Work Order active",
          severity: "HIGH",
        },
      ]);
    },
  },
  {
    id: "R005",
    name: "Overheat + Vibration Spike",
    severity: "HIGH",
    description: "Critical temperature and vibration without permit context",
    evaluate(ctx) {
      const temp = sensor(ctx, "TEMP-U2");
      const vib = sensor(ctx, "VIB-U2");
      if (temp <= 90 || vib <= 5.0) return null;
      return match("R005", "Overheat + Vibration Spike", "HIGH", [
        sensorSignal("TEMP-U2", temp, 90, "°C", "HIGH"),
        sensorSignal("VIB-U2", vib, 5, "g", "HIGH"),
      ]);
    },
  },
  {
    id: "R006",
    name: "Chemical Permit + PPE Violation",
    severity: "HIGH",
    description:
      "Person in chemical zone without hardhat during elevated pressure",
    evaluate(ctx) {
      if (ctx.zoneId !== "zone-1") return null;
      const pressure = sensor(ctx, "PRES-Z1");
      const pressureLimit = threshold(ctx, "PRES-Z1");
      if (
        !hasPermit(ctx, "chemical") ||
        !hasDetection(ctx, "person") ||
        hasDetection(ctx, "hardhat") ||
        pressure <= pressureLimit
      )
        return null;
      return match("R006", "Chemical Permit + PPE Violation", "HIGH", [
        {
          type: "permit",
          label: "Chemical Handling Permit active",
          severity: "HIGH",
        },
        {
          type: "detection",
          label: "Person detected — no hardhat",
          severity: "HIGH",
        },
        sensorSignal("PRES-Z1", pressure, pressureLimit, "bar", "WARNING"),
      ]);
    },
  },
  {
    id: "R007",
    name: "Pressure Exceedance",
    severity: "WARNING",
    description: "Zone pressure above warning threshold",
    evaluate(ctx) {
      const pressure = sensor(ctx, "PRES-Z1");
      const pressureLimit = threshold(ctx, "PRES-Z1");
      if (pressure <= pressureLimit) return null;
      return match("R007", "Pressure Exceedance", "WARNING", [
        sensorSignal("PRES-Z1", pressure, pressureLimit, "bar", "WARNING"),
      ]);
    },
  },
  {
    id: "R008",
    name: "Confined Space — Unauthorised Entry",
    severity: "CRITICAL",
    description: "Person detected without confined space permit",
    evaluate(ctx) {
      if (ctx.zoneId !== "zone-5") return null;
      if (hasPermit(ctx, "confined_space") || !hasDetection(ctx, "person"))
        return null;
      return match("R008", "Confined Space — Unauthorised Entry", "CRITICAL", [
        {
          type: "detection",
          label: "Person detected in zone",
          severity: "CRITICAL",
        },
        {
          type: "permit",
          label: "No confined space permit active",
          severity: "CRITICAL",
        },
      ]);
    },
  },
];

export function evaluateRules(ctx: ZoneRiskContext): RuleMatch[] {
  return RISK_RULES.map((rule) => rule.evaluate(ctx)).filter(
    (m): m is RuleMatch => m !== null,
  );
}
