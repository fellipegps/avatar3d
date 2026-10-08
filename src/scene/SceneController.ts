import {
  ACESFilmicToneMapping, Color, DirectionalLight, HemisphereLight, PerspectiveCamera, PointLight, Scene, SRGBColorSpace, Vector3, WebGLRenderer,
} from 'three';
import type { CharacterState, QualityProfile, ScenePort } from '../app/contracts';
import { environmentConfig, sceneConfig, visualConfig } from './scene.config';
import { loadCharacter } from './AssetLoader';
import type { AssetReport } from './AssetLoader';
import { characterManifest } from './character.manifest';
import { CharacterPreview } from './CharacterPreview';
import { Environment } from './Environment';

export type SceneView = 'room' | 'side' | 'full' | 'face';

export type SceneAvailability =
  | { available: true }
  | { available: false; message: string };

export type SceneUpdater = (deltaSeconds: number) => void;

const owners = new WeakMap<HTMLElement, SceneController>();

/** Um renderer/loop compartilhado para personagem, sala e objetos. */
export class SceneController implements ScenePort {
  readonly scene = new Scene();
  readonly camera = new PerspectiveCamera(
    sceneConfig.camera.fov, 1, sceneConfig.camera.near, sceneConfig.camera.far,
  );
  private readonly container: HTMLElement;
  private readonly onAvailability: (state: SceneAvailability) => void;
  private readonly updaters = new Set<SceneUpdater>();
  private renderer: WebGLRenderer | null = null;
  private observer: ResizeObserver | null = null;
  private environment: Environment | null = null;
  private frame: number | null = null;
  private previousTime: number | null = null;
  private width = 0;
  private height = 0;
  private quality: QualityProfile = 'normal';
  private reducedMotion = false;
  private disposed = false;
  private contextLost = false;
  private character: CharacterPreview | null = null;
  private assetRequest: AbortController | null = null;
  private characterView: SceneView = 'room';
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
      this.renderer.outputColorSpace = SRGBColorSpace;
      this.renderer.toneMapping = ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = visualConfig.lighting.exposure;
      const canvas = this.renderer.domElement;
      canvas.className = 'scene-canvas';
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', 'Escritório 3D: carregando personagem Vita');
      canvas.addEventListener('webglcontextlost', this.onContextLost);
      canvas.addEventListener('webglcontextrestored', this.onContextRestored);
      this.container.append(canvas);

      this.environment = new Environment();
      this.scene.add(this.environment.root);
      const lighting = visualConfig.lighting;
      const light = new HemisphereLight(lighting.sky, lighting.ground, lighting.ambientIntensity);
      light.name = 'ambient-light';
      this.scene.add(light);
      for (const [name, spec] of [['face-light', lighting.key], ['rim-light', lighting.rim]] as const) {
        const directional = new DirectionalLight(spec.color, spec.intensity);
        directional.name = name; directional.position.fromArray(spec.position);
        directional.target.position.fromArray(spec.target);
        this.scene.add(directional, directional.target);
      }
      // Emissivo é aparência; esta luz explícita da luminária ilumina o tampo ao redor.
      const lamp = new PointLight(lighting.lamp.color, lighting.lamp.intensity, lighting.lamp.distance, 2);
      lamp.name = 'desk-lamp-light';
      const lampConfig = environmentConfig.lamp;
      lamp.position.set(lampConfig.position[0], lampConfig.position[1] + lampConfig.height - 0.16, lampConfig.position[2]);
      this.scene.add(lamp);

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

  /** Snapshot para inspeção: não expõe o renderer nem acrescenta trabalho ao loop. */
  getRenderStats() {
    if (!this.renderer) return null;
    const { render, memory, programs } = this.renderer.info;
    return {
      calls: render.calls, triangles: render.triangles, geometries: memory.geometries,
      textures: memory.textures, programs: programs?.length ?? 0,
      width: this.width, height: this.height, pixelRatio: this.renderer.getPixelRatio(),
      shadowMap: this.renderer.shadowMap.enabled,
    };
  }

  registerUpdater(update: SceneUpdater): () => void {
    if (this.disposed) throw new Error('Não é possível registrar atualizações em uma cena descartada.');
    this.updaters.add(update);
    return () => { this.updaters.delete(update); };
  }

  async loadCharacter(): Promise<AssetReport> {
    if (this.disposed) throw new Error('A cena não está disponível para carregar a personagem.');
    this.assetRequest?.abort();
    const request = new AbortController();
    this.assetRequest = request;
    this.character?.dispose();
    this.character = null;
    this.renderer?.domElement.setAttribute('aria-label', 'Área 3D: carregando personagem Vita');
    const asset = await loadCharacter(characterManifest, request.signal);
    if (this.disposed || request.signal.aborted) {
      asset.dispose();
      throw new DOMException('Carregamento cancelado.', 'AbortError');
    }
    try {
      this.character = new CharacterPreview(asset, characterManifest);
      this.character.setReducedMotion(this.reducedMotion);
      this.scene.add(asset.gltf.scene);
      this.setCharacterView('room');
      this.renderer?.domElement.setAttribute('aria-label', 'Vita atrás da mesa no escritório 3D, com monitores, luminária, planta e caneca');
      return asset.report;
    } catch (error) {
      asset.dispose();
      throw error;
    }
  }

  setCharacterState(state: CharacterState): void { this.character?.setState(state); }
  setMouthOpen(value: number): void { this.character?.setMouthOpen(value); }
  setBlink(value: number): void { this.character?.setBlink(value); }

  setCharacterView(view: SceneView): void {
    this.characterView = view;
    if (this.environment) this.environment.root.visible = view === 'room' || view === 'side';
    if (view === 'room' || view === 'side') {
      const config = sceneConfig.composition;
      const distance = Math.max(config.halfHeight, config.halfWidth / this.camera.aspect)
        / Math.tan(this.camera.fov * Math.PI / 360);
      const target = new Vector3(...config.target);
      const direction = view === 'side' ? config.sideDirection : config.frontDirection;
      this.camera.position.copy(new Vector3(...direction).normalize().multiplyScalar(distance).add(target));
      this.camera.lookAt(target);
      this.camera.updateMatrixWorld(true);
      return;
    }
    // Keep the full character visible on narrow containers; face view is for development inspection.
    const halfHeight = view === 'face' ? 0.21 : 0.98;
    const halfWidth = view === 'face' ? 0.20 : 0.46;
    const distance = Math.max(halfHeight, halfWidth / this.camera.aspect) / Math.tan(this.camera.fov * Math.PI / 360);
    const targetY = view === 'face' ? 1.54 : 0.86;
    this.camera.position.set(0, targetY, distance + 0.18);
    this.camera.lookAt(0, targetY, 0);
    this.camera.updateMatrixWorld(true);
  }

  setReducedMotion(enabled: boolean): void {
    this.reducedMotion = enabled;
    this.character?.setReducedMotion(enabled);
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
      if (this.characterView) this.setCharacterView(this.characterView);
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
      this.character?.update(delta);
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
    this.assetRequest?.abort();
    this.assetRequest = null;
    this.character?.dispose();
    this.character = null;
    this.pause();
    this.observer?.disconnect();
    this.observer = null;
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.updaters.clear();
    this.environment?.dispose();
    this.environment = null;
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
