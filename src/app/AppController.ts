import { SceneController } from '../scene/SceneController';
import type { SceneAvailability } from '../scene/SceneController';

/** Coordena a disponibilidade da cena sem acoplar sua inicialização à interface. */
export class AppController {
  private readonly scene: SceneController;
  private readonly motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  private disposed = false;
  private disposeInspector: (() => void) | null = null;
  private graphics: SceneAvailability = { available: false, message: 'Inicializando 3D…' };
  private assetStatus = 'Carregando personagem…';
  private assetError = '';

  constructor(container: HTMLElement, status: HTMLElement, fallback: HTMLElement) {
    const present = (): void => {
      const message = this.graphics.available ? this.assetError : this.graphics.message;
      status.textContent = this.graphics.available ? this.assetStatus : '3D indisponível';
      fallback.hidden = !message;
      fallback.textContent = message;
    };
    this.scene = new SceneController(container, (state: SceneAvailability) => {
      this.graphics = state;
      present();
    });
    this.scene.setReducedMotion(this.motionPreference.matches);
    this.motionPreference.addEventListener('change', this.onMotionChange);
    if (this.scene.availability.available) {
      void this.scene.loadCharacter().then(async report => {
        if (this.disposed) return;
        this.assetStatus = 'Vita · Modelo carregado';
        present();
        if (import.meta.env.DEV) {
          const { mountCharacterInspector } = await import('../dev/CharacterInspector');
          if (!this.disposed) this.disposeInspector = mountCharacterInspector(container.parentElement ?? container, this.scene, report);
        }
      }).catch((error: unknown) => {
        if (this.disposed) return;
        this.assetStatus = 'Personagem indisponível';
        this.assetError = error instanceof Error ? error.message : 'Não foi possível carregar a personagem.';
        present();
      });
    }
  }

  private readonly onMotionChange = (event: MediaQueryListEvent): void => {
    this.scene.setReducedMotion(event.matches);
  };

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.disposeInspector?.();
    this.motionPreference.removeEventListener('change', this.onMotionChange);
    this.scene.dispose();
  }
}
