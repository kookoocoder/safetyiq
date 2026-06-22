"use client";

import { Html } from "@react-three/drei";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SensorReading } from "@/app/lib/sensor-types";
import { PALETTE } from "./materials";
import { CAMERA_3D_POSITIONS, SENSOR_3D_POSITIONS } from "./plant-layout";

function CctvCamera({
  id,
  position,
}: {
  id: string;
  position: [number, number, number];
}) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);

  return (
    <group position={[position[0], 0, position[2]]}>
      {/* Pole */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 3.6, 8]} />
        <meshStandardMaterial
          color={PALETTE.steelDark}
          metalness={0.75}
          roughness={0.3}
        />
      </mesh>
      {/* Arm */}
      <mesh position={[0.35, 3.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.7, 6]} />
        <meshStandardMaterial
          color={PALETTE.steel}
          metalness={0.7}
          roughness={0.35}
        />
      </mesh>
      {/* Housing — R3F mesh pointer events (not a DOM static element) */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: R3F mesh, not HTML */}
      <mesh
        position={[0.7, 3.45, 0]}
        castShadow
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/monitor?camera=${encodeURIComponent(id)}`);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <boxGeometry args={[0.45, 0.28, 0.28]} />
        <meshStandardMaterial
          color={hovered ? "#334155" : "#1e293b"}
          metalness={0.5}
          roughness={0.4}
        />
      </mesh>
      {/* Lens */}
      <mesh position={[0.95, 3.45, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.1, 0.12, 12]} />
        <meshStandardMaterial
          color="#0f172a"
          metalness={0.8}
          roughness={0.15}
          emissive="#38bdf8"
          emissiveIntensity={hovered ? 0.6 : 0.15}
        />
      </mesh>
      {hovered && (
        <Html position={[0.7, 4.1, 0]} center style={{ pointerEvents: "none" }}>
          <div className="rounded-sm border border-slate-300 bg-white/95 px-2 py-1 font-mono text-[10px] text-slate-700 shadow-sm">
            Open {id.toUpperCase()} → Monitor
          </div>
        </Html>
      )}
      <Html position={[0, 0.35, 0]} center style={{ pointerEvents: "none" }}>
        <span className="font-mono text-[8px] font-semibold tracking-wide text-slate-600">
          {id.toUpperCase()}
        </span>
      </Html>
    </group>
  );
}

function sensorStatusColor(reading?: SensorReading): string {
  if (!reading) return "#64748b";
  if (reading.status === "critical") return "#ef4444";
  if (reading.status === "warning") return "#eab308";
  if (reading.status === "offline") return "#94a3b8";
  return "#22c55e";
}

function SensorInstrument({
  id,
  position,
  reading,
}: {
  id: string;
  position: [number, number, number];
  reading?: SensorReading;
}) {
  const [hovered, setHovered] = useState(false);
  const color = sensorStatusColor(reading);

  return (
    <group position={[position[0], 0, position[2]]}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 1.4, 8]} />
        <meshStandardMaterial
          color={PALETTE.steel}
          metalness={0.65}
          roughness={0.35}
        />
      </mesh>
      <mesh
        position={[0, 1.55, 0]}
        castShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.35, 0.4, 0.22]} />
        <meshStandardMaterial
          color="#3d4450"
          metalness={0.45}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0, 1.55, 0.12]}>
        <circleGeometry args={[0.1, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.45}
          metalness={0.2}
          roughness={0.4}
        />
      </mesh>
      {hovered && (
        <Html position={[0, 2.2, 0]} center style={{ pointerEvents: "none" }}>
          <div className="rounded-sm border border-slate-300 bg-white/95 px-2 py-1 font-mono text-[10px] text-slate-700 shadow-sm">
            <div className="font-semibold">{id}</div>
            {reading ? (
              <div>
                {reading.value.toFixed(1)} {reading.unit} · {reading.status}
              </div>
            ) : (
              <div className="text-slate-400">No reading</div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

export function LiveMarkers({ readings }: { readings: SensorReading[] }) {
  const readingMap = new Map(readings.map((r) => [r.sensorId, r]));

  return (
    <group>
      {Object.entries(CAMERA_3D_POSITIONS).map(([id, pos]) => (
        <CctvCamera key={id} id={id} position={pos} />
      ))}
      {Object.entries(SENSOR_3D_POSITIONS).map(([id, pos]) => (
        <SensorInstrument
          key={id}
          id={id}
          position={pos}
          reading={readingMap.get(id)}
        />
      ))}
    </group>
  );
}
