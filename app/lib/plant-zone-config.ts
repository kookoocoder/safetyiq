import type { PlantZone } from "@/app/lib/plant-zone-types";

export const DEFAULT_PLANT_ZONES: PlantZone[] = [
  {
    id: "zone-1",
    name: "Zone 1",
    hazardClass: "chemical",
    svgPolygonPoints: "50,50 350,50 350,300 50,300",
    assignedCameraIds: ["cam-1"],
    assignedSensorIds: ["GAS-Z1", "PRES-Z1"],
  },
  {
    id: "zone-2",
    name: "Zone 2",
    hazardClass: "mechanical",
    svgPolygonPoints: "360,50 650,50 650,300 360,300",
    assignedCameraIds: ["cam-2"],
    assignedSensorIds: ["TEMP-U2", "VIB-U2"],
  },
  {
    id: "zone-3",
    name: "Zone 3",
    hazardClass: "flammable",
    svgPolygonPoints: "660,50 950,50 950,300 660,300",
    assignedCameraIds: ["cam-3"],
    assignedSensorIds: ["GAS-Z3", "TEMP-Z3"],
  },
  {
    id: "zone-4",
    name: "Zone 4",
    hazardClass: "electrical",
    svgPolygonPoints: "50,310 500,310 500,650 50,650",
    assignedCameraIds: ["cam-4"],
    assignedSensorIds: ["VIB-U4"],
  },
  {
    id: "zone-5",
    name: "Zone 5",
    hazardClass: "general",
    svgPolygonPoints: "510,310 950,310 950,650 510,650",
    assignedCameraIds: [],
    assignedSensorIds: [],
  },
];

export const CAMERA_ZONE_MAP: Record<string, string> = {
  "cam-1": "zone-1",
  "cam-2": "zone-2",
  "cam-3": "zone-3",
  "cam-4": "zone-4",
};
