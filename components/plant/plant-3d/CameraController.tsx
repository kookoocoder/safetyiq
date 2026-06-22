"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { type ComponentRef, useEffect, useRef } from "react";
import * as THREE from "three";
import { DEFAULT_CAMERA_TARGET } from "./plant-layout";

type OrbitControlsHandle = ComponentRef<typeof OrbitControls>;

export interface FlyToRequest {
  position: [number, number, number];
  target: [number, number, number];
  /** Bump to re-trigger the same destination */
  nonce: number;
}

export function CameraRig({ flyTo }: { flyTo: FlyToRequest | null }) {
  const controlsRef = useRef<OrbitControlsHandle>(null);
  const { camera } = useThree();
  const anim = useRef<{
    fromPos: THREE.Vector3;
    toPos: THREE.Vector3;
    fromTarget: THREE.Vector3;
    toTarget: THREE.Vector3;
    t: number;
    active: boolean;
  } | null>(null);

  useEffect(() => {
    if (!flyTo || !controlsRef.current) return;
    const controls = controlsRef.current;
    anim.current = {
      fromPos: camera.position.clone(),
      toPos: new THREE.Vector3(...flyTo.position),
      fromTarget: controls.target.clone(),
      toTarget: new THREE.Vector3(...flyTo.target),
      t: 0,
      active: true,
    };
  }, [flyTo, camera]);

  useFrame((_, dt) => {
    const a = anim.current;
    const controls = controlsRef.current;
    if (!a?.active || !controls) return;

    a.t = Math.min(1, a.t + dt / 1.15);
    const ease = 1 - (1 - a.t) ** 3;
    camera.position.lerpVectors(a.fromPos, a.toPos, ease);
    controls.target.lerpVectors(a.fromTarget, a.toTarget, ease);
    controls.update();

    if (a.t >= 1) a.active = false;
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minPolarAngle={0.25}
      maxPolarAngle={Math.PI / 2 - 0.08}
      minDistance={6}
      maxDistance={48}
      target={DEFAULT_CAMERA_TARGET}
    />
  );
}
