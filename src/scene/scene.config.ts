export const sceneConfig = {
  background: 0x111b25,
  camera: { fov: 40, near: 0.1, far: 100, distance: 5 },
  maxDeltaSeconds: 0.05,
  pixelRatio: { normal: 1.5, economy: 1 },
  reference: { size: 1.4, radiansPerSecond: 0.3 },
} as const;
