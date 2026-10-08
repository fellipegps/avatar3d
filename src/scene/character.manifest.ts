import type { CharacterState } from '../app/contracts';

export interface CharacterManifest {
  name: string;
  path: string;
  transform: { scale: number; position: readonly [number, number, number]; rotationY: number };
  measurements: { bindPoseHeightMeters: number; sourceFloorY: number; sourceForward: '-Z'; sourceUp: '+Y' };
  clips: Record<CharacterState, string>;
  animation: { transitionSeconds: number; lockedTranslationNodes: readonly string[] };
  face: { meshNames: readonly string[]; blink: string; mouth: string;
    blinkTiming: { intervalMin: number; intervalMax: number; closing: number; closed: number; opening: number } };
  requiredBones: readonly string[];
}

// Names are preserved from the inspected Vita source; clips are embedded by prepare-character.mjs.
export const characterManifest: CharacterManifest = {
  name: 'Vita',
  path: 'models/character.glb',
  transform: { scale: 1, position: [0, 0.000114792019, 0], rotationY: Math.PI },
  measurements: { bindPoseHeightMeters: 1.71307699, sourceFloorY: -0.000114792019, sourceForward: '-Z', sourceUp: '+Y' },
  clips: { idle: 'Vita_Idle', thinking: 'Vita_Thinking', responding: 'Vita_Responding' },
  animation: { transitionSeconds: 0.3, lockedTranslationNodes: ['Root', 'J_Bip_C_Hips'] },
  face: {
    meshNames: ['VitaFace', 'VitaFace_1', 'VitaFace_2', 'VitaFace_3', 'VitaFace_4',
      'VitaFace_5', 'VitaFace_6', 'VitaFace_7', 'VitaFace_8'],
    blink: 'Face.M_F00_000_00_Fcl_EYE_Close',
    mouth: 'Face.M_F00_000_00_Fcl_MTH_A',
    blinkTiming: { intervalMin: 2.5, intervalMax: 5.5, closing: 0.06, closed: 0.04, opening: 0.1 },
  },
  requiredBones: ['J_Bip_C_Hips', 'J_Bip_C_Head', 'J_Bip_C_Chest', 'J_Bip_L_UpperArm', 'J_Bip_R_UpperArm'],
};
