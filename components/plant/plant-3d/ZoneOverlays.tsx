"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";
import type { PlantZone, RiskLevel } from "@/app/lib/plant-zone-types";
import { RISK_TINT, ZONE_LAYOUTS } from "./plant-layout";

function ZoneVolume({
  layout,
  level,
  zone,
}: {
  layout: (typeof ZONE_LAYOUTS)[number];
  level: RiskLevel;
  zone: PlantZone;
}) {
  const meshRef = useRef<Mesh>(null);
  const tint = RISK_TINT[level];
  const isCritical = level === "CRITICAL";

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material;
    if (
      mat &&
      "emissiveIntensity" in mat &&
      typeof mat.emissiveIntensity === "number"
    ) {
      if (isCritical) {
        mat.emissiveIntensity =
          tint.emissiveIntensity *
          (0.55 + 0.45 * Math.sin(clock.elapsedTime * 4));
      } else {
        mat.emissiveIntensity = tint.emissiveIntensity;
      }
    }
  });

  const [cx, , cz] = layout.center;
  const [hx, hz] = layout.halfSize;
  const hazardLabel =
    zone.hazardClass.charAt(0).toUpperCase() + zone.hazardClass.slice(1);

  return (
    <group>
      {/* Ground highlight ring */}
      <mesh
        position={[cx, 0.12, cz]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <ringGeometry
          args={[Math.min(hx, hz) * 0.85, Math.min(hx, hz) * 0.95, 48]}
        />
        <meshStandardMaterial
          color={tint.color}
          transparent
          opacity={Math.min(0.55, tint.opacity + 0.2)}
          metalness={0.1}
          roughness={0.6}
          emissive={tint.emissive}
          emissiveIntensity={tint.emissiveIntensity * 0.5}
        />
      </mesh>

      {/* Translucent volume */}
      <mesh ref={meshRef} position={[cx, 1.4, cz]}>
        <boxGeometry args={[hx * 2 - 0.6, 2.6, hz * 2 - 0.6]} />
        <meshStandardMaterial
          color={tint.color}
          transparent
          opacity={tint.opacity}
          depthWrite={false}
          metalness={0.05}
          roughness={0.8}
          emissive={tint.emissive}
          emissiveIntensity={tint.emissiveIntensity}
        />
      </mesh>

      <Html
        position={[cx, 5.5, cz]}
        center
        distanceFactor={28}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div className="flex flex-col items-center gap-0.5 whitespace-nowrap rounded-sm border border-black/10 bg-white/90 px-2 py-1 shadow-sm backdrop-blur-sm">
          <span className="font-mono text-[10px] font-semibold tracking-wide text-slate-800">
            {layout.label}
          </span>
          <span className="font-mono text-[9px] text-slate-500">
            {hazardLabel}
          </span>
          <span
            className="rounded-sm px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest"
            style={{
              color: tint.color,
              background: `${tint.color}22`,
              border: `1px solid ${tint.color}55`,
            }}
          >
            {level}
          </span>
        </div>
      </Html>
    </group>
  );
}

export function ZoneOverlays({
  zones,
  zoneRiskLevels,
}: {
  zones: PlantZone[];
  zoneRiskLevels: Record<string, RiskLevel>;
}) {
  return (
    <group>
      {ZONE_LAYOUTS.map((layout) => {
        const zone = zones.find((z) => z.id === layout.id);
        if (!zone) return null;
        const level = zoneRiskLevels[layout.id] ?? "NOMINAL";
        return (
          <ZoneVolume
            key={layout.id}
            layout={layout}
            level={level}
            zone={zone}
          />
        );
      })}
    </group>
  );
}
