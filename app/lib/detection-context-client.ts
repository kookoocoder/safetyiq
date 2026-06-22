import { cocoClassName } from "@/app/lib/coco";
import type { Detection, DetectionModel } from "@/app/lib/types";

export async function pushDetectionContext(
  cameraId: string,
  detections: readonly Detection[],
  model: DetectionModel = "rfdetr",
  zoneId?: string,
): Promise<void> {
  if (!cameraId || cameraId === "NO_CAMERA") return;

  const classes = detections.map((d) =>
    cocoClassName(d.class, model).toLowerCase(),
  );
  if (classes.length === 0) return;

  try {
    await fetch("/api/context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cameraId,
        classes: [...new Set(classes)],
        zoneId,
      }),
    });
  } catch {
    // Best-effort sync for compound risk engine
  }
}
