"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCameraDevices } from "@/app/hooks/useCameraDevices";
import { useCompoundRisk } from "@/app/hooks/useCompoundRisk";
import { usePlantZones } from "@/app/hooks/usePlantZones";
import { useSensorFeed } from "@/app/hooks/useSensorFeed";
import { useWebcamDetect } from "@/app/hooks/useWebcamDetect";
import { useCameraSettings } from "@/app/lib/camera-settings-store";
import type { CameraSourceRef } from "@/app/lib/camera-source";
import { pushDetectionContext } from "@/app/lib/detection-context-client";
import type { PlantZone, RiskLevel } from "@/app/lib/plant-zone-types";
import { CameraStreamSurface } from "@/components/camera/camera-stream-surface";
import { OverlayCanvas } from "@/components/OverlayCanvas";
import { PlantCctvWall } from "@/components/plant/plant-cctv-wall";
import { Button } from "@/components/ui/button";

const RISK_RANK: Record<RiskLevel, number> = {
  NOMINAL: 0,
  WARNING: 1,
  HIGH: 2,
  CRITICAL: 3,
};

function RealCameraIngest({ zones }: { zones: PlantZone[] }) {
  const sourceRef = useRef<CameraSourceRef | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { devices } = useCameraDevices();
  const { rows } = useCameraSettings(devices);
  const camera = useMemo(() => rows.find((row) => row.enabled) ?? null, [rows]);
  const zoneId = camera
    ? zones.find((zone) =>
        zone.assignedCameraIds.some(
          (id) => id.toLowerCase() === camera.cameraId.toLowerCase(),
        ),
      )?.id
    : undefined;
  const { detections, frameDimensions } = useWebcamDetect(sourceRef, isReady, {
    maxFps: 4,
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset stream state when the configured camera changes
  useEffect(() => {
    setIsReady(false);
    setError(null);
  }, [camera?.id]);

  useEffect(() => {
    if (!camera || !isReady || detections.length === 0) return;
    void pushDetectionContext(camera.cameraId, detections, "rfdetr", zoneId);
  }, [camera, detections, isReady, zoneId]);

  return (
    <article className="relative min-h-[240px] overflow-hidden rounded-sm border border-cyan-500/70 bg-black shadow-lg ring-1 ring-cyan-500/20">
      <CameraStreamSurface
        key={camera?.id ?? "no-real-camera"}
        camera={camera}
        error={error}
        isPrimary
        isReady={isReady}
        onError={(message) => {
          setError(message);
          setIsReady(false);
        }}
        onReady={() => {
          setError(null);
          setIsReady(true);
        }}
        sourceRef={sourceRef}
        overlays={
          isReady && frameDimensions ? (
            <OverlayCanvas
              webcamRef={sourceRef}
              detections={detections}
              frameDimensions={frameDimensions}
              detectionModel="rfdetr"
            />
          ) : null
        }
      />
      <div className="pointer-events-none absolute right-3 top-3 rounded-sm border border-cyan-300/60 bg-cyan-950/90 px-2 py-1 font-mono text-[9px] font-bold tracking-wider text-cyan-200">
        REAL CV INGEST · {detections.length} TRACKED
      </div>
    </article>
  );
}

export default function LiveMonitorPage() {
  const { zones } = usePlantZones();
  const { readings, connectionStatus } = useSensorFeed();
  const { zoneRiskStates, isLoading } = useCompoundRisk();

  const zoneRiskLevels = Object.fromEntries(
    zoneRiskStates.map((state) => [state.zoneId, state.riskLevel]),
  ) as Record<string, RiskLevel>;
  const highestRisk = zoneRiskStates.reduce<RiskLevel>(
    (highest, state) =>
      RISK_RANK[state.riskLevel] > RISK_RANK[highest]
        ? state.riskLevel
        : highest,
    "NOMINAL",
  );
  const occupiedZones = zones.length;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#05090c] text-white">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-[#081016] px-4 py-3">
        <div className="flex min-w-0 items-center gap-4">
          <div>
            <div className="font-mono text-xs font-bold tracking-[0.16em] text-white">
              PLANT INTERIOR · LIVE CCTV WALL
            </div>
            <div className="mt-1 font-mono text-[9px] tracking-wider text-slate-400">
              HUMAN-CENTRIC INCIDENT VISUALIZATION · ALL ZONES
            </div>
          </div>
          <div className="hidden h-8 w-px bg-slate-700 sm:block" />
          <div className="hidden items-center gap-2 font-mono text-[10px] sm:flex">
            <span
              className={`size-2 rounded-full ${
                connectionStatus === "live"
                  ? "animate-pulse bg-emerald-400"
                  : "bg-amber-400"
              }`}
            />
            {connectionStatus === "live" ? "SCADA LIVE" : "CONNECTING"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-sm border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-[10px]">
            <span className="text-slate-400">OCCUPANCY </span>
            <span className="text-white">
              {occupiedZones} / {zones.length} ZONES
            </span>
          </div>
          <div
            className={`rounded-sm border px-3 py-1.5 font-mono text-[10px] font-bold ${
              highestRisk === "CRITICAL"
                ? "animate-pulse border-red-400 bg-red-600"
                : highestRisk === "HIGH"
                  ? "border-orange-400 bg-orange-500 text-black"
                  : "border-emerald-700 bg-emerald-950 text-emerald-300"
            }`}
          >
            {isLoading ? "SYNCING" : highestRisk}
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-slate-700 bg-slate-900 font-mono text-[10px] text-white hover:bg-slate-800 hover:text-white"
          >
            <Link href="/plant/scenario">RUN INCIDENT</Link>
          </Button>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto p-2">
        <PlantCctvWall
          zones={zones}
          zoneRiskLevels={zoneRiskLevels}
          readings={readings}
          leadFeed={<RealCameraIngest zones={zones} />}
        />
      </main>

      <footer className="flex shrink-0 items-center justify-between border-t border-slate-800 bg-[#081016] px-4 py-2 font-mono text-[9px] text-slate-400">
        <span>VISUAL STATE FUSED FROM CCTV · SCADA · PERMIT-TO-WORK</span>
        <span className="hidden sm:inline">
          WORKERS, EQUIPMENT AND HAZARDS REACT TO LIVE RISK
        </span>
      </footer>
    </div>
  );
}
