import { Mesh } from 'three';
import type { Object3D } from 'three';
import type { CharacterManifest } from './character.manifest';

type FaceConfig = CharacterManifest['face'];
type Binding = { values: number[]; blink: number; mouth: number };
type BlinkPhase = 'waiting' | 'closing' | 'closed' | 'opening';
const clamp = (value: number): number => Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;

/** Validação compartilhada pelo loader e controlador; nenhum nome facial implícito. */
export function resolveFaceBindings(root: Object3D, config: FaceConfig): Binding[] {
  if (!config.meshNames.length || config.blink === config.mouth) throw new Error('Mapeamento facial inválido.');
  return config.meshNames.map(name => {
    const mesh = root.getObjectByName(name);
    if (!(mesh instanceof Mesh)) throw new Error(`Mesh facial ausente: ${name}`);
    const values = mesh.morphTargetInfluences;
    const indices = [config.blink, config.mouth].map(morph => {
      const index = mesh.morphTargetDictionary?.[morph];
      if (!values || index === undefined || !Number.isInteger(index) || index < 0 || index >= values.length
        || !Number.isFinite(values[index])) throw new Error(`Controle facial ausente ou inválido em ${name}: ${morph}`);
      return index;
    });
    if (indices[0] === indices[1]) throw new Error(`Controles faciais sobrepostos em ${name}.`);
    return { values: values!, blink: indices[0]!, mouth: indices[1]! };
  });
}

/** Somente morph targets. O relógio é o delta recebido após o mixer corporal. */
export class FaceController {
  private readonly bindings: Binding[];
  private mouth = 0;
  private blink = 0;
  private manualBlink: number | null = null;
  private autoBlink = true;
  private reducedMotion = false;
  private disposed = false;
  private phase: BlinkPhase = 'waiting';
  private elapsed = 0;
  private wait = 0;

  constructor(root: Object3D, private readonly config: FaceConfig, private readonly random: () => number = Math.random) {
    const timing = config.blinkTiming;
    if (![timing.intervalMin, timing.intervalMax, timing.closing, timing.closed, timing.opening].every(value => Number.isFinite(value) && value > 0)
      || timing.intervalMax < timing.intervalMin) throw new Error('Tempos do piscar inválidos.');
    this.bindings = resolveFaceBindings(root, config);
    this.restartBlink();
    this.apply();
  }

  setMouthOpen(value: number): void {
    if (this.disposed) return;
    this.mouth = clamp(value); this.apply();
  }

  /** Ajuste manual desativa o automático até uma nova seleção explícita. */
  setBlink(value: number): void {
    if (this.disposed) return;
    this.autoBlink = false;
    this.manualBlink = clamp(value); this.blink = this.manualBlink; this.apply();
  }

  setAutoBlink(enabled: boolean): void {
    if (this.disposed) return;
    this.autoBlink = enabled; this.manualBlink = null; this.restartBlink(); this.apply();
  }

  setReducedMotion(enabled: boolean): void {
    if (this.disposed || enabled === this.reducedMotion) return;
    this.reducedMotion = enabled;
    this.restartBlink(); this.apply();
  }

  reset(): void {
    if (this.disposed) return;
    this.mouth = 0; this.manualBlink = null; this.restartBlink(); this.apply();
  }

  private restartBlink(): void {
    const sample = this.random();
    const unit = Number.isFinite(sample) ? clamp(sample) : 0.5;
    this.wait = this.config.blinkTiming.intervalMin + unit * (this.config.blinkTiming.intervalMax - this.config.blinkTiming.intervalMin);
    this.phase = 'waiting'; this.elapsed = 0; this.blink = this.manualBlink ?? 0;
  }

  private apply(): void {
    for (const binding of this.bindings) {
      binding.values[binding.blink] = this.blink;
      binding.values[binding.mouth] = this.mouth;
    }
  }

  update(delta: number): void {
    if (this.disposed || !Number.isFinite(delta) || delta <= 0) return;
    if (this.autoBlink && !this.reducedMotion && this.manualBlink === null) {
      // Uma suspensão não deve comprimir vários piscados num único quadro.
      if (delta > 0.25) this.restartBlink();
      else {
        let remaining = delta;
        let transitions = 0;
        while (remaining > 0 && transitions < 8) {
          const timing = this.config.blinkTiming;
          const duration = this.phase === 'waiting' ? this.wait : timing[this.phase];
          const step = Math.min(remaining, duration - this.elapsed);
          this.elapsed += step; remaining -= step;
          if (this.elapsed >= duration) {
            transitions++;
            this.elapsed = 0;
            if (this.phase === 'waiting') this.phase = 'closing';
            else if (this.phase === 'closing') this.phase = 'closed';
            else if (this.phase === 'closed') this.phase = 'opening';
            else this.restartBlink();
          }
        }
        if (remaining > 0) this.restartBlink();
        const ease = (value: number): number => value * value * (3 - 2 * value);
        this.blink = this.phase === 'waiting' ? 0 : this.phase === 'closed' ? 1
          : this.phase === 'closing' ? ease(this.elapsed / this.config.blinkTiming.closing)
            : 1 - ease(this.elapsed / this.config.blinkTiming.opening);
      }
    }
    this.apply();
  }

  getStatus() {
    return { mouth: this.mouth, blink: this.blink, phase: this.phase, wait: this.wait,
      automatic: this.autoBlink, manual: this.manualBlink !== null, reducedMotion: this.reducedMotion, disposed: this.disposed };
  }

  dispose(): void {
    if (this.disposed) return;
    this.mouth = 0; this.blink = 0; this.apply();
    this.disposed = true; this.bindings.length = 0;
  }
}
