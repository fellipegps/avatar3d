type Point = readonly [number, number, number];
export interface EnvironmentConfig {
  room: { size: Point; backZ: number; thickness: number };
  desk: { position: Point; size: Point; legWidth: number };
  monitors: readonly { position: Point; size: Point; rotationY: number }[];
  lamp: { position: Point; height: number };
  plant: { position: Point; height: number };
  mug: { position: Point; radius: number; height: number };
  colors: { wall: number; floor: number; wood: number; metal: number; screen: number; ceramic: number; leaf: number; coffee: number };
}

/** Metros; +Y para cima, +Z em direção ao observador. Vita permanece no transform do manifesto. */
export const environmentConfig = {
  room: { size: [4, 2.7, 3.6], backZ: -1.4, thickness: 0.08 },
  desk: { position: [0, 0.78, 0.65], size: [2.5, 0.08, 0.9], legWidth: 0.07 },
  monitors: [
    { position: [-0.64, 0.82, 0.39], size: [0.66, 0.35, 0.045], rotationY: 0.12 },
    { position: [0.64, 0.82, 0.39], size: [0.66, 0.35, 0.045], rotationY: -0.12 },
  ],
  lamp: { position: [-1.06, 0.82, 0.66], height: 0.64 },
  plant: { position: [1.05, 0.82, 0.47], height: 0.48 },
  mug: { position: [0.48, 0.82, 0.94], radius: 0.055, height: 0.12 },
  colors: { wall: 0x25303c, floor: 0x38414b, wood: 0x79634f, metal: 0x171f28, screen: 0x526779, ceramic: 0xb9c3c6, leaf: 0x467958, coffee: 0x2d1e15 },
} as const satisfies EnvironmentConfig;

export const sceneConfig = {
  background: 0x111b25,
  camera: { fov: 40, near: 0.1, far: 100, distance: 5 },
  maxDeltaSeconds: 0.05,
  pixelRatio: { normal: 1.5, economy: 1 },
  composition: {
    target: [0, 1.02, 0.35],
    frontDirection: [0, 0.15, 1],
    sideDirection: [1, 0.2, 0.7],
    halfHeight: 1.12, halfWidth: 1.55,
  },
} as const;
