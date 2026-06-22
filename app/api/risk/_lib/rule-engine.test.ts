import assert from "node:assert/strict";
import test from "node:test";
import { scoreZoneRisk } from "@/app/api/risk/_lib/risk-scorer";
import { evaluateRules } from "@/app/api/risk/_lib/rule-engine";
import type { ZoneRiskContext } from "@/app/lib/compound-risk-types";

function context(patch: Partial<ZoneRiskContext> = {}): ZoneRiskContext {
  return {
    zoneId: "zone-3",
    zoneName: "Zone 3",
    hazardClass: "flammable",
    detectedClasses: [],
    sensors: {},
    thresholds: {},
    activePermits: [],
    ...patch,
  };
}

test("Scenario A becomes CRITICAL only when all three signals are present", () => {
  const base = context({
    sensors: { "GAS-Z3": 82 },
    thresholds: { "GAS-Z3": 25, "GAS-Z3_critical": 70 },
    activePermits: ["hot_work"],
  });

  assert.equal(
    evaluateRules(base).some((match) => match.ruleId === "R001"),
    false,
  );

  const matches = evaluateRules({
    ...base,
    detectedClasses: ["person"],
  });
  assert.equal(
    matches.some((match) => match.ruleId === "R001"),
    true,
  );
  assert.equal(
    scoreZoneRisk("zone-3", matches, new Date().toISOString()).riskLevel,
    "CRITICAL",
  );
});

test("Scenario B uses configured temperature and vibration thresholds", () => {
  const matches = evaluateRules(
    context({
      zoneId: "zone-2",
      zoneName: "Zone 2",
      hazardClass: "mechanical",
      sensors: { "TEMP-U2": 90, "VIB-U2": 5.2 },
      thresholds: { "TEMP-U2": 85, "VIB-U2": 4.5 },
      activePermits: ["maintenance"],
    }),
  );

  assert.equal(
    matches.some((match) => match.ruleId === "R004"),
    true,
  );
  assert.equal(
    scoreZoneRisk("zone-2", matches, new Date().toISOString()).riskLevel,
    "HIGH",
  );
});

test("Scenario C does not flag a PPE violation when a hardhat is detected", () => {
  const base = context({
    zoneId: "zone-1",
    zoneName: "Zone 1",
    hazardClass: "chemical",
    sensors: { "PRES-Z1": 9.2 },
    thresholds: { "PRES-Z1": 8.5 },
    activePermits: ["chemical"],
    detectedClasses: ["person"],
  });

  assert.equal(
    evaluateRules(base).some((match) => match.ruleId === "R006"),
    true,
  );
  assert.equal(
    evaluateRules({ ...base, detectedClasses: ["person", "hardhat"] }).some(
      (match) => match.ruleId === "R006",
    ),
    false,
  );
});

test("sensor contributions retain structured values for LLM reasoning", () => {
  const match = evaluateRules(
    context({
      sensors: { "GAS-Z3": 30 },
      thresholds: { "GAS-Z3": 25, "GAS-Z3_critical": 70 },
    }),
  ).find((candidate) => candidate.ruleId === "R003");
  const sensor = match?.contributingSignals.find(
    (signal) => signal.type === "sensor",
  );

  assert.deepEqual(
    sensor && {
      sensorId: sensor.sensorId,
      value: sensor.value,
      threshold: sensor.threshold,
      unit: sensor.unit,
    },
    { sensorId: "GAS-Z3", value: 30, threshold: 25, unit: "ppm" },
  );
});

test("multiple CRITICAL matches force the compound score to 100", () => {
  const criticalMatch = {
    ruleId: "R001",
    ruleName: "Critical one",
    severity: "CRITICAL" as const,
    contributingSignals: [],
  };
  const state = scoreZoneRisk(
    "zone-3",
    [
      criticalMatch,
      { ...criticalMatch, ruleId: "R008", ruleName: "Critical two" },
    ],
    new Date().toISOString(),
  );

  assert.equal(state.compoundScore, 100);
  assert.equal(state.riskLevel, "CRITICAL");
});
