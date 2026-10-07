import type { CharacterState, ScenePort } from '../app/contracts';
import type { AssetReport } from '../scene/AssetLoader';

interface InspectionPort extends ScenePort {
  setBlink(value: number): void;
  setCharacterView(view: 'full' | 'face'): void;
}

/** DOM-only tools, imported exclusively in development. */
export function mountCharacterInspector(parent: HTMLElement, scene: InspectionPort, report: AssetReport): () => void {
  const panel = document.createElement('section');
  panel.className = 'character-inspector';
  panel.setAttribute('aria-label', 'Inspeção da personagem em desenvolvimento');
  panel.innerHTML = `
    <h3>Inspeção da personagem <small>Somente desenvolvimento</small></h3>
    <div class="inspection-fields">
      <label>Estado corporal <select name="state"><option value="idle">Repouso</option><option value="thinking">Pensando</option><option value="responding">Respondendo</option></select></label>
      <label>Enquadramento <select name="view"><option value="full">Corpo inteiro</option><option value="face">Rosto</option></select></label>
      <label>Fechar os olhos <input name="blink" type="range" min="0" max="1" step="0.01" value="0" /></label>
      <label>Abrir a boca <input name="mouth" type="range" min="0" max="1" step="0.01" value="0" /></label>
      <label><input name="pause" type="checkbox" /> Pausar corpo para inspeção</label>
      <button type="button">Restaurar pose e rosto</button>
    </div>
    <details><summary>Inventário do modelo</summary><pre></pre></details>`;
  const pre = panel.querySelector('pre');
  if (pre) pre.textContent = JSON.stringify(report, null, 2);
  const listeners = new AbortController();
  panel.addEventListener('input', event => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement || input instanceof HTMLSelectElement)) return;
    if (input.name === 'state') scene.setCharacterState(input.value as CharacterState);
    if (input.name === 'view') scene.setCharacterView(input.value as 'full' | 'face');
    if (input.name === 'blink') scene.setBlink(Number(input.value));
    if (input.name === 'mouth') scene.setMouthOpen(Number(input.value));
    if (input.name === 'pause' && input instanceof HTMLInputElement) {
      scene.setReducedMotion(input.checked || window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  }, { signal: listeners.signal });
  panel.querySelector('button')?.addEventListener('click', () => {
    for (const input of panel.querySelectorAll<HTMLInputElement>('input[type="range"]')) input.value = '0';
    const state = panel.querySelector<HTMLSelectElement>('[name="state"]');
    if (state) state.value = 'idle';
    scene.setCharacterState('idle'); scene.setBlink(0); scene.setMouthOpen(0);
  }, { signal: listeners.signal });
  parent.append(panel);
  return () => { listeners.abort(); panel.remove(); };
}
