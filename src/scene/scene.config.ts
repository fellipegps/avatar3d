type Point = readonly [number, number, number];
export const visualConfig = {
  accents: { blue: 0x45a9ff, green: 0x51ddb2, purple: 0xa887ff },
  emissiveIntensity: { strip: 1.8, screen: 0.75, lamp: 0.25 },
  lighting: {
    sky: 0xaecbff, ground: 0x161322, ambientIntensity: 0.65,
    key: { color: 0xffeee2, intensity: 2.5, position: [1.2, 2.6, 3], target: [0, 1.4, 0] },
    rim: { color: 0xa48aff, intensity: 3.5, position: [-1.3, 2.2, -0.9], target: [0, 1.3, 0] },
    lamp: { color: 0xffdaa4, intensity: 0.4, distance: 1.4 },
    exposure: 1,
  },
  contactShadow: { opacity: 0.5, textureSize: 128 },
  panels: {
    width: 768, height: 384,
    background: '#0b1421', foreground: '#dcebf5', muted: '#8da7bf', grid: '#23384c',
    accent: ['#51ddb2', '#45a9ff'],
  },
} as const;
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
  colors: { wall: 0x121824, floor: 0x1c2431, wood: 0x302d35, metal: 0x101923, screen: 0xffffff, ceramic: 0xaac0c8, leaf: 0x2f6c50, coffee: 0x2d1e15 },
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
    compact: { aspect: 1, fullAspect: 1.7, target: [0, 1.17, 0.25], halfHeight: 0.85, halfWidth: 0.75 },
  },
} as const;
