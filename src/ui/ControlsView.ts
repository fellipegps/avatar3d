import type { QualityProfile } from '../app/contracts';

export interface ControlsViewEvents {
  onToggle(open: boolean): void;
  onQuality(profile: QualityProfile): void;
  onReducedMotion(enabled: boolean): void;
}

/** Preferências emitidas para a coordenação; nunca importa Three.js. */
export class ControlsView {
  private readonly listeners = new AbortController();
  private readonly toggle: HTMLButtonElement;
  private readonly quality: HTMLSelectElement;
  private readonly motion: HTMLInputElement;
  private readonly notice: HTMLElement;
  private open = true;
  private disposed = false;

  constructor(private readonly container: HTMLElement, panelId: string, events: ControlsViewEvents, reducedMotion = false) {
    container.classList.add('experience-controls');
    container.innerHTML = `<button type="button" class="button-quiet" data-toggle>Fechar conversa</button>
      <label>Qualidade visual <select name="quality"><option value="normal">Normal</option><option value="economy">Econômica</option></select></label>
      <label class="motion-control"><input type="checkbox" name="motion" /> Reduzir movimento</label>
      <p class="controls-notice">Preferências em preparação.</p>`;
    this.toggle = container.querySelector('[data-toggle]')!; this.quality = container.querySelector('select')!;
    this.motion = container.querySelector('input')!; this.notice = container.querySelector('.controls-notice')!;
    this.toggle.setAttribute('aria-controls', panelId); this.toggle.setAttribute('aria-expanded', 'true');
    this.motion.checked = reducedMotion;
    const options = { signal: this.listeners.signal };
    this.toggle.addEventListener('click', () => events.onToggle(!this.open), options);
    this.quality.addEventListener('change', () => events.onQuality(this.quality.value as QualityProfile), options);
    this.motion.addEventListener('change', () => events.onReducedMotion(this.motion.checked), options);
    this.setEnabled(false);
  }

  setEnabled(enabled: boolean, notice = enabled ? '' : 'Preferências em preparação.'): void {
    if (this.disposed) return;
    this.quality.disabled = !enabled; this.motion.disabled = !enabled; this.notice.textContent = notice;
  }
  setOpen(open: boolean): void {
    if (this.disposed) return;
    this.open = open; this.toggle.textContent = open ? 'Fechar conversa' : 'Abrir conversa';
    this.toggle.setAttribute('aria-expanded', String(open));
  }
  setReducedMotion(enabled: boolean): void { if (!this.disposed) this.motion.checked = enabled; }
  setQuality(profile: QualityProfile): void { if (!this.disposed) this.quality.value = profile; }
  focusToggle(): void { if (!this.disposed) this.toggle.focus({ preventScroll: true }); }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true; this.listeners.abort(); this.container.replaceChildren();
  }
}
