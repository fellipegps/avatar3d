import { AnimationMixer, LoopRepeat, PropertyBinding } from 'three';
import type { AnimationAction, Object3D } from 'three';
import type { CharacterState } from '../app/contracts';
import type { LoadedCharacter } from './AssetLoader';
import type { CharacterManifest } from './character.manifest';
import { FaceController } from './FaceController';

const states: readonly CharacterState[] = ['idle', 'thinking', 'responding'];
type Weights = Record<CharacterState, number>;

/** Comandos tipados; o único relógio vem do loop de SceneController. */
export class CharacterController {
  private readonly mixer: AnimationMixer;
  private readonly actions: Record<CharacterState, AnimationAction>;
  private readonly face: FaceController;
  private readonly weights: Weights = { idle: 1, thinking: 0, responding: 0 };
  private requestedState: CharacterState = 'idle';
  private targetState: CharacterState = 'idle';
  private transition: { elapsed: number; from: Weights } | null = null;
  private reducedMotion = false;
  private disposed = false;

  constructor(readonly asset: LoadedCharacter, private readonly manifest: CharacterManifest) {
    if (!Number.isFinite(manifest.animation.transitionSeconds) || manifest.animation.transitionSeconds <= 0) {
      throw new Error('Duração de transição inválida.');
    }
    const clips = states.map(state => {
      const source = asset.gltf.animations.find(clip => clip.name === manifest.clips[state]);
      if (!source || source.duration <= 0) throw new Error(`Clipe ausente ou inválido: ${state} (${manifest.clips[state]})`);
      if (source.tracks.some(track => track.name.includes('morphTargetInfluences'))) {
        throw new Error(`O clipe corporal ${source.name} sobrescreve controles faciais.`);
      }
      const clip = source.clone();
      clip.tracks = clip.tracks.filter(track => {
        const parsed = PropertyBinding.parseTrackName(track.name);
        const node = PropertyBinding.findNode(asset.gltf.scene, parsed.nodeName) as Object3D | null;
        const transform = ['position', 'quaternion', 'rotation', 'scale'].includes(parsed.propertyName);
        // Nunca animar o transform global do manifesto; remover deslocamento nos nós de root motion.
        if (node === asset.gltf.scene && transform) return false;
        return !(parsed.propertyName === 'position' && node
          && manifest.animation.lockedTranslationNodes.includes(node.name));
      });
      if (!clip.tracks.length) throw new Error(`Clipe corporal sem canais utilizáveis: ${source.name}`);
      return clip;
    });
    this.face = new FaceController(asset.gltf.scene, manifest.face);
    this.mixer = new AnimationMixer(asset.gltf.scene);
    this.actions = {
      idle: this.mixer.clipAction(clips[0]!), thinking: this.mixer.clipAction(clips[1]!), responding: this.mixer.clipAction(clips[2]!),
    };
    for (const state of states) this.actions[state].setLoop(LoopRepeat, Infinity).setEffectiveWeight(this.weights[state]);
    this.actions.idle.play();
    this.mixer.update(0);
    asset.gltf.scene.updateMatrixWorld(true);
  }

  setState(state: CharacterState): void {
    if (this.disposed || state === this.requestedState) return;
    this.requestedState = state;
    if (!this.reducedMotion) this.transitionTo(state);
  }

  private transitionTo(state: CharacterState): void {
    const incoming = this.actions[state];
    // Uma ação ainda contribuindo para a mistura mantém seu tempo quando é escolhida novamente.
    if (this.weights[state] === 0) incoming.reset().setEffectiveWeight(0).play();
    this.targetState = state;
    this.transition = { elapsed: 0, from: { ...this.weights } };
  }

  setReducedMotion(enabled: boolean): void {
    if (this.disposed || enabled === this.reducedMotion) return;
    this.reducedMotion = enabled;
    this.face.setReducedMotion(enabled);
    if (!enabled && this.requestedState !== this.targetState) this.transitionTo(this.requestedState);
  }

  setBlink(value: number): void { this.face.setBlink(value); }
  setMouthOpen(value: number): void { this.face.setMouthOpen(value); }
  setAutoBlink(enabled: boolean): void { this.face.setAutoBlink(enabled); }
  resetFace(): void { this.face.reset(); }
  getFaceStatus() { return this.face.getStatus(); }

  update(delta: number): void {
    if (this.disposed || this.reducedMotion || !Number.isFinite(delta) || delta <= 0) return;
    if (this.transition) {
      this.transition.elapsed += delta;
      const t = Math.min(1, this.transition.elapsed / this.manifest.animation.transitionSeconds);
      const eased = t * t * (3 - 2 * t);
      for (const state of states) {
        this.weights[state] = this.transition.from[state] * (1 - eased) + (state === this.targetState ? eased : 0);
        this.actions[state].setEffectiveWeight(this.weights[state]);
        if (t === 1 && state !== this.targetState) this.actions[state].stop();
      }
      if (t === 1) this.transition = null;
    }
    this.mixer.update(delta);
    this.face.update(delta);
  }

  /** Snapshot usado pela inspeção/testes, sem coletar dados a cada frame na aplicação. */
  getAnimationStatus() {
    return {
      requestedState: this.requestedState, targetState: this.targetState, transitioning: this.transition !== null,
      reducedMotion: this.reducedMotion, disposed: this.disposed,
      actions: states.map(state => ({ state, time: this.actions[state].time, weight: this.actions[state].getEffectiveWeight(),
        running: this.actions[state].isRunning() })),
    };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.transition = null;
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.asset.gltf.scene);
    this.face.dispose();
    this.asset.dispose();
  }
}
