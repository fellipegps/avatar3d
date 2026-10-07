import { AnimationMixer, Mesh } from 'three';
import type { AnimationAction } from 'three';
import type { CharacterState } from '../app/contracts';
import type { LoadedCharacter } from './AssetLoader';
import type { CharacterManifest } from './character.manifest';

/** Phase 03 playback/inspection. Blended transitions and automatic blinking belong to phases 06/07. */
export class CharacterPreview {
  private readonly mixer: AnimationMixer;
  private readonly actions: Record<CharacterState, AnimationAction>;
  private readonly face: Mesh[];
  private state: CharacterState = 'idle';
  private reducedMotion = false;
  private disposed = false;

  constructor(readonly asset: LoadedCharacter, private readonly manifest: CharacterManifest) {
    this.mixer = new AnimationMixer(asset.gltf.scene);
    const action = (state: CharacterState): AnimationAction => {
      const clip = asset.gltf.animations.find(clip => clip.name === manifest.clips[state]);
      if (!clip) throw new Error(`Clipe ausente: ${state}`);
      return this.mixer.clipAction(clip);
    };
    this.actions = { idle: action('idle'), thinking: action('thinking'), responding: action('responding') };
    this.face = manifest.face.meshNames.map(name => {
      const mesh = asset.gltf.scene.getObjectByName(name);
      if (!(mesh instanceof Mesh)) throw new Error(`Mesh facial ausente: ${name}`);
      return mesh;
    });
    this.setState('idle');
  }

  setState(state: CharacterState): void {
    if (this.disposed) return;
    this.state = state;
    this.mixer.stopAllAction();
    this.actions[state].reset().play();
    this.mixer.update(0);
    this.asset.gltf.scene.updateMatrixWorld(true);
  }

  setReducedMotion(enabled: boolean): void {
    this.reducedMotion = enabled;
    if (enabled) this.setState(this.state);
  }

  setBlink(value: number): void { this.setMorph(this.manifest.face.blink, value); }
  setMouthOpen(value: number): void { this.setMorph(this.manifest.face.mouth, value); }

  private setMorph(name: string, value: number): void {
    if (this.disposed) return;
    const clamped = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
    for (const mesh of this.face) {
      const index = mesh.morphTargetDictionary?.[name];
      if (index !== undefined && mesh.morphTargetInfluences) mesh.morphTargetInfluences[index] = clamped;
    }
  }

  update(delta: number): void {
    if (!this.disposed && !this.reducedMotion) this.mixer.update(delta);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.asset.gltf.scene);
    this.asset.dispose();
  }
}
