import { SceneController } from '../scene/SceneController';
import type { SceneAvailability } from '../scene/SceneController';
import type { AssetReport } from '../scene/AssetLoader';
import type { ChatProvider, ConversationSnapshot, QualityProfile, ScenePort } from './contracts';
import { ConversationStore } from './ConversationStore';
import { MockChatProvider } from '../chat/MockChatProvider';
import { ChatView } from '../ui/ChatView';
import type { PresentationOptions } from '../ui/ChatView';
import { ControlsView } from '../ui/ControlsView';

export interface AppScene extends ScenePort {
  readonly availability: SceneAvailability;
  loadCharacter(): Promise<AssetReport>;
}
export interface AppOptions {
  ui?: { panel: HTMLElement; toolbar: HTMLElement; layout: HTMLElement };
  provider?: ChatProvider;
  store?: ConversationStore;
  createScene?: (container: HTMLElement, onAvailability: (state: SceneAvailability) => void) => AppScene;
  presentation?: PresentationOptions;
  inspector?: boolean;
}

/** Coordena domínio, UI e cena por eventos, sem depender do loop de renderização. */
export class AppController {
  private scene: AppScene | null = null;
  private readonly store: ConversationStore;
  private readonly provider: ChatProvider;
  private readonly chat: ChatView | null;
  private readonly controls: ControlsView | null;
  private readonly unsubscribe: () => void;
  private readonly motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  private manualMotion = false;
  private disposed = false;
  private active: { id: number; controller: AbortController } | null = null;
  private disposeInspector: (() => void) | null = null;
  private graphics: SceneAvailability = { available: false, message: 'Inicializando 3D…' };
  private assetStatus = 'Carregando personagem…';
  private assetError = '';

  constructor(container: HTMLElement, private readonly status: HTMLElement, private readonly fallback: HTMLElement,
    private readonly options: AppOptions = {}) {
    this.store = options.store ?? new ConversationStore();
    this.provider = options.provider ?? new MockChatProvider();
    this.chat = options.ui ? new ChatView(options.ui.panel, {
      onSubmit: text => { void this.submit(text); }, onReset: () => this.reset(), onClose: () => this.setPanelOpen(false),
    }, options.presentation) : null;
    this.controls = options.ui ? new ControlsView(options.ui.toolbar, options.ui.panel.id, {
      onToggle: open => this.setPanelOpen(open), onQuality: profile => this.setQuality(profile),
      onReducedMotion: enabled => { this.manualMotion = true; this.setReducedMotion(enabled); },
    }, this.motionPreference.matches) : null;
    this.chat?.setAvailable(true); this.controls?.setEnabled(true, 'Respostas locais · DEMO');
    try {
      this.scene = (options.createScene ?? ((element, callback) => new SceneController(element, callback)))(container, state => {
        if (this.disposed) return;
        this.graphics = state; this.presentAvailability();
      });
      this.graphics = this.scene.availability; this.presentAvailability();
    } catch {
      this.graphics = { available: false, message: 'Não foi possível iniciar o 3D. A conversa continua disponível.' };
      this.presentAvailability();
    }
    this.setReducedMotion(this.motionPreference.matches);
    this.motionPreference.addEventListener('change', this.onMotionChange);
    this.unsubscribe = this.store.subscribe(state => this.presentState(state));
    const scene = this.scene;
    if (scene?.availability.available) {
      void Promise.resolve().then(() => { if (!this.disposed) return scene.loadCharacter(); }).then(async report => {
        if (this.disposed || !report) return;
        this.assetStatus = 'Vita · Modelo carregado'; this.presentAvailability();
        if (import.meta.env.DEV && options.inspector !== false && scene instanceof SceneController) {
          const { mountCharacterInspector } = await import('../dev/CharacterInspector');
          if (!this.disposed) this.disposeInspector = mountCharacterInspector(container.parentElement ?? container, scene, report);
        }
      }).catch((error: unknown) => {
        if (this.disposed) return;
        this.assetStatus = 'Personagem indisponível';
        this.assetError = error instanceof Error ? error.message : 'Não foi possível carregar a personagem.';
        this.presentAvailability();
      });
    }
  }

  getSnapshot(): ConversationSnapshot { return this.store.getSnapshot(); }

  private presentAvailability(): void {
    const message = this.graphics.available ? this.assetError : this.graphics.message;
    this.status.textContent = this.graphics.available ? this.assetStatus : '3D indisponível';
    this.fallback.hidden = !message; this.fallback.textContent = message;
  }
  private commandScene(command: (scene: AppScene) => void): void {
    if (!this.scene) return;
    try { command(this.scene); }
    catch {
      try { this.scene.dispose(); } catch { /* A falha de descarte do 3D não bloqueia a conversa. */ }
      this.scene = null;
      this.graphics = { available: false, message: 'O 3D ficou indisponível. A conversa continua disponível.' };
      this.presentAvailability();
    }
  }
  private presentState(state: ConversationSnapshot): void {
    if (this.disposed) return;
    // revealing é renderizado exclusivamente por presentMessages, sem flash do texto completo.
    if (state.phase !== 'revealing') this.chat?.renderMessages(state.messages);
    this.chat?.setState(state.phase, state.error);
    this.commandScene(scene => {
      scene.setCharacterState(state.phase === 'waiting' ? 'thinking' : state.phase === 'revealing' ? 'responding' : 'idle');
      if (state.phase === 'idle' || state.phase === 'error') scene.resetFace();
    });
  }
  private isCurrent(request: NonNullable<AppController['active']>): boolean {
    return !this.disposed && this.active === request && !request.controller.signal.aborted
      && this.store.getSnapshot().activeRequestId === request.id;
  }
  async submit(text: string): Promise<void> {
    if (this.disposed) return;
    const id = this.store.begin(text);
    if (id === null || this.store.getSnapshot().activeRequestId !== id) return;
    const request = { id, controller: new AbortController() }; this.active = request;
    this.chat?.setDraft('');
    try {
      const reply = await this.provider.reply(text, request.controller.signal);
      if (!this.isCurrent(request)) return;
      if (!this.store.receive(id, reply)) throw new Error('Resposta inválida.');
      if (!this.isCurrent(request)) return;
      await this.chat?.presentMessages(this.store.getSnapshot().messages, reply.id, request.controller.signal);
      if (this.isCurrent(request)) this.store.complete(id);
    } catch (error) {
      if (!this.isCurrent(request)) return;
      if (error instanceof Error && error.name === 'AbortError') this.store.cancel(id);
      else this.store.fail(id, 'Não foi possível responder. Tente novamente ou reinicie a conversa.');
    } finally {
      // Uma Promise antiga nunca encerra o trabalho iniciado depois de um reset.
      if (this.active === request) this.active = null;
    }
  }
  reset(): void {
    if (this.disposed) return;
    const previous = this.active; this.active = null;
    previous?.controller.abort(); this.chat?.cancelPresentation(); this.store.reset();
    this.chat?.setDraft(''); this.chat?.focusInput();
  }
  setPanelOpen(open: boolean): void {
    if (this.disposed) return;
    this.chat?.setOpen(open); this.controls?.setOpen(open);
    this.options.ui?.layout.classList.toggle('chat-is-closed', !open);
    if (!open) this.controls?.focusToggle();
  }
  setQuality(profile: QualityProfile): void {
    if (this.disposed) return;
    this.controls?.setQuality(profile); this.commandScene(scene => scene.setQuality(profile));
  }
  setReducedMotion(enabled: boolean): void {
    if (this.disposed) return;
    this.controls?.setReducedMotion(enabled); this.commandScene(scene => scene.setReducedMotion(enabled));
    this.chat?.setReducedMotion(enabled);
  }
  private readonly onMotionChange = (event: MediaQueryListEvent): void => {
    if (!this.manualMotion) this.setReducedMotion(event.matches);
  };
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    const previous = this.active; this.active = null; previous?.controller.abort();
    this.unsubscribe(); this.chat?.dispose(); this.controls?.dispose(); this.store.dispose();
    this.disposeInspector?.(); this.motionPreference.removeEventListener('change', this.onMotionChange);
    this.scene?.dispose(); this.scene = null;
  }
}
