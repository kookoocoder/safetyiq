"use client";

import { memo } from "react";
import { PALETTE } from "./materials";
import { ZONE_LAYOUTS } from "./plant-layout";

function ConcretePad({
  position,
  size,
  height = 0.08,
}: {
  position: [number, number, number];
  size: [number, number];
  height?: number;
}) {
  return (
    <mesh position={[position[0], height / 2, position[2]]} receiveShadow>
      <boxGeometry args={[size[0], height, size[1]]} />
      <meshStandardMaterial
        color={PALETTE.concrete}
        roughness={0.92}
        metalness={0.04}
      />
    </mesh>
  );
}

function RoadStrip() {
  return (
    <group>
      {/* Main E-W road between north/south zones */}
      <mesh position={[0, 0.02, 0.5]} receiveShadow>
        <boxGeometry args={[38, 0.04, 2.4]} />
        <meshStandardMaterial
          color={PALETTE.asphalt}
          roughness={0.95}
          metalness={0.02}
        />
      </mesh>
      {/* Center dashed line */}
      {Array.from({ length: 14 }, (_, i) => {
        const x = -18 + i * 2.7;
        return (
          <mesh
            key={`dash-x${x}`}
            position={[x, 0.045, 0.5]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[1.2, 0.12]} />
            <meshStandardMaterial color={PALETTE.asphaltMark} roughness={0.8} />
          </mesh>
        );
      })}
      {/* N-S connector */}
      <mesh position={[0, 0.02, -1]} receiveShadow>
        <boxGeometry args={[2.2, 0.04, 12]} />
        <meshStandardMaterial
          color={PALETTE.asphalt}
          roughness={0.95}
          metalness={0.02}
        />
      </mesh>
    </group>
  );
}

function FenceSegment({
  from,
  to,
  height = 1.6,
}: {
  from: [number, number];
  to: [number, number];
  height?: number;
}) {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const len = Math.hypot(dx, dz);
  const midX = (from[0] + to[0]) / 2;
  const midZ = (from[1] + to[1]) / 2;
  const angle = Math.atan2(dx, dz);

  const posts = Math.max(2, Math.floor(len / 2.5));
  return (
    <group>
      <mesh
        position={[midX, height / 2, midZ]}
        rotation={[0, angle, 0]}
        castShadow
      >
        <boxGeometry args={[0.04, height, len]} />
        <meshStandardMaterial
          color={PALETTE.fence}
          metalness={0.65}
          roughness={0.4}
          transparent
          opacity={0.55}
        />
      </mesh>
      {/* Top rail */}
      <mesh position={[midX, height, midZ]} rotation={[0, angle, 0]}>
        <boxGeometry args={[0.08, 0.06, len]} />
        <meshStandardMaterial
          color={PALETTE.steelDark}
          metalness={0.7}
          roughness={0.35}
        />
      </mesh>
      {Array.from({ length: posts + 1 }, (_, i) => {
        const t = i / posts;
        const px = from[0] + dx * t;
        const pz = from[1] + dz * t;
        return (
          <mesh
            key={`post-${px.toFixed(2)}-${pz.toFixed(2)}`}
            position={[px, height / 2, pz]}
            castShadow
          >
            <cylinderGeometry args={[0.06, 0.06, height, 6]} />
            <meshStandardMaterial
              color={PALETTE.steelDark}
              metalness={0.7}
              roughness={0.35}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function LightPole({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 3, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 6, 8]} />
        <meshStandardMaterial
          color={PALETTE.steelDark}
          metalness={0.75}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[0.4, 5.7, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 0.9, 6]} />
        <meshStandardMaterial
          color={PALETTE.steel}
          metalness={0.7}
          roughness={0.35}
        />
      </mesh>
      <mesh position={[0.85, 5.55, 0]}>
        <boxGeometry args={[0.35, 0.2, 0.25]} />
        <meshStandardMaterial
          color="#e8e4d8"
          emissive="#fff8e7"
          emissiveIntensity={0.35}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}

export const SiteInfrastructure = memo(function SiteInfrastructure() {
  return (
    <group>
      {/* Base terrain */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        receiveShadow
      >
        <planeGeometry args={[48, 36]} />
        <meshStandardMaterial
          color={PALETTE.grass}
          roughness={0.98}
          metalness={0}
        />
      </mesh>

      {/* Outer concrete apron */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[42, 30]} />
        <meshStandardMaterial
          color={PALETTE.concreteDark}
          roughness={0.94}
          metalness={0.03}
        />
      </mesh>

      {ZONE_LAYOUTS.map((z) => (
        <ConcretePad
          key={z.id}
          position={z.center}
          size={[z.halfSize[0] * 2 - 0.4, z.halfSize[1] * 2 - 0.4]}
        />
      ))}

      <RoadStrip />

      {/* Perimeter fence */}
      <FenceSegment from={[-20, -14]} to={[20, -14]} />
      <FenceSegment from={[20, -14]} to={[20, 14]} />
      <FenceSegment from={[20, 14]} to={[-20, 14]} />
      <FenceSegment from={[-20, 14]} to={[-20, -14]} />

      {/* Gate opening hint on south */}
      <mesh position={[0, 0.9, 14]}>
        <boxGeometry args={[3.5, 0.12, 0.12]} />
        <meshStandardMaterial
          color={PALETTE.safetyYellow}
          metalness={0.4}
          roughness={0.45}
        />
      </mesh>

      <LightPole position={[-16, 0, -10]} />
      <LightPole position={[16, 0, -10]} />
      <LightPole position={[-16, 0, 10]} />
      <LightPole position={[16, 0, 10]} />
      <LightPole position={[0, 0, -12]} />
      <LightPole position={[0, 0, 11]} />
    </group>
  );
});
