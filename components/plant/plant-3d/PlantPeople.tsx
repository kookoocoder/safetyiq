"use client";

import { Html, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { memo, Suspense, useEffect, useMemo, useRef } from "react";
import type { Group } from "three";
import type { RiskLevel } from "@/app/lib/plant-zone-types";
import {
  OMNI_WORKER_SCALE,
  PLANT_ASSETS,
  WALKER_CLIP,
  WALKER_SCALE,
} from "./assets";
import { useSkinnedGltf, useStaticGltf } from "./GltfModel";
import { ZONE_LAYOUTS } from "./plant-layout";

type WorkerMode = "working" | "walking" | "evacuating";

interface WorkerProps {
  id: string;
  position: [number, number, number];
  color: string;
  mode: WorkerMode;
  phase: number;
}

function WalkingWorker({ id, position, color, mode, phase }: WorkerProps) {
  const root = useRef<Group>(null);
  const { model, animations } = useSkinnedGltf(PLANT_ASSETS.walker);
  const { actions } = useAnimations(animations, model);

  useEffect(() => {
    const action = actions[WALKER_CLIP];
    if (!action) return;
    action.reset().fadeIn(0.25).play();
    action.setEffectiveTimeScale(mode === "evacuating" ? 1.65 : 1);
    action.time = phase % Math.max(action.getClip().duration, 0.1);
    return () => {
      action.fadeOut(0.2);
    };
  }, [actions, mode, phase]);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime + phase;
    if (!root.current) return;
    if (mode === "evacuating") {
      root.current.position.x += delta * 1.55;
      root.current.rotation.y = Math.PI / 2;
      if (root.current.position.x > position[0] + 3.4) {
        root.current.position.x = position[0] - 1.4;
      }
    } else {
      root.current.position.x = position[0] + Math.sin(t * 0.4) * 1.4;
      root.current.rotation.y =
        Math.cos(t * 0.4) > 0 ? Math.PI / 2 : -Math.PI / 2;
    }
  });

  return (
    <group ref={root} position={position} scale={WALKER_SCALE}>
      <primitive object={model} />
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.32, 0.42, 28]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} />
      </mesh>
      {mode === "evacuating" && (
        <Html position={[0, 2.15, 0]} center style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded-sm border border-red-300 bg-red-600/95 px-1.5 py-0.5 font-mono text-[8px] font-bold text-white shadow-lg">
            {id} · EVACUATING
          </div>
        </Html>
      )}
    </group>
  );
}

function OmniWorker({ id, position, color, mode, phase }: WorkerProps) {
  const root = useRef<Group>(null);
  const model = useStaticGltf(PLANT_ASSETS.omniWorker);

  useFrame(({ clock }) => {
    if (!root.current) return;
    const t = clock.elapsedTime + phase;
    root.current.position.y = position[1] + Math.sin(t * 1.6) * 0.02;
    root.current.rotation.y = Math.sin(t * 0.35) * 0.25;
    if (mode === "evacuating") {
      root.current.position.x = position[0] + ((t * 1.1) % 3.2) - 1.2;
    }
  });

  return (
    <group ref={root} position={position} scale={OMNI_WORKER_SCALE}>
      <primitive object={model} />
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={3.4}>
        <ringGeometry args={[0.32, 0.42, 28]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} />
      </mesh>
      {mode === "evacuating" && (
        <Html position={[0, 7.2, 0]} center style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded-sm border border-red-300 bg-red-600/95 px-1.5 py-0.5 font-mono text-[8px] font-bold text-white shadow-lg">
            {id} · EVACUATING
          </div>
        </Html>
      )}
    </group>
  );
}

export function IndustrialWorker(props: WorkerProps) {
  const { mode } = props;
  return (
    <Suspense fallback={null}>
      {mode === "working" ? (
        <OmniWorker {...props} />
      ) : (
        <WalkingWorker {...props} />
      )}
    </Suspense>
  );
}

const WORKERS = [
  ["W-014", "zone-1", -1.8, 2.3, "#f97316", 0.2, "working"],
  ["W-021", "zone-1", 2.5, 1.7, "#2563eb", 1.4, "walking"],
  ["W-037", "zone-2", 1.4, 2.2, "#0d9488", 2.6, "working"],
  ["W-042", "zone-2", 3.2, -0.2, "#f97316", 3.7, "walking"],
  ["W-053", "zone-3", -0.5, 2.6, "#2563eb", 4.1, "walking"],
  ["W-061", "zone-3", 2.1, 1.4, "#dc2626", 5.4, "working"],
  ["W-078", "zone-4", -2.2, 1.1, "#0d9488", 6.2, "working"],
  ["W-084", "zone-4", 3.1, 4.2, "#f97316", 7.5, "walking"],
  ["W-096", "zone-5", 3.2, 3.8, "#2563eb", 8.7, "walking"],
  ["W-101", "zone-5", -3.8, 3.1, "#0d9488", 9.8, "working"],
] as const;

export const PlantPeople = memo(function PlantPeople({
  zoneRiskLevels,
}: {
  zoneRiskLevels: Record<string, RiskLevel>;
}) {
  const people = useMemo(
    () =>
      WORKERS.map(([id, zoneId, dx, dz, color, phase, preferred]) => {
        const layout = ZONE_LAYOUTS.find((zone) => zone.id === zoneId);
        if (!layout) return null;
        const risk = zoneRiskLevels[zoneId] ?? "NOMINAL";
        const mode: WorkerMode =
          risk === "CRITICAL"
            ? "evacuating"
            : risk === "HIGH"
              ? "walking"
              : preferred;
        return (
          <IndustrialWorker
            key={id}
            id={id}
            position={[layout.center[0] + dx, 0.03, layout.center[2] + dz]}
            color={color}
            mode={mode}
            phase={phase}
          />
        );
      }),
    [zoneRiskLevels],
  );

  return <group>{people}</group>;
});
