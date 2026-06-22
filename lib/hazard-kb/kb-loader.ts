import actionTemplates from "@/lib/hazard-kb/action-templates.json";
import hazardScenarios from "@/lib/hazard-kb/hazard-scenarios.json";
import materialData from "@/lib/hazard-kb/material-data.json";

export interface HazardScenario {
  id: string;
  name: string;
  hazardType: string;
  triggerConditions: string;
  immediateConsequences: string;
  contributingFactors: string[];
  immediateActions: string[];
  references: string;
}

export interface ActionTemplate {
  id: string;
  name: string;
  hazardTypes: string[];
  steps: string[];
}

export function getHazardScenarios(): HazardScenario[] {
  return hazardScenarios as HazardScenario[];
}

export function getActionTemplates(hazardTypes: string[]): ActionTemplate[] {
  const all = actionTemplates as ActionTemplate[];
  const matched = all.filter((t) =>
    t.hazardTypes.some((ht) => hazardTypes.includes(ht)),
  );
  return matched.length > 0 ? matched.slice(0, 3) : all.slice(0, 2);
}

export function getRelevantScenarios(
  hazardTypes: string[],
  limit = 5,
): HazardScenario[] {
  const all = getHazardScenarios();
  const matched = all.filter((s) => hazardTypes.includes(s.hazardType));
  return (matched.length > 0 ? matched : all).slice(0, limit);
}

export function formatKbContext(hazardTypes: string[]): string {
  const scenarios = getRelevantScenarios(hazardTypes);
  const templates = getActionTemplates(hazardTypes);
  const scenarioText = scenarios
    .map(
      (s) =>
        `[${s.id}] ${s.name}: ${s.triggerConditions}. Consequences: ${s.immediateConsequences}. Actions: ${s.immediateActions.join("; ")}`,
    )
    .join("\n");
  const templateText = templates
    .map((t) => `[${t.id}] ${t.name}: ${t.steps.join("; ")}`)
    .join("\n");
  return `Material data: ${JSON.stringify(materialData)}

Relevant scenarios:
${scenarioText}

Emergency action templates:
${templateText}`;
}
