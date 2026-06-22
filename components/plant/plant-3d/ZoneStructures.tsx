"use client";

import { useFrame } from "@react-three/fiber";
import { memo, useRef } from "react";
import type { Mesh } from "three";
import { PALETTE } from "./materials";
import { Pipe } from "./PipeNetwork";
import { svgToWorld } from "./plant-layout";

function Railing({
  position,
  width,
  depth,
  height = 1.1,
}: {
  position: [number, number, number];
  width: number;
  depth: number;
  height?: number;
}) {
  const posts: [number, number][] = [];
  const step = 0.7;
  for (let x = -width / 2; x <= width / 2 + 0.01; x += step) {
    posts.push([x, -depth / 2], [x, depth / 2]);
  }
  for (let z = -depth / 2 + step; z < depth / 2; z += step) {
    posts.push([-width / 2, z], [width / 2, z]);
  }
  return (
    <group position={position}>
      {posts.map((p) => (
        <mesh key={`rp-${p[0]}-${p[1]}`} position={[p[0], height / 2, p[1]]}>
          <cylinderGeometry args={[0.03, 0.03, height, 5]} />
          <meshStandardMaterial
            color={PALETTE.railing}
            metalness={0.55}
            roughness={0.4}
          />
        </mesh>
      ))}
      {(
        [
          [0, height, -depth / 2, width, 0],
          [0, height, depth / 2, width, 0],
          [-width / 2, height, 0, depth, Math.PI / 2],
          [width / 2, height, 0, depth, Math.PI / 2],
        ] as [number, number, number, number, number][]
      ).map((r) => (
        <mesh
          key={`rail-${r[0]}-${r[2]}-${r[4]}`}
          position={[r[0], r[1], r[2]]}
          rotation={[0, r[4], Math.PI / 2]}
        >
          <cylinderGeometry args={[0.025, 0.025, r[3], 5]} />
          <meshStandardMaterial
            color={PALETTE.railing}
            metalness={0.55}
            roughness={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}

function StorageTank({
  position,
  radius = 1.4,
  height = 4.2,
  withLadder = true,
}: {
  position: [number, number, number];
  radius?: number;
  height?: number;
  withLadder?: boolean;
}) {
  return (
    <group position={position}>
      {/* Shell */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, height, 24]} />
        <meshStandardMaterial
          color={PALETTE.tankWhite}
          metalness={0.35}
          roughness={0.42}
        />
      </mesh>
      {/* Roof dome */}
      <mesh position={[0, height, 0]} castShadow>
        <sphereGeometry
          args={[radius * 0.98, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]}
        />
        <meshStandardMaterial
          color={PALETTE.tankRoof}
          metalness={0.55}
          roughness={0.35}
        />
      </mesh>
      {/* Base ring */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[radius + 0.12, radius + 0.15, 0.16, 24]} />
        <meshStandardMaterial
          color={PALETTE.concrete}
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>
      {/* Band */}
      <mesh position={[0, height * 0.55, 0]}>
        <cylinderGeometry args={[radius + 0.02, radius + 0.02, 0.12, 24]} />
        <meshStandardMaterial
          color={PALETTE.steelDark}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
      {withLadder && (
        <group position={[radius + 0.08, 0, 0]}>
          {Array.from({ length: 12 }, (_, i) => {
            const y = 0.35 + i * 0.35;
            return (
              <mesh key={`rung-y${y.toFixed(2)}`} position={[0, y, 0]}>
                <boxGeometry args={[0.08, 0.04, 0.45]} />
                <meshStandardMaterial
                  color={PALETTE.safetyYellow}
                  metalness={0.4}
                  roughness={0.45}
                />
              </mesh>
            );
          })}
          <mesh position={[0, height / 2, 0.2]}>
            <boxGeometry args={[0.05, height, 0.05]} />
            <meshStandardMaterial
              color={PALETTE.steelDark}
              metalness={0.7}
              roughness={0.35}
            />
          </mesh>
          <mesh position={[0, height / 2, -0.2]}>
            <boxGeometry args={[0.05, height, 0.05]} />
            <meshStandardMaterial
              color={PALETTE.steelDark}
              metalness={0.7}
              roughness={0.35}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

function BundWall({
  position,
  size,
  wallH = 0.7,
}: {
  position: [number, number, number];
  size: [number, number];
  wallH?: number;
}) {
  const t = 0.2;
  const [w, d] = size;
  return (
    <group position={position}>
      {(
        [
          [0, wallH / 2, -d / 2, w, t],
          [0, wallH / 2, d / 2, w, t],
          [-w / 2, wallH / 2, 0, t, d],
          [w / 2, wallH / 2, 0, t, d],
        ] as [number, number, number, number, number][]
      ).map((s) => (
        <mesh
          key={`bund-${s[0]}-${s[2]}-${s[3]}x${s[4]}`}
          position={[s[0], s[1], s[2]]}
          castShadow
        >
          <boxGeometry args={[s[3], wallH, s[4]]} />
          <meshStandardMaterial
            color={PALETTE.concrete}
            roughness={0.9}
            metalness={0.05}
          />
        </mesh>
      ))}
    </group>
  );
}

function Zone1Chemical({ origin }: { origin: [number, number, number] }) {
  return (
    <group position={origin}>
      <BundWall position={[0, 0, 0]} size={[9, 7]} />
      <StorageTank position={[-2.2, 0, -1.2]} radius={1.5} height={4.5} />
      <StorageTank position={[1.6, 0, -1.4]} radius={1.25} height={3.8} />
      <StorageTank position={[-0.4, 0, 1.8]} radius={1.1} height={3.2} />
      <Railing
        position={[-2.2, 4.5, -1.2]}
        width={1.4}
        depth={1.4}
        height={0.9}
      />
      <Pipe
        position={[-0.3, 1.2, -1.3]}
        rotation={[0, 0, Math.PI / 2]}
        length={3.5}
        radius={0.1}
      />
      <Pipe
        position={[1.6, 2, 0.2]}
        rotation={[Math.PI / 2, 0, 0]}
        length={2.8}
        radius={0.08}
        color={PALETTE.pipeInsul}
      />
      {/* Small pump skid */}
      <mesh position={[3.2, 0.45, 2]} castShadow>
        <boxGeometry args={[1.4, 0.9, 1]} />
        <meshStandardMaterial
          color={PALETTE.steel}
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}

function RotatingCompressor() {
  const rotor = useRef<Mesh>(null);
  useFrame((_, dt) => {
    if (rotor.current) rotor.current.rotation.z += dt * 2.2;
  });
  return (
    <group position={[1.5, 0, 1.2]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[2.2, 1.1, 1.4]} />
        <meshStandardMaterial
          color={PALETTE.steelDark}
          metalness={0.7}
          roughness={0.32}
        />
      </mesh>
      <mesh ref={rotor} position={[0, 1.35, 0]} rotation={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.35, 16]} />
        <meshStandardMaterial
          color={PALETTE.steelLight}
          metalness={0.8}
          roughness={0.25}
        />
      </mesh>
      {/* Fan blades hint */}
      <mesh position={[0, 1.35, 0.2]}>
        <boxGeometry args={[1, 0.08, 0.05]} />
        <meshStandardMaterial
          color={PALETTE.safetyYellow}
          metalness={0.4}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}

function Zone2Mechanical({ origin }: { origin: [number, number, number] }) {
  return (
    <group position={origin}>
      {/* Pump / compressor house */}
      <mesh position={[-1.5, 1.6, -1]} castShadow receiveShadow>
        <boxGeometry args={[5, 3.2, 4]} />
        <meshStandardMaterial
          color={PALETTE.building}
          roughness={0.85}
          metalness={0.08}
        />
      </mesh>
      {/* Roof */}
      <mesh position={[-1.5, 3.35, -1]} castShadow>
        <boxGeometry args={[5.3, 0.25, 4.3]} />
        <meshStandardMaterial
          color={PALETTE.roof}
          metalness={0.45}
          roughness={0.5}
        />
      </mesh>
      {/* Roof vents */}
      {[-2.5, -0.5].map((x) => (
        <mesh key={`vent-${x}`} position={[x, 3.7, -1]}>
          <cylinderGeometry args={[0.25, 0.3, 0.5, 8]} />
          <meshStandardMaterial
            color={PALETTE.steelDark}
            metalness={0.7}
            roughness={0.35}
          />
        </mesh>
      ))}
      {/* Windows */}
      {[-2.8, -1.5, -0.2].map((x) => (
        <mesh key={`win-${x}`} position={[x, 1.8, 1.02]}>
          <boxGeometry args={[0.7, 0.9, 0.05]} />
          <meshStandardMaterial
            color={PALETTE.window}
            metalness={0.3}
            roughness={0.2}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
      <RotatingCompressor />
      {/* Outdoor pipe rack stub */}
      <Pipe
        position={[2.5, 1.5, -1]}
        rotation={[0, 0, Math.PI / 2]}
        length={3}
        radius={0.14}
      />
      <Pipe
        position={[2.5, 1.9, -0.5]}
        rotation={[0, 0, Math.PI / 2]}
        length={3}
        radius={0.1}
        color={PALETTE.pipeInsul}
      />
    </group>
  );
}

function DistillationColumn({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      <mesh position={[0, 4.5, 0]} castShadow>
        <cylinderGeometry args={[0.7, 0.85, 9, 16]} />
        <meshStandardMaterial
          color={PALETTE.steelLight}
          metalness={0.55}
          roughness={0.38}
        />
      </mesh>
      {/* Trays rings */}
      {[2, 3.5, 5, 6.5, 8].map((y) => (
        <mesh key={`tray-${y}`} position={[0, y, 0]}>
          <cylinderGeometry args={[0.9, 0.9, 0.12, 16]} />
          <meshStandardMaterial
            color={PALETTE.steelDark}
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
      ))}
      {/* Top platform */}
      <mesh position={[0, 9.1, 0]}>
        <cylinderGeometry args={[1.1, 1.1, 0.15, 16]} />
        <meshStandardMaterial
          color={PALETTE.steel}
          metalness={0.65}
          roughness={0.4}
        />
      </mesh>
      <Railing position={[0, 9.2, 0]} width={1.8} depth={1.8} height={0.85} />
      {/* Side piping */}
      <Pipe
        position={[1.1, 4, 0]}
        rotation={[0, 0, 0]}
        length={6}
        radius={0.1}
        color={PALETTE.pipeInsul}
      />
      <Pipe
        position={[0, 2.5, 1.1]}
        rotation={[Math.PI / 2, 0, 0]}
        length={2.5}
        radius={0.12}
      />
    </group>
  );
}

function FlareStack({ position }: { position: [number, number, number] }) {
  const flame = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (flame.current) {
      const s = 0.85 + Math.sin(clock.elapsedTime * 8) * 0.15;
      flame.current.scale.set(
        s,
        0.9 + Math.sin(clock.elapsedTime * 11) * 0.2,
        s,
      );
    }
  });
  return (
    <group position={position}>
      <mesh position={[0, 5.5, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.28, 11, 10]} />
        <meshStandardMaterial
          color={PALETTE.steel}
          metalness={0.7}
          roughness={0.32}
        />
      </mesh>
      {/* Guy wire stubs */}
      <mesh position={[0, 11.1, 0]}>
        <cylinderGeometry args={[0.35, 0.25, 0.4, 8]} />
        <meshStandardMaterial
          color={PALETTE.steelDark}
          metalness={0.75}
          roughness={0.3}
        />
      </mesh>
      <mesh ref={flame} position={[0, 11.8, 0]}>
        <coneGeometry args={[0.28, 1.1, 8]} />
        <meshStandardMaterial
          color={PALETTE.flareTip}
          emissive={PALETTE.flareTip}
          emissiveIntensity={1.4}
          roughness={0.4}
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  );
}

function Zone3Flammable({ origin }: { origin: [number, number, number] }) {
  return (
    <group position={origin}>
      <BundWall position={[-1.5, 0, 0.5]} size={[6.5, 5.5]} />
      <StorageTank position={[-2.5, 0, 0]} radius={1.8} height={3.6} />
      <StorageTank position={[0.3, 0, 1.2]} radius={1.3} height={3} />
      <DistillationColumn position={[3.2, 0, -1.5]} />
      <FlareStack position={[4.5, 0, 2.2]} />
      <Pipe
        position={[1.5, 1.5, -1]}
        rotation={[0, Math.PI / 4, Math.PI / 2]}
        length={4}
        radius={0.11}
      />
    </group>
  );
}

function Transformer({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[1.8, 2.2, 1.4]} />
        <meshStandardMaterial
          color={PALETTE.transformer}
          metalness={0.55}
          roughness={0.4}
        />
      </mesh>
      {/* Bushings */}
      {[-0.45, 0, 0.45].map((x) => (
        <mesh key={`bush-${x}`} position={[x, 2.45, 0]}>
          <cylinderGeometry args={[0.1, 0.12, 0.5, 8]} />
          <meshStandardMaterial
            color="#c4b8a0"
            metalness={0.2}
            roughness={0.5}
          />
        </mesh>
      ))}
      {/* Cooling fins */}
      <mesh position={[0.95, 1.1, 0]}>
        <boxGeometry args={[0.15, 1.8, 1.2]} />
        <meshStandardMaterial
          color={PALETTE.steelDark}
          metalness={0.65}
          roughness={0.35}
        />
      </mesh>
      <mesh position={[-0.95, 1.1, 0]}>
        <boxGeometry args={[0.15, 1.8, 1.2]} />
        <meshStandardMaterial
          color={PALETTE.steelDark}
          metalness={0.65}
          roughness={0.35}
        />
      </mesh>
    </group>
  );
}

function SwitchgearCabinet({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[1.2, 2.2, 0.7]} />
        <meshStandardMaterial color="#4a5560" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.3, 0.36]}>
        <boxGeometry args={[0.7, 0.9, 0.04]} />
        <meshStandardMaterial color="#1e293b" metalness={0.2} roughness={0.5} />
      </mesh>
      <mesh position={[0.35, 1.1, 0.36]}>
        <boxGeometry args={[0.08, 0.25, 0.06]} />
        <meshStandardMaterial
          color={PALETTE.safetyYellow}
          metalness={0.3}
          roughness={0.5}
        />
      </mesh>
    </group>
  );
}

function Zone4Electrical({ origin }: { origin: [number, number, number] }) {
  return (
    <group position={origin}>
      {/* Substation fence */}
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[14, 2.4, 0.06]} />
        <meshStandardMaterial
          color={PALETTE.fence}
          metalness={0.6}
          roughness={0.4}
          transparent
          opacity={0.35}
        />
      </mesh>
      {/* Inner yard pad already from site; equipment */}
      <Transformer position={[-4, 0, -2]} />
      <Transformer position={[-1.5, 0, -2]} />
      <SwitchgearCabinet position={[1.5, 0, -2.2]} />
      <SwitchgearCabinet position={[3, 0, -2.2]} />
      <SwitchgearCabinet position={[4.5, 0, -2.2]} />
      {/* Control building */}
      <mesh position={[3, 1.4, 2.5]} castShadow receiveShadow>
        <boxGeometry args={[5, 2.8, 3.5]} />
        <meshStandardMaterial
          color={PALETTE.building}
          roughness={0.85}
          metalness={0.08}
        />
      </mesh>
      <mesh position={[3, 2.9, 2.5]}>
        <boxGeometry args={[5.2, 0.2, 3.7]} />
        <meshStandardMaterial
          color={PALETTE.roof}
          metalness={0.4}
          roughness={0.5}
        />
      </mesh>
      {/* Danger stripe */}
      <mesh position={[-2.5, 0.15, 1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 0.4]} />
        <meshStandardMaterial color={PALETTE.safetyYellow} roughness={0.7} />
      </mesh>
    </group>
  );
}

function ShippingContainer({
  position,
  color,
  rotationY = 0,
}: {
  position: [number, number, number];
  color: string;
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.5, 2.4, 2.2]} />
        <meshStandardMaterial color={color} metalness={0.35} roughness={0.55} />
      </mesh>
      {/* Corrugation hint */}
      {[-1.5, 0, 1.5].map((x) => (
        <mesh key={`corr-${x}`} position={[x, 1.2, 1.12]}>
          <boxGeometry args={[0.08, 2.2, 0.04]} />
          <meshStandardMaterial color={color} metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function Zone5General({ origin }: { origin: [number, number, number] }) {
  return (
    <group position={origin}>
      {/* Warehouse */}
      <mesh position={[-2, 2.4, -1.5]} castShadow receiveShadow>
        <boxGeometry args={[10, 4.8, 7]} />
        <meshStandardMaterial
          color={PALETTE.building}
          roughness={0.88}
          metalness={0.06}
        />
      </mesh>
      <mesh position={[-2, 5, -1.5]} castShadow>
        <boxGeometry args={[10.4, 0.35, 7.4]} />
        <meshStandardMaterial
          color={PALETTE.roof}
          metalness={0.4}
          roughness={0.5}
        />
      </mesh>
      {/* Loading bay */}
      <mesh position={[2.9, 1.4, -1.5]}>
        <boxGeometry args={[0.1, 2.6, 3.2]} />
        <meshStandardMaterial color="#3d4450" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Clerestory windows */}
      {[-5, -2.5, 0, 2.5].map((x) => (
        <mesh key={`cl-${x}`} position={[x - 2, 4, 2.02]}>
          <boxGeometry args={[1.4, 0.6, 0.05]} />
          <meshStandardMaterial
            color={PALETTE.window}
            metalness={0.25}
            roughness={0.25}
            transparent
            opacity={0.65}
          />
        </mesh>
      ))}
      <ShippingContainer
        position={[4.5, 0, 3]}
        color={PALETTE.containerOrange}
      />
      <ShippingContainer
        position={[4.5, 0, 5.5]}
        color={PALETTE.containerBlue}
        rotationY={0.08}
      />
      {/* Cooling unit */}
      <mesh position={[5.5, 0.7, -3]} castShadow>
        <boxGeometry args={[2.5, 1.4, 1.8]} />
        <meshStandardMaterial
          color={PALETTE.steel}
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[5.5, 1.5, -3]}>
        <cylinderGeometry args={[0.5, 0.5, 0.3, 12]} />
        <meshStandardMaterial
          color={PALETTE.steelDark}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

export const ZoneStructures = memo(function ZoneStructures() {
  const z1 = svgToWorld(200, 175);
  const z2 = svgToWorld(505, 175);
  const z3 = svgToWorld(805, 175);
  const z4 = svgToWorld(275, 480);
  const z5 = svgToWorld(730, 480);

  return (
    <group>
      <Zone1Chemical origin={z1} />
      <Zone2Mechanical origin={z2} />
      <Zone3Flammable origin={z3} />
      <Zone4Electrical origin={z4} />
      <Zone5General origin={z5} />
    </group>
  );
});
