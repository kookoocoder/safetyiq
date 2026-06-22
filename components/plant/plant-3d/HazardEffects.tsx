"use client";

import { Billboard, Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { memo, useRef } from "react";
import type { Group, Mesh } from "three";
import type { RiskLevel } from "@/app/lib/plant-zone-types";
import { ZONE_LAYOUTS } from "./plant-layout";

function AlarmBeacon({
  position,
  level,
}: {
  position: [number, number, number];
  level: RiskLevel;
}) {
  const light = useRef<Mesh>(null);
  const active = level !== "NOMINAL";
  useFrame(({ clock }) => {
    if (!light.current || !active) return;
    const pulse = 0.8 + Math.sin(clock.elapsedTime * 9) * 0.35;
    light.current.scale.setScalar(pulse);
  });

  if (!active) return null;
  const color = level === "WARNING" ? "#facc15" : "#ef4444";
  return (
    <group position={position}>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.32, 12]} />
        <meshStandardMaterial color="#1f2937" metalness={0.7} />
      </mesh>
      <mesh ref={light} position={[0, 0.42, 0]}>
        <sphereGeometry args={[0.2, 12, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={3}
          transparent
          opacity={0.9}
        />
      </mesh>
      <pointLight
        color={color}
        intensity={4}
        distance={6}
        position={[0, 0.6, 0]}
      />
    </group>
  );
}

function GasCloud({
  position,
  critical,
}: {
  position: [number, number, number];
  critical: boolean;
}) {
  const cloud = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!cloud.current) return;
    cloud.current.rotation.y = clock.elapsedTime * 0.08;
    cloud.current.position.y =
      position[1] + Math.sin(clock.elapsedTime * 0.7) * 0.18;
  });
  return (
    <group ref={cloud} position={position}>
      {Array.from({ length: critical ? 11 : 6 }, (_, index) => {
        const angle = index * 2.399;
        const radius = 0.25 + (index % 4) * 0.34;
        return (
          <mesh
            key={`gas-${String(index)}`}
            position={[
              Math.cos(angle) * radius,
              (index % 3) * 0.22,
              Math.sin(angle) * radius,
            ]}
            scale={0.7 + (index % 3) * 0.18}
          >
            <sphereGeometry args={[0.65, 10, 8]} />
            <meshStandardMaterial
              color={critical ? "#e5d239" : "#d8e66b"}
              emissive="#7a6f09"
              emissiveIntensity={critical ? 0.35 : 0.12}
              transparent
              opacity={critical ? 0.28 : 0.16}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function HeatFailure({
  position,
  critical,
}: {
  position: [number, number, number];
  critical: boolean;
}) {
  const rings = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!rings.current) return;
    rings.current.children.forEach((child, index) => {
      const cycle = (clock.elapsedTime * 0.8 + index * 0.28) % 1;
      child.position.y = cycle * 3;
      child.scale.setScalar(0.55 + cycle * 0.8);
      const material = (child as Mesh).material;
      if (material && "opacity" in material)
        material.opacity = (1 - cycle) * 0.32;
    });
  });
  return (
    <group position={position}>
      <group ref={rings}>
        {[0, 1, 2, 3].map((index) => (
          <mesh key={`heat-${String(index)}`} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.7, 0.055, 8, 24]} />
            <meshBasicMaterial
              color={critical ? "#ef4444" : "#f97316"}
              transparent
              opacity={0.3}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
      <pointLight
        color={critical ? "#ef4444" : "#f97316"}
        intensity={critical ? 5 : 2}
        distance={7}
        position={[0, 1.3, 0]}
      />
    </group>
  );
}

function ElectricalArc({ position }: { position: [number, number, number] }) {
  const sparks = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!sparks.current) return;
    sparks.current.rotation.y = clock.elapsedTime * 4;
    sparks.current.visible = Math.sin(clock.elapsedTime * 18) > -0.25;
  });
  return (
    <group ref={sparks} position={position}>
      {Array.from({ length: 8 }, (_, index) => (
        <mesh
          key={`spark-${String(index)}`}
          position={[
            Math.cos(index * 0.78) * 0.65,
            0.3 + (index % 3) * 0.35,
            Math.sin(index * 0.78) * 0.65,
          ]}
          rotation={[0, 0, index * 0.7]}
        >
          <boxGeometry args={[0.035, 0.5, 0.035]} />
          <meshBasicMaterial color="#93c5fd" toneMapped={false} />
        </mesh>
      ))}
      <pointLight color="#60a5fa" intensity={6} distance={5} />
    </group>
  );
}

export const HazardEffects = memo(function HazardEffects({
  zoneRiskLevels,
}: {
  zoneRiskLevels: Record<string, RiskLevel>;
}) {
  return (
    <group>
      {ZONE_LAYOUTS.map((zone) => {
        const level = zoneRiskLevels[zone.id] ?? "NOMINAL";
        const active = level === "HIGH" || level === "CRITICAL";
        const critical = level === "CRITICAL";
        return (
          <group key={zone.id}>
            <AlarmBeacon
              position={[zone.center[0], 5.7, zone.center[2]]}
              level={level}
            />
            {active && (zone.id === "zone-1" || zone.id === "zone-3") && (
              <GasCloud
                position={[zone.center[0] + 0.5, 0.9, zone.center[2] + 0.4]}
                critical={critical}
              />
            )}
            {active && zone.id === "zone-2" && (
              <HeatFailure
                position={[zone.center[0] + 1.5, 0.5, zone.center[2] + 1.2]}
                critical={critical}
              />
            )}
            {active && zone.id === "zone-4" && (
              <ElectricalArc
                position={[zone.center[0] - 2.2, 1.3, zone.center[2] - 1.8]}
              />
            )}
            {active && (
              <Billboard
                position={[zone.center[0], 7.2, zone.center[2]]}
                follow
                lockX={false}
                lockY={false}
                lockZ={false}
              >
                <Html center style={{ pointerEvents: "none" }}>
                  <div className="animate-pulse whitespace-nowrap rounded-sm border border-red-300 bg-red-600/95 px-2 py-1 font-mono text-[9px] font-bold tracking-wider text-white shadow-xl">
                    {critical ? "EVACUATE · " : "CAUTION · "}
                    {zone.label.toUpperCase()}
                  </div>
                </Html>
              </Billboard>
            )}
          </group>
        );
      })}
    </group>
  );
});
