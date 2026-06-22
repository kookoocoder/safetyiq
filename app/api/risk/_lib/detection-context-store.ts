import { CAMERA_ZONE_MAP } from "@/app/lib/plant-zone-config";

const WINDOW_MS = 15_000;

interface DetectionEntry {
  cameraId: string;
  zoneId: string;
  classes: string[];
  timestamp: number;
}

class DetectionContextStore {
  private entries: DetectionEntry[] = [];
  private demoOverrides = new Map<string, string[]>();

  push(cameraId: string, classes: string[], explicitZoneId?: string): void {
    const zoneId = explicitZoneId ?? resolveZoneForCamera(cameraId);
    if (!zoneId) return;

    this.entries.push({
      cameraId,
      zoneId,
      classes: classes.map((c) => c.toLowerCase()),
      timestamp: Date.now(),
    });
    this.prune();
  }

  setDemoDetections(zoneId: string, classes: string[]): void {
    if (classes.length === 0) {
      this.demoOverrides.delete(zoneId);
    } else {
      this.demoOverrides.set(
        zoneId,
        classes.map((c) => c.toLowerCase()),
      );
    }
  }

  clearDemoOverrides(): void {
    this.demoOverrides.clear();
  }

  getDetectedClassesByZone(zoneId: string): string[] {
    this.prune();
    const fromCameras = this.entries
      .filter((e) => e.zoneId === zoneId)
      .flatMap((e) => e.classes);
    const fromDemo = this.demoOverrides.get(zoneId) ?? [];
    return [...new Set([...fromCameras, ...fromDemo])];
  }

  getAllZoneDetections(): Map<string, string[]> {
    this.prune();
    const map = new Map<string, string[]>();
    for (const [zoneId, classes] of this.demoOverrides) {
      map.set(zoneId, [...classes]);
    }
    for (const entry of this.entries) {
      const existing = map.get(entry.zoneId) ?? [];
      map.set(entry.zoneId, [...new Set([...existing, ...entry.classes])]);
    }
    return map;
  }

  private prune(): void {
    const cutoff = Date.now() - WINDOW_MS;
    this.entries = this.entries.filter((e) => e.timestamp >= cutoff);
  }
}

function resolveZoneForCamera(cameraId: string): string | null {
  const normalized = cameraId.toLowerCase();
  if (CAMERA_ZONE_MAP[cameraId]) return CAMERA_ZONE_MAP[cameraId];
  if (CAMERA_ZONE_MAP[normalized]) return CAMERA_ZONE_MAP[normalized];

  const camMatch = normalized.match(/cam[-_]?(\d+)/);
  if (camMatch) {
    const key = `cam-${camMatch[1]}`;
    if (CAMERA_ZONE_MAP[key]) return CAMERA_ZONE_MAP[key];
  }

  const devMatch = normalized.match(/cam-dev-.*?(\d+)/);
  if (devMatch) {
    const index = Number(devMatch[1]);
    const keys = ["cam-1", "cam-2", "cam-3", "cam-4"];
    if (index >= 1 && index <= keys.length) {
      return CAMERA_ZONE_MAP[keys[index - 1]] ?? null;
    }
  }

  return null;
}

declare global {
  // eslint-disable-next-line no-var
  var __detectionContextStore: DetectionContextStore | undefined;
}

export function getDetectionContextStore(): DetectionContextStore {
  if (!globalThis.__detectionContextStore) {
    globalThis.__detectionContextStore = new DetectionContextStore();
  }
  return globalThis.__detectionContextStore;
}

export { resolveZoneForCamera };
