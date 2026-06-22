import type { RiskLevel } from "@/app/lib/plant-zone-types";

/** Map SVG plant coords (1000×700) into a compact 3D world. */
export const SVG_W = 1000;
export const SVG_H = 700;
export const WORLD_SCALE = 0.04;

export function svgToWorld(x: number, y: number): [number, number, number] {
  return [(x - SVG_W / 2) * WORLD_SCALE, 0, (y - SVG_H / 2) * WORLD_SCALE];
}

export interface ZoneLayout {
  id: string;
  label: string;
  hazardClass: string;
  /** World-space center */
  center: [number, number, number];
  /** Ground footprint half-extents (x, z) */
  halfSize: [number, number];
  flyTarget: [number, number, number];
  flyPosition: [number, number, number];
}

export const ZONE_LAYOUTS: ZoneLayout[] = [
  {
    id: "zone-1",
    label: "Zone 1 · Chemical",
    hazardClass: "chemical",
    center: svgToWorld(200, 175),
    halfSize: [6, 5],
    flyTarget: svgToWorld(200, 175),
    flyPosition: [
      svgToWorld(200, 175)[0] - 8,
      10,
      svgToWorld(200, 175)[2] + 10,
    ],
  },
  {
    id: "zone-2",
    label: "Zone 2 · Mechanical",
    hazardClass: "mechanical",
    center: svgToWorld(505, 175),
    halfSize: [5.8, 5],
    flyTarget: svgToWorld(505, 175),
    flyPosition: [svgToWorld(505, 175)[0] - 6, 9, svgToWorld(505, 175)[2] + 11],
  },
  {
    id: "zone-3",
    label: "Zone 3 · Flammable",
    hazardClass: "flammable",
    center: svgToWorld(805, 175),
    halfSize: [5.8, 5],
    flyTarget: svgToWorld(805, 175),
    flyPosition: [
      svgToWorld(805, 175)[0] + 6,
      12,
      svgToWorld(805, 175)[2] + 10,
    ],
  },
  {
    id: "zone-4",
    label: "Zone 4 · Electrical",
    hazardClass: "electrical",
    center: svgToWorld(275, 480),
    halfSize: [9, 6.8],
    flyTarget: svgToWorld(275, 480),
    flyPosition: [svgToWorld(275, 480)[0] - 8, 9, svgToWorld(275, 480)[2] + 10],
  },
  {
    id: "zone-5",
    label: "Zone 5 · General",
    hazardClass: "general",
    center: svgToWorld(730, 480),
    halfSize: [8.8, 6.8],
    flyTarget: svgToWorld(730, 480),
    flyPosition: [
      svgToWorld(730, 480)[0] + 8,
      10,
      svgToWorld(730, 480)[2] + 10,
    ],
  },
];

export const CAMERA_3D_POSITIONS: Record<string, [number, number, number]> = {
  "cam-1": svgToWorld(200, 175),
  "cam-2": svgToWorld(505, 175),
  "cam-3": svgToWorld(805, 175),
  "cam-4": svgToWorld(275, 480),
};

export const SENSOR_3D_POSITIONS: Record<string, [number, number, number]> = {
  "GAS-Z1": svgToWorld(120, 120),
  "PRES-Z1": svgToWorld(280, 220),
  "TEMP-U2": svgToWorld(420, 120),
  "VIB-U2": svgToWorld(580, 220),
  "GAS-Z3": svgToWorld(720, 120),
  "TEMP-Z3": svgToWorld(880, 220),
  "VIB-U4": svgToWorld(200, 420),
};

export const RISK_TINT: Record<
  RiskLevel,
  {
    color: string;
    opacity: number;
    emissive: string;
    emissiveIntensity: number;
  }
> = {
  NOMINAL: {
    color: "#22c55e",
    opacity: 0.06,
    emissive: "#166534",
    emissiveIntensity: 0.05,
  },
  WARNING: {
    color: "#eab308",
    opacity: 0.14,
    emissive: "#a16207",
    emissiveIntensity: 0.2,
  },
  HIGH: {
    color: "#f97316",
    opacity: 0.2,
    emissive: "#c2410c",
    emissiveIntensity: 0.35,
  },
  CRITICAL: {
    color: "#ef4444",
    opacity: 0.28,
    emissive: "#dc2626",
    emissiveIntensity: 0.7,
  },
};

export const DEFAULT_CAMERA_POS: [number, number, number] = [26, 22, 30];
export const DEFAULT_CAMERA_TARGET: [number, number, number] = [0, 0, 0];
