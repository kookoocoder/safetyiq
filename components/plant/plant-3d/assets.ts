/** Bundled Sketchfab / user-provided plant digital-twin assets. */
export const PLANT_ASSETS = {
  factory: "/models/factory_industrial_installation.glb",
  solar: "/models/solar_energy_for_industry.glb",
  walker: "/models/worker_taking_a_walk.glb",
  omniWorker: "/models/boneworks_-_omni_worker.glb",
} as const;

/** Factory native bbox ~388×127×380 → ~0.055 fits the SafetyIQ yard. */
export const FACTORY_OVERVIEW_SCALE = 0.055;
/** Solar plant native bbox ~152×74×142 → sits beside electrical / general. */
export const SOLAR_OVERVIEW_SCALE = 0.09;
/** Omni worker native height ~6.5 → human scale. */
export const OMNI_WORKER_SCALE = 0.28;
/** Walking worker is already ~1.88m tall. */
export const WALKER_SCALE = 1;

export const WALKER_CLIP = "mixamo.com";
