import '../src/styles/base.css';
import '../src/styles/layout.css';
import '../src/styles/chat.css';
import { Vector3 } from 'three';
import type { ChatMessage } from '../src/app/contracts';
import { ChatView } from '../src/ui/ChatView';
import { AppController } from '../src/app/AppController';
import type { AppScene } from '../src/app/AppController';
import { SceneController } from '../src/scene/SceneController';
import { ConversationStore } from '../src/app/ConversationStore';

if (!import.meta.env.DEV) throw new Error('Verificação exclusiva do desenvolvimento.');
const el = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id)! as T;
const results: { name: string; passed: boolean; details: unknown }[] = [];
function check(name: string, passed: boolean, details: unknown = null): void { results.push({ name, passed, details }); }
const flush = async (): Promise<void> => { for (let i = 0; i < 6; i++) await Promise.resolve(); };
const frames = (count = 2): Promise<void> => new Promise(resolve => {
  const next = (): void => { if (--count <= 0) resolve(); else requestAnimationFrame(next); };
  requestAnimationFrame(next);
});

async function checkAnnouncementsAndScroll(): Promise<void> {
  const panel = document.createElement('aside'); panel.className = 'interface-panel'; panel.style.width = '340px'; panel.style.maxWidth = '100%';
  el('test-host').append(panel);
  let now = 0, task: (() => void) | null = null;
  const view = new ChatView(panel, { onSubmit() {}, onReset() {}, onClose() {} }, {
    now: () => now, schedule: callback => { task = callback; return () => { task = null; }; },
  });
  const find = <T extends HTMLElement>(selector: string): T => panel.querySelector<T>(selector)!;
  const announcement = find('.chat-announcement'), spoken: string[] = [];
  const observer = new MutationObserver(() => { if (announcement.textContent) spoken.push(announcement.textContent); });
  observer.observe(announcement, { childList: true });
  const advance = async (ms: number): Promise<void> => { now += ms; const callback = task; task = null; callback?.(); await flush(); };
  const reply: ChatMessage = { id: 'a', role: 'assistant', text: 'Resposta completa, com acentuação e emoji 😀.' };
  try {
    view.setAvailable(true);
    check('Histórico navegável, sem live por letra; região completa polite e atômica', find('.chat-history').tabIndex === 0
      && find('.chat-messages').getAttribute('aria-live') === 'off' && announcement.getAttribute('aria-live') === 'polite'
      && announcement.getAttribute('aria-atomic') === 'true');
    const presenting = view.presentMessages([reply], reply.id, new AbortController().signal);
    await advance(100);
    check('Texto parcial não publica anúncio acessível', spoken.length === 0 && find('.chat-text').textContent!.length > 0
      && find('.chat-text').textContent !== reply.text);
    await advance(5000); await presenting;
    check('Resposta completa publicada uma única vez', spoken.length === 1 && spoken[0] === `Vita: ${reply.text}`);
    view.setReducedMotion(true); view.renderMessages([reply]);
    await view.presentMessages([reply], reply.id, new AbortController().signal); await flush();
    check('Render repetido e conclusão duplicada não repetem anúncio', spoken.length === 1);
    const instant = { ...reply, id: 'b' };
    await view.presentMessages([reply, instant], instant.id, new AbortController().signal); await flush();
    check('Respostas iguais com IDs diferentes são anunciadas uma vez cada', spoken.length === 2 && task === null);
    view.setReducedMotion(false);
    const signal = new AbortController(), cancelled = { ...reply, id: 'cancel' };
    const aborted = view.presentMessages([cancelled], cancelled.id, signal.signal).catch(error => error.name);
    await advance(100); signal.abort();
    check('Abort durante texto não anuncia resposta cancelada', await aborted === 'AbortError' && spoken.length === 2 && task === null);
    view.setOpen(false);
    check('Fechar esvazia região para não reexpor anúncio antigo ao abrir', announcement.textContent === '');
    view.setReducedMotion(true);
    const closed = { ...reply, id: 'closed', text: 'Resposta terminada com o painel fechado.' };
    await view.presentMessages([closed], closed.id, new AbortController().signal); await flush();
    check('Painel fechado adia anúncio até ficar acessível', spoken.length === 2);
    view.setOpen(true); await flush();
    check('Reabrir anuncia resposta pendente uma vez e foca campo', spoken.length === 3 && spoken[2] === `Vita: ${closed.text}`
      && document.activeElement === find('textarea'));
    view.setOpen(false); view.setOpen(true); await flush();
    check('Reabrir novamente não repete resposta', spoken.length === 3);
    view.renderMessages([]); await flush();
    check('Reinício limpa anúncio e resposta pendente', announcement.textContent === '');
    const messages: ChatMessage[] = Array.from({ length: 20 }, (_, i) => ({ id: `long-${i}`, role: i % 2 ? 'assistant' : 'user', text: `${i}: ${'Conteúdo longo '.repeat(25)}${'x'.repeat(500)}` }));
    view.renderMessages(messages);
    const history = find('.chat-history'); history.scrollTop = 30; history.dispatchEvent(new Event('scroll'));
    const previous = history.scrollTop;
    view.renderMessages([...messages, reply]);
    check('Atualização longa preserva leitura anterior e oferece acesso ao fim', Math.abs(history.scrollTop - previous) < 1
      && !find<HTMLButtonElement>('.chat-latest').hidden && history.scrollWidth <= history.clientWidth + 1);
    find<HTMLButtonElement>('.chat-latest').click();
    check('Acesso ao fim mostra última mensagem e mantém foco no histórico', Math.abs(history.scrollHeight - history.clientHeight - history.scrollTop) < 2
      && find<HTMLButtonElement>('.chat-latest').hidden && document.activeElement === history);
    check('Botões principais têm área de pelo menos 44 px', [...panel.querySelectorAll<HTMLButtonElement>('.chat-actions button, [data-close]')]
      .every(button => button.getBoundingClientRect().height >= 44));
  } finally { observer.disconnect(); view.dispose(); panel.remove(); }
}

async function checkMotionPreference(): Promise<void> {
  const nativeMatch = window.matchMedia;
  const preference = new EventTarget(); let matches = true;
  Object.defineProperty(preference, 'matches', { get: () => matches });
  window.matchMedia = query => query === '(prefers-reduced-motion: reduce)' ? preference as MediaQueryList : nativeMatch.call(window, query);
  const fixture = document.createElement('div'); fixture.innerHTML = '<nav></nav><main><div data-scene></div><span></span><p></p><aside></aside></main>';
  el('test-host').append(fixture);
  const find = <T extends HTMLElement>(selector: string): T => fixture.querySelector<T>(selector)!;
  const motion: boolean[] = [];
  const fakeScene: AppScene = { availability: { available: false, message: 'Cena controlada' },
    loadCharacter: () => Promise.reject(new Error('Não carregar nesta verificação')),
    setReducedMotion: enabled => { motion.push(enabled); }, setQuality() {}, setCharacterState() {}, setMouthOpen() {}, resetFace() {}, dispose() {},
  };
  const app = new AppController(find('[data-scene]'), find('span'), find('p'), {
    ui: { panel: find('aside'), toolbar: find('nav'), layout: find('main') }, createScene: () => fakeScene,
    provider: { reply: async () => ({ id: 'preference', text: 'Texto imediato pela preferência do sistema.' }) },
  });
  try {
    await app.submit('Olá');
    check('Preferência inicial do sistema reduz movimento e apresenta texto imediatamente', motion[0] === true
      && find<HTMLInputElement>('input[type=checkbox]').checked && app.getSnapshot().phase === 'idle');
    matches = false; preference.dispatchEvent(new MediaQueryListEvent('change', { matches }));
    check('Mudança do sistema atualiza controles e cena antes de escolha manual', motion.at(-1) === false && !find<HTMLInputElement>('input').checked);
    const checkbox = find<HTMLInputElement>('input'); checkbox.checked = true; checkbox.dispatchEvent(new Event('change'));
    preference.dispatchEvent(new MediaQueryListEvent('change', { matches: false }));
    check('Preferência manual prevalece sobre alteração posterior do sistema', motion.at(-1) === true && checkbox.checked);
    app.dispose(); const count = motion.length; preference.dispatchEvent(new MediaQueryListEvent('change', { matches: true }));
    check('Descarte remove listener da preferência', motion.length === count);
  } finally { app.dispose(); fixture.remove(); window.matchMedia = nativeMatch; }
}

async function checkFraming(): Promise<void> {
  const fixture = document.createElement('div'); el('test-host').append(fixture);
  const scene = new SceneController(fixture);
  try {
    await scene.loadCharacter();
    const canvas = fixture.querySelector('canvas'), camera = scene.camera;
    for (const [width, height] of [[326, 300], [356, 337], [734, 340], [956, 440]]) {
      fixture.style.width = `${width}px`; fixture.style.maxWidth = 'none'; fixture.style.height = `${height}px`; await frames();
      const samples: object[] = []; let visible = true;
      for (const state of ['idle', 'thinking', 'responding'] as const) {
        scene.setCharacterState(state); await frames(30); scene.scene.updateMatrixWorld(true);
        const projected = ['J_Bip_C_Head', 'J_Bip_L_Hand', 'J_Bip_R_Hand'].map(name => {
          const bone = scene.scene.getObjectByName(name); if (!bone) throw new Error(`Osso ausente: ${name}`);
          const p = bone.getWorldPosition(new Vector3()).project(camera);
          visible &&= Math.abs(p.x) < 0.92 && Math.abs(p.y) < 0.92 && p.z > -1 && p.z < 1;
          return { name, ndc: p.toArray() };
        });
        samples.push({ state, projected });
      }
      check(`${width}×${height}: cabeça/mãos dentro do quadro nos três estados`, visible, samples);
      check(`${width}×${height}: resize conserva canvas/câmera e aspecto correto`, fixture.querySelector('canvas') === canvas
        && scene.camera === camera && Math.abs(camera.aspect - width! / height!) < 0.01);
    }
    scene.setReducedMotion(true); scene.setCharacterState('responding');
    const before = scene.getAnimationStatus(), position = camera.position.toArray(); await frames(8);
    check('Movimento reduzido congela clipes e não anima câmera', scene.getAnimationStatus()!.reducedMotion
      && scene.getAnimationStatus()!.actions.every((action, i) => action.time === before!.actions[i]!.time)
      && camera.position.toArray().every((v, i) => v === position[i]));
    check('Canvas tem descrição textual e não recebe foco essencial do chat', !!canvas?.getAttribute('aria-label') && canvas.tabIndex === -1);
  } finally { scene.dispose(); fixture.remove(); }
}

function mountLive(): void {
  const store = new ConversationStore(); let scene: SceneController;
  const app = new AppController(el('live-scene'), el('live-status'), el('live-fallback'), {
    ui: { panel: el('live-panel'), toolbar: el('live-controls'), layout: el('live-layout') }, store, inspector: false,
    createScene: (container, callback) => { scene = new SceneController(container, callback); return scene; },
  });
  el('long-history').addEventListener('click', () => {
    app.reset();
    for (let i = 0; i < 12; i++) {
      const id = store.begin(`Mensagem longa ${i + 1}: ${'conteúdo '.repeat(30)}${'x'.repeat(700)}`)!;
      store.receive(id, { id: `history-${i}`, text: `Resposta ${i + 1}: ${'texto de histórico '.repeat(30)}` }); store.complete(id);
    }
  });
  // Inspeção por eventos, fora do loop da cena, para registrar resize/orientação reais.
  const inspect = (): void => {
    const head = scene.scene.getObjectByName('J_Bip_C_Head');
    const ndc = head?.getWorldPosition(new Vector3()).project(scene.camera).toArray();
    el('inspection').textContent = JSON.stringify({ viewport: [innerWidth, innerHeight], canvases: el('live-scene').querySelectorAll('canvas').length,
      scene: scene.getRenderStats(), headNdc: ndc, animation: scene.getAnimationStatus(), messages: store.getSnapshot().messages.length }, null, 2);
  };
  const resize = new ResizeObserver(() => { requestAnimationFrame(inspect); }); resize.observe(el('live-scene'));
  el('live-controls').addEventListener('change', inspect);
  el('live-panel').addEventListener('focusin', inspect);
  window.addEventListener('pagehide', () => { resize.disconnect(); app.dispose(); }, { once: true });
}

async function run(): Promise<void> {
  try { await checkAnnouncementsAndScroll(); await checkMotionPreference(); await checkFraming(); }
  catch (error) { check('Execução sem exceção inesperada', false, String(error)); }
  el('results').textContent = JSON.stringify(results, null, 2);
  el('summary').textContent = `${results.filter(item => item.passed).length}/${results.length} verificações passaram.`;
  mountLive();
}
void run();
