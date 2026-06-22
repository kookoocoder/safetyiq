"use client";

import { ContactShadows, Environment, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useCallback, useMemo, useRef, useState } from "react";
import type { PermitRecord } from "@/app/lib/permit-types";
import type { PlantZone, RiskLevel } from "@/app/lib/plant-zone-types";
import type { SensorReading } from "@/app/lib/sensor-types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PLANT_ASSETS } from "./assets";
import { CameraRig, type FlyToRequest } from "./CameraController";
import { HazardEffects } from "./HazardEffects";
import { LiveMarkers } from "./LiveMarkers";
import { PALETTE } from "./materials";
import { PlantPipeNetwork } from "./PipeNetwork";
import { PlantPeople } from "./PlantPeople";
import {
  DEFAULT_CAMERA_POS,
  DEFAULT_CAMERA_TARGET,
  ZONE_LAYOUTS,
} from "./plant-layout";
import { SiteInfrastructure } from "./SiteInfrastructure";
import { ZoneOverlays } from "./ZoneOverlays";
import { ZoneStructures } from "./ZoneStructures";

// Overview uses procedural plant geometry again — only preload worker GLBs.
useGLTF.preload(PLANT_ASSETS.walker);
useGLTF.preload(PLANT_ASSETS.omniWorker);

export interface Plant3DMapProps {
  zones: PlantZone[];
  zoneRiskLevels?: Record<string, RiskLevel>;
  readings?: SensorReading[];
  permitsByZone?: Map<string, PermitRecord[]>;
  className?: string;
}

function PlantScene({
  zones,
  zoneRiskLevels,
  readings,
  flyTo,
}: {
  zones: PlantZone[];
  zoneRiskLevels: Record<string, RiskLevel>;
  readings: SensorReading[];
  flyTo: FlyToRequest | null;
}) {
  return (
    <>
      <color attach="background" args={[PALETTE.sky]} />
      <fog attach="fog" args={[PALETTE.sky, 28, 70]} />

      <ambientLight intensity={0.55} />
      <directionalLight
        castShadow
        position={[18, 28, 12]}
        intensity={1.35}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={60}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-bias={-0.0002}
      />
      <hemisphereLight args={["#f0f4f8", "#9aa39a", 0.35]} />

      <Suspense fallback={null}>
        <Environment preset="city" environmentIntensity={0.35} />
      </Suspense>

      <SiteInfrastructure />
      <ZoneStructures />
      <PlantPipeNetwork />
      <ZoneOverlays zones={zones} zoneRiskLevels={zoneRiskLevels} />
      <LiveMarkers readings={readings} />
      <PlantPeople zoneRiskLevels={zoneRiskLevels} />
      <HazardEffects zoneRiskLevels={zoneRiskLevels} />

      <ContactShadows
        frames={1}
        position={[0, 0.01, 0]}
        opacity={0.35}
        scale={50}
        blur={2.2}
        far={18}
        resolution={512}
      />

      <CameraRig flyTo={flyTo} />
    </>
  );
}

export function Plant3DMap({
  zones,
  zoneRiskLevels = {},
  readings = [],
  className,
}: Plant3DMapProps) {
  const [flyTo, setFlyTo] = useState<FlyToRequest | null>(null);
  const nonceRef = useRef(0);

  const requestFly = useCallback(
    (position: [number, number, number], target: [number, number, number]) => {
      nonceRef.current += 1;
      setFlyTo({ position, target, nonce: nonceRef.current });
    },
    [],
  );

  const flyHome = useCallback(() => {
    requestFly(DEFAULT_CAMERA_POS, DEFAULT_CAMERA_TARGET);
  }, [requestFly]);

  const zoneButtons = useMemo(
    () =>
      ZONE_LAYOUTS.map((z) => ({
        id: z.id,
        label: z.id.replace("zone-", "Z"),
        title: z.label,
      })),
    [],
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-sm border border-border bg-[#eef2f6]",
        className,
      )}
    >
      <Canvas
        shadows="basic"
        dpr={[1, 1.75]}
        camera={{
          position: DEFAULT_CAMERA_POS,
          fov: 42,
          near: 0.1,
          far: 120,
        }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        className="h-full w-full touch-none"
        style={{ height: "100%", minHeight: 320 }}
        onCreated={({ gl }) => {
          gl.setClearColor(PALETTE.sky);
        }}
      >
        <PlantScene
          zones={zones}
          zoneRiskLevels={zoneRiskLevels}
          readings={readings}
          flyTo={flyTo}
        />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2">
        <div className="pointer-events-auto flex flex-wrap gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 bg-white/90 text-[10px] font-mono"
            onClick={flyHome}
          >
            Overview
          </Button>
          {zoneButtons.map((z) => (
            <Button
              key={z.id}
              type="button"
              variant="outline"
              size="sm"
              title={z.title}
              className="h-7 bg-white/90 text-[10px] font-mono"
              onClick={() => {
                const layout = ZONE_LAYOUTS.find((l) => l.id === z.id);
                if (layout) requestFly(layout.flyPosition, layout.flyTarget);
              }}
            >
              {z.label}
            </Button>
          ))}
        </div>
        <div className="rounded-sm border border-black/5 bg-white/80 px-2 py-1 font-mono text-[9px] text-slate-500 backdrop-blur-sm">
          Digital twin · drag orbit · scroll zoom
        </div>
      </div>
    </div>
  );
}
