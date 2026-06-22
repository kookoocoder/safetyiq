"use client";

import { ContactShadows, Sparkles } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { type ReactNode, Suspense, useMemo, useRef } from "react";
import type { Group } from "three";
import type { PlantZone, RiskLevel } from "@/app/lib/plant-zone-types";
import type { SensorReading } from "@/app/lib/sensor-types";
import { cn } from "@/lib/utils";
import {
  FACTORY_OVERVIEW_SCALE,
  PLANT_ASSETS,
  SOLAR_OVERVIEW_SCALE,
} from "./plant-3d/assets";
import { useStaticGltf } from "./plant-3d/GltfModel";
import { IndustrialWorker } from "./plant-3d/PlantPeople";

function FactoryInterior({
  hazardClass,
  zoneId,
}: {
  hazardClass: PlantZone["hazardClass"];
  zoneId: string;
}) {
  const useSolar = hazardClass === "electrical" || hazardClass === "general";
  const model = useStaticGltf(
    useSolar ? PLANT_ASSETS.solar : PLANT_ASSETS.factory,
  );

  // Zone 4 / 5 need tighter framing into the solar yard equipment.
  const placement =
    zoneId === "zone-4"
      ? {
          position: [1.2, -1.1, -8.5] as [number, number, number],
          scale: SOLAR_OVERVIEW_SCALE * 1.55,
          rotation: [0, Math.PI * 0.72, 0] as [number, number, number],
        }
      : zoneId === "zone-5"
        ? {
            position: [-2.4, -0.85, -7.2] as [number, number, number],
            scale: SOLAR_OVERVIEW_SCALE * 1.45,
            rotation: [0, -Math.PI * 0.42, 0] as [number, number, number],
          }
        : {
            position: (
              {
                "zone-1": [-2.5, -0.4, -4],
                "zone-2": [3, -0.2, -5],
                "zone-3": [-1, -0.5, -3.5],
              } as Record<string, [number, number, number]>
            )[zoneId] ?? [-2, -0.3, -4],
            scale: useSolar
              ? SOLAR_OVERVIEW_SCALE * 1.35
              : FACTORY_OVERVIEW_SCALE * 1.8,
            rotation: [0, Math.PI * 0.2, 0] as [number, number, number],
          };

  return (
    <group
      position={placement.position}
      scale={placement.scale}
      rotation={placement.rotation}
    >
      <primitive object={model} />
    </group>
  );
}

function IncidentVfx({
  hazardClass,
  level,
}: {
  hazardClass: PlantZone["hazardClass"];
  level: RiskLevel;
}) {
  const root = useRef<Group>(null);
  const critical = level === "CRITICAL";
  const active = level === "HIGH" || critical;
  useFrame(({ clock }) => {
    if (!root.current) return;
    root.current.rotation.y = clock.elapsedTime * 0.28;
    root.current.children.forEach((child, index) => {
      if (child.type === "PointLight") return;
      child.position.y =
        0.8 + ((clock.elapsedTime * 0.5 + index * 0.2) % 1) * 2.8;
      child.scale.setScalar(0.7 + ((clock.elapsedTime + index) % 1) * 0.7);
    });
  });
  if (!active) return null;

  const isGas = hazardClass === "chemical" || hazardClass === "flammable";
  const color = isGas
    ? "#c9d84a"
    : hazardClass === "electrical"
      ? "#7dd3fc"
      : "#fb923c";

  return (
    <group ref={root} position={[0.4, 0.2, 0.6]}>
      {Array.from({ length: critical ? 10 : 5 }, (_, index) => (
        <mesh
          key={String(index)}
          position={[Math.sin(index * 2.1) * 1.1, 1, Math.cos(index * 2.1)]}
        >
          {isGas ? (
            <sphereGeometry args={[0.75, 12, 10]} />
          ) : (
            <torusGeometry args={[0.6, 0.06, 8, 20]} />
          )}
          <meshBasicMaterial
            color={color}
            transparent
            opacity={isGas ? 0.22 : 0.55}
            depthWrite={false}
          />
        </mesh>
      ))}
      <Sparkles
        count={critical ? 48 : 24}
        scale={[4, 3, 4]}
        size={critical ? 4 : 2.5}
        speed={0.6}
        color={color}
        opacity={0.7}
      />
      <pointLight color={color} intensity={critical ? 6 : 2.5} distance={10} />
    </group>
  );
}

function Floor() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[28, 20]} />
        <meshStandardMaterial
          color="#1c2429"
          roughness={0.95}
          metalness={0.05}
        />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[22, 1.1]} />
        <meshStandardMaterial
          color="#d4a017"
          roughness={0.7}
          metalness={0.15}
          transparent
          opacity={0.55}
        />
      </mesh>
    </>
  );
}

function CctvScene({ zone, level }: { zone: PlantZone; level: RiskLevel }) {
  const workerMode =
    level === "CRITICAL"
      ? "evacuating"
      : level === "HIGH"
        ? "walking"
        : "working";

  // Zone 4/5 workers stand closer to camera so occupancy is obvious.
  const workerA: [number, number, number] =
    zone.id === "zone-4"
      ? [-1.6, 0.03, 2.8]
      : zone.id === "zone-5"
        ? [-0.8, 0.03, 2.5]
        : [-1.1, 0.03, 2.4];
  const workerB: [number, number, number] =
    zone.id === "zone-4"
      ? [1.4, 0.03, 2.1]
      : zone.id === "zone-5"
        ? [2.1, 0.03, 1.9]
        : [1.9, 0.03, 1.6];

  return (
    <>
      <color attach="background" args={["#05090c"]} />
      <fog attach="fog" args={["#05090c", 14, 32]} />
      <ambientLight intensity={0.38} />
      <directionalLight
        position={[6, 10, 4]}
        intensity={1.45}
        castShadow
        shadow-mapSize={[512, 512]}
      />
      <pointLight
        position={[-3, 5, 3]}
        intensity={1.1}
        color="#9fd6ff"
        distance={16}
      />
      <hemisphereLight args={["#c7d5e2", "#2a3238", 0.35]} />
      <Floor />
      <Suspense fallback={null}>
        <FactoryInterior hazardClass={zone.hazardClass} zoneId={zone.id} />
      </Suspense>
      <IndustrialWorker
        id={`${zone.id}-A`}
        position={workerA}
        color="#f97316"
        mode={workerMode === "evacuating" ? "evacuating" : "working"}
        phase={1}
      />
      <IndustrialWorker
        id={`${zone.id}-B`}
        position={workerB}
        color="#38bdf8"
        mode={
          level === "CRITICAL"
            ? "evacuating"
            : level === "HIGH"
              ? "walking"
              : "walking"
        }
        phase={3.2}
      />
      <IncidentVfx hazardClass={zone.hazardClass} level={level} />
      <ContactShadows
        position={[0, 0.02, 0]}
        opacity={0.55}
        scale={18}
        blur={2.2}
        far={10}
      />
    </>
  );
}

function sensorSummary(readings: SensorReading[]): string {
  if (readings.length === 0) return "NO SENSOR";
  return readings
    .slice(0, 2)
    .map(
      (reading) =>
        `${reading.value.toFixed(0)} ${reading.unit === "celsius" ? "°C" : reading.unit}`,
    )
    .join(" · ");
}

export function PlantCctvWall({
  zones,
  zoneRiskLevels,
  readings,
  leadFeed,
}: {
  zones: PlantZone[];
  zoneRiskLevels: Record<string, RiskLevel>;
  readings: SensorReading[];
  leadFeed?: ReactNode;
}) {
  const readingsByZone = useMemo(
    () =>
      new Map(
        zones.map((zone) => [
          zone.id,
          readings.filter((reading) =>
            zone.assignedSensorIds.includes(reading.sensorId),
          ),
        ]),
      ),
    [readings, zones],
  );
  const feeds = useMemo(
    () =>
      zones.map((zone, index) => {
        const cameraByZone: Record<string, [number, number, number]> = {
          // Zone 4 electrical — elevated corner looking into switchyard.
          "zone-4": [8.4, 5.6, 6.2],
          // Zone 5 general — lower side angle into the yard / bay.
          "zone-5": [-6.8, 4.4, 9.4],
        };
        const fallback =
          index % 2 === 0
            ? ([6.8, 4.8, 8.2] as [number, number, number])
            : ([-7.2, 5.1, 8.6] as [number, number, number]);

        return {
          key: zone.id,
          zone,
          cameraId: zone.assignedCameraIds[0] ?? `sim-${index + 1}`,
          viewLabel:
            zone.id === "zone-4"
              ? "SWITCHYARD"
              : zone.id === "zone-5"
                ? "YARD BAY"
                : "INTERIOR",
          cameraPosition: cameraByZone[zone.id] ?? fallback,
          fov: zone.id === "zone-4" || zone.id === "zone-5" ? 42 : 46,
        };
      }),
    [zones],
  );

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
      {leadFeed}
      {feeds.map(({ key, zone, cameraId, viewLabel, cameraPosition, fov }) => {
        const level = zoneRiskLevels[zone.id] ?? "NOMINAL";
        return (
          <article
            key={key}
            className={cn(
              "group relative min-h-[260px] overflow-hidden rounded-sm border bg-black shadow-lg",
              level === "CRITICAL"
                ? "border-red-500 ring-1 ring-red-500/60"
                : level === "HIGH"
                  ? "border-orange-500"
                  : "border-slate-700",
            )}
          >
            <Canvas
              shadows="basic"
              dpr={[0.7, 1.1]}
              camera={{
                position: cameraPosition,
                fov,
                near: 0.1,
                far: 60,
              }}
              gl={{ antialias: true, powerPreference: "high-performance" }}
            >
              <CctvScene zone={zone} level={level} />
            </Canvas>

            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,.08)_50%)] bg-[length:100%_4px] opacity-45" />
            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/85 to-transparent p-3 font-mono">
              <div>
                <div className="text-[11px] font-bold tracking-wider text-white">
                  {cameraId.toUpperCase()} · {zone.name.toUpperCase()}
                </div>
                <div className="mt-0.5 text-[9px] text-slate-300">
                  {viewLabel} / {zone.hazardClass.toUpperCase()} · LIVE GLB
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-red-400">
                <span className="size-1.5 animate-pulse rounded-full bg-red-500" />
                REC
              </div>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/90 to-transparent p-3 font-mono">
              <div>
                <div className="text-[9px] text-slate-300">
                  2 PEOPLE ON TASK
                </div>
                <div className="mt-0.5 text-[10px] text-white">
                  {sensorSummary(readingsByZone.get(zone.id) ?? [])}
                </div>
              </div>
              <span
                className={cn(
                  "rounded-sm border px-2 py-1 text-[10px] font-bold",
                  level === "CRITICAL"
                    ? "border-red-400 bg-red-600 text-white"
                    : level === "HIGH"
                      ? "border-orange-400 bg-orange-500 text-black"
                      : level === "WARNING"
                        ? "border-yellow-400 bg-yellow-400 text-black"
                        : "border-emerald-500/60 bg-emerald-950/80 text-emerald-300",
                )}
              >
                {level}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
