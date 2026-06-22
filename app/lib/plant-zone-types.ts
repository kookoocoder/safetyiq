export type HazardClass =
  | "chemical"
  | "flammable"
  | "mechanical"
  | "electrical"
  | "general";

export type RiskLevel = "NOMINAL" | "WARNING" | "HIGH" | "CRITICAL";

export interface PlantZone {
  id: string;
  name: string;
  hazardClass: HazardClass;
  svgPolygonPoints: string;
  assignedCameraIds: string[];
  assignedSensorIds: string[];
}
