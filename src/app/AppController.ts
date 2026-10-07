import { SceneController } from '../scene/SceneController';
import type { SceneAvailability } from '../scene/SceneController';

/** Coordena a disponibilidade da cena sem acoplar sua inicialização à interface. */
export class AppController {
  private readonly scene: SceneController;
  private readonly motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  private disposed = false;

  constructor(container: HTMLElement, status: HTMLElement, fallback: HTMLElement) {
    this.scene = new SceneController(container, (state: SceneAvailability) => {
      status.textContent = state.available ? 'Cena de referência' : '3D indisponível';
      fallback.hidden = state.available;
      fallback.textContent = state.available ? '' : state.message;
    });
    this.scene.setReducedMotion(this.motionPreference.matches);
    this.motionPreference.addEventListener('change', this.onMotionChange);
  }

  private readonly onMotionChange = (event: MediaQueryListEvent): void => {
    this.scene.setReducedMotion(event.matches);
  };

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.motionPreference.removeEventListener('change', this.onMotionChange);
    this.scene.dispose();
  }
}
