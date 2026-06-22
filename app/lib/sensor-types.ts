export type SensorUnit = "ppm" | "celsius" | "bar" | "g" | "percent";
export type SensorStatus = "nominal" | "warning" | "critical" | "offline";

export interface SensorDefinition {
  id: string;
  name: string;
  zoneId: string;
  unit: SensorUnit;
  nominalMin: number;
  nominalMax: number;
  warningThreshold: number;
  criticalThreshold: number;
}

export interface SensorReading {
  sensorId: string;
  value: number;
  unit: SensorUnit;
  status: SensorStatus;
  timestamp: string;
}

export function sensorStatusForValue(
  def: SensorDefinition,
  value: number,
): SensorStatus {
  if (value >= def.criticalThreshold) return "critical";
  if (value >= def.warningThreshold) return "warning";
  return "nominal";
}
