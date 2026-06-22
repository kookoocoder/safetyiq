"use client";

import { memo } from "react";
import { PALETTE } from "./materials";

/** Horizontal / vertical pipe run for plant interconnects. */
export function Pipe({
  position,
  rotation = [0, 0, 0],
  length,
  radius = 0.12,
  color = PALETTE.pipe,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  length: number;
  radius?: number;
  color?: string;
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <cylinderGeometry args={[radius, radius, length, 10]} />
      <meshStandardMaterial color={color} metalness={0.65} roughness={0.38} />
    </mesh>
  );
}

export function PipeRackBay({
  position,
  width = 4,
  height = 3.2,
  depth = 1.2,
  levels = 3,
}: {
  position: [number, number, number];
  width?: number;
  height?: number;
  depth?: number;
  levels?: number;
}) {
  const colors = [PALETTE.pipe, PALETTE.pipeInsul, "#8b7355", PALETTE.steel];
  return (
    <group position={position}>
      {/* Legs */}
      {(
        [
          [-width / 2, 0, -depth / 2],
          [width / 2, 0, -depth / 2],
          [-width / 2, 0, depth / 2],
          [width / 2, 0, depth / 2],
        ] as [number, number, number][]
      ).map((p) => (
        <mesh
          key={`leg-${p[0]}-${p[2]}`}
          position={[p[0], height / 2, p[2]]}
          castShadow
        >
          <boxGeometry args={[0.15, height, 0.15]} />
          <meshStandardMaterial
            color={PALETTE.steelDark}
            metalness={0.7}
            roughness={0.35}
          />
        </mesh>
      ))}
      {/* Cross beams + pipes */}
      {Array.from({ length: levels }, (_, li) => {
        const y = 0.9 + li * ((height - 1) / levels);
        return (
          <group key={`lvl-y${y.toFixed(2)}`}>
            <mesh position={[0, y, 0]}>
              <boxGeometry args={[width, 0.1, depth]} />
              <meshStandardMaterial
                color={PALETTE.steel}
                metalness={0.65}
                roughness={0.4}
              />
            </mesh>
            {[-0.25, 0.05, 0.3].map((oz) => (
              <Pipe
                key={`p-y${y.toFixed(2)}-z${oz}`}
                position={[0, y + 0.2, oz]}
                rotation={[0, 0, Math.PI / 2]}
                length={width - 0.3}
                radius={0.08 + Math.abs(oz) * 0.08}
                color={colors[Math.round(Math.abs(oz) * 10) % colors.length]}
              />
            ))}
          </group>
        );
      })}
    </group>
  );
}

export const PlantPipeNetwork = memo(function PlantPipeNetwork() {
  return (
    <group>
      {/* Zone 1 → Zone 2 */}
      <PipeRackBay position={[-5.5, 0, -7]} width={5} />
      {/* Zone 2 → Zone 3 */}
      <PipeRackBay position={[5.5, 0, -7]} width={5} />
      {/* North → South spine */}
      <PipeRackBay
        position={[0, 0, -1.5]}
        width={2.5}
        depth={8}
        height={3.5}
        levels={2}
      />
      {/* Zone 1 → Zone 4 */}
      <PipeRackBay position={[-9, 0, 0.5]} width={2.2} depth={6} height={2.8} />
      {/* Zone 3 → Zone 5 */}
      <PipeRackBay position={[11, 0, 0.5]} width={2.2} depth={6} height={2.8} />

      {/* Ground-level transfer lines along road */}
      <Pipe
        position={[0, 0.35, 1.5]}
        rotation={[0, 0, Math.PI / 2]}
        length={30}
        radius={0.1}
        color={PALETTE.pipeInsul}
      />
      <Pipe
        position={[0, 0.55, 1.75]}
        rotation={[0, 0, Math.PI / 2]}
        length={28}
        radius={0.07}
        color="#8b7355"
      />
    </group>
  );
});
