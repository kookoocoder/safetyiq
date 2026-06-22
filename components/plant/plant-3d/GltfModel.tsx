"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import type { Group, Object3D } from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";

function prepareClone(
  source: Object3D,
  skinned: boolean,
  castShadow: boolean,
  receiveShadow: boolean,
): Group {
  const model = (skinned ? cloneSkeleton(source) : source.clone(true)) as Group;
  model.traverse((object) => {
    if ("isMesh" in object && object.isMesh) {
      object.castShadow = castShadow;
      object.receiveShadow = receiveShadow;
      object.frustumCulled = true;
    }
  });
  return model;
}

export function useStaticGltf(
  path: string,
  castShadow = true,
  receiveShadow = true,
) {
  const { scene } = useGLTF(path);
  return useMemo(
    () => prepareClone(scene, false, castShadow, receiveShadow),
    [scene, castShadow, receiveShadow],
  );
}

export function useSkinnedGltf(path: string) {
  const gltf = useGLTF(path);
  const model = useMemo(
    () => prepareClone(gltf.scene, true, true, true),
    [gltf.scene],
  );
  return { ...gltf, model };
}
