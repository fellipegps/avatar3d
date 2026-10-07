import {
  BoxGeometry, Color, Mesh, MeshNormalMaterial, PerspectiveCamera, Scene, WebGLRenderer,
} from 'three';
import type { QualityProfile, ScenePort } from '../app/contracts';
import { sceneConfig } from './scene.config';

export type SceneAvailability =
  | { available: true }
  | { available: false; message: string };

export type SceneUpdater = (deltaSeconds: number) => void;

const owners = new WeakMap<HTMLElement, SceneController>();

/** Capacidades desta fase; personagem e boca serão adicionadas nas fases correspondentes. */
export class SceneController implements Pick<ScenePort, 'setQuality' | 'setReducedMotion' | 'dispose'> {
  readonly scene = new Scene();
  readonly camera = new PerspectiveCamera(
    sceneConfig.camera.fov, 1, sceneConfig.camera.near, sceneConfig.camera.far,
  );
  private readonly container: HTMLElement;
  private readonly onAvailability: (state: SceneAvailability) => void;
  private readonly updaters = new Set<SceneUpdater>();
  private renderer: WebGLRenderer | null = null;
  private observer: ResizeObserver | null = null;
  private reference: Mesh<BoxGeometry, MeshNormalMaterial> | null = null;
  private frame: number | null = null;
  private previousTime: number | null = null;
  private width = 0;
  private height = 0;
  private quality: QualityProfile = 'normal';
  private reducedMotion = false;
  private disposed = false;
  private contextLost = false;
  private state: SceneAvailability = { available: false, message: 'Cena não inicializada.' };

  constructor(container: HTMLElement, onAvailability: (state: SceneAvailability) => void = () => {}) {
    owners.get(container)?.dispose();
    owners.set(container, this);
    this.container = container;
    this.onAvailability = onAvailability;
    this.scene.background = new Color(sceneConfig.background);
    this.camera.position.z = sceneConfig.camera.distance;

    try {
      // A versão instalada de WebGLRenderer usa exclusivamente WebGL 2.
      this.renderer = new WebGLRenderer({ antialias: true, powerPreference: 'default' });
      const canvas = this.renderer.domElement;
      canvas.className = 'scene-canvas';
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', 'Cubo 3D de referência para validar o enquadramento');
      canvas.addEventListener('webglcontextlost', this.onContextLost);
      canvas.addEventListener('webglcontextrestored', this.onContextRestored);
      this.container.append(canvas);

      this.reference = new Mesh(
        new BoxGeometry(sceneConfig.reference.size, sceneConfig.reference.size, sceneConfig.reference.size),
        new MeshNormalMaterial(),
      );
      this.reference.rotation.set(0.3, 0.5, 0);
      this.scene.add(this.reference);
      this.updaters.add((delta) => {
        if (this.reference && !this.reducedMotion) {
          this.reference.rotation.y += delta * sceneConfig.reference.radiansPerSecond;
        }
      });

      document.addEventListener('visibilitychange', this.onVisibilityChange);
      this.observer = new ResizeObserver((entries) => {
        const entry = entries.find((item) => item.target === this.container);
        if (entry) this.resize(entry.contentRect.width, entry.contentRect.height);
      });
      this.observer.observe(this.container);
      this.state = { available: true };
      this.resize(this.container.clientWidth, this.container.clientHeight);
      this.onAvailability(this.state);
    } catch {
      this.fail('Não foi possível iniciar o 3D. Verifique o suporte a WebGL 2 e a aceleração gráfica do navegador.');
    }
  }

  get availability(): SceneAvailability {
    return { ...this.state };
  }

  registerUpdater(update: SceneUpdater): () => void {
    if (this.disposed) throw new Error('Não é possível registrar atualizações em uma cena descartada.');
    this.updaters.add(update);
    return () => { this.updaters.delete(update); };
  }

  setReducedMotion(enabled: boolean): void {
    this.reducedMotion = enabled;
  }

  setQuality(profile: QualityProfile): void {
    this.quality = profile;
    this.resize(this.width, this.height);
  }

  private readonly onVisibilityChange = (): void => {
    if (document.hidden) this.pause();
    else this.schedule();
  };

  private readonly onContextLost = (event: Event): void => {
    event.preventDefault();
    this.contextLost = true;
    this.pause();
    this.state = { available: false, message: 'O contexto gráfico foi perdido. Aguardando recuperação do navegador.' };
    this.onAvailability(this.state);
  };

  private readonly onContextRestored = (): void => {
    if (this.disposed) return;
    this.contextLost = false;
    this.state = { available: true };
    this.resize(this.width, this.height);
    this.onAvailability(this.state);
  };

  private resize(width: number, height: number): void {
    if (this.disposed || !this.renderer) return;
    this.width = Math.max(0, Math.floor(width));
    this.height = Math.max(0, Math.floor(height));
    if (!this.width || !this.height) {
      this.pause();
      return;
    }
    try {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, sceneConfig.pixelRatio[this.quality]));
      this.renderer.setSize(this.width, this.height, false);
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.schedule();
    } catch {
      this.fail('Não foi possível redimensionar o 3D. A interface continua disponível.');
    }
  }

  private schedule(): void {
    if (this.disposed || this.contextLost || document.hidden || !this.width || !this.height || this.frame !== null) return;
    this.frame = requestAnimationFrame(this.tick);
  }

  private readonly tick = (time: number): void => {
    this.frame = null;
    if (this.disposed || this.contextLost || document.hidden || !this.width || !this.height) {
      this.pause();
      return;
    }
    const delta = this.previousTime === null ? 0
      : Math.min(sceneConfig.maxDeltaSeconds, Math.max(0, (time - this.previousTime) / 1000));
    this.previousTime = time;
    try {
      for (const update of this.updaters) {
        update(delta);
        if (this.disposed) return;
      }
      this.renderer?.render(this.scene, this.camera);
      this.schedule();
    } catch {
      this.fail('O 3D foi interrompido por uma falha gráfica. A interface continua disponível.');
    }
  };

  private pause(): void {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
    this.previousTime = null;
  }

  private fail(message: string): void {
    this.dispose();
    this.state = { available: false, message };
    this.onAvailability(this.state);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.pause();
    this.observer?.disconnect();
    this.observer = null;
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.updaters.clear();
    this.reference?.geometry.dispose();
    this.reference?.material.dispose();
    this.reference = null;
    this.scene.clear();
    if (this.renderer) {
      const canvas = this.renderer.domElement;
      canvas.removeEventListener('webglcontextlost', this.onContextLost);
      canvas.removeEventListener('webglcontextrestored', this.onContextRestored);
      this.renderer.dispose();
      // Libera também o contexto na desmontagem, antes de criar outro renderer.
      this.renderer.forceContextLoss();
      canvas.remove();
      this.renderer = null;
    }
    if (owners.get(this.container) === this) owners.delete(this.container);
    this.state = { available: false, message: 'Cena descartada.' };
  }
}
