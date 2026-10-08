import './styles/base.css';
import './styles/layout.css';
import './styles/chat.css';
import { AppController } from './app/AppController';
import { ChatView } from './ui/ChatView';
import { ControlsView } from './ui/ControlsView';
import type { mountChatDemo } from './dev/ChatDemo';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Contêiner #app não encontrado.');
}

app.innerHTML = `
  <header class="app-header">
    <div>
      <p class="eyebrow">MVP · Fase 08</p>
      <h1>Avatar 3D</h1>
    </div>
    <span class="stage-badge">Cena WebGL 2</span>
  </header>
  <nav id="controls-container" aria-label="Controles da experiência"></nav>
  <main class="app-layout">
    <section class="scene-panel" aria-labelledby="scene-title">
      <header class="panel-header">
        <h2 id="scene-title">Espaço 3D</h2>
        <span id="scene-status" class="panel-meta" role="status">Inicializando 3D…</span>
      </header>
      <div id="scene-container" class="scene-container">
        <p id="scene-fallback" class="scene-placeholder" role="alert" hidden></p>
      </div>
      <p class="scene-caption">Vita · Personagem por pixiv / VRoid Project (CC0) · Painéis decorativos DEMO</p>
    </section>
    <aside id="interface-container" class="interface-panel"></aside>
  </main>
  <footer class="app-footer">Protótipo local · Estrutura inicial</footer>
`;

const container = app.querySelector<HTMLElement>('#scene-container');
const status = app.querySelector<HTMLElement>('#scene-status');
const fallback = app.querySelector<HTMLElement>('#scene-fallback');
if (!container || !status || !fallback) throw new Error('Estrutura da cena incompleta.');

const controller = new AppController(container, status, fallback);
let disposed = false;
let demo: ReturnType<typeof mountChatDemo> | null = null;
const panel = app.querySelector<HTMLElement>('#interface-container')!;
const toolbar = app.querySelector<HTMLElement>('#controls-container')!;
const layout = app.querySelector<HTMLElement>('.app-layout')!;
const chat = new ChatView(panel, {
  onSubmit: text => demo?.submit(text), onReset: () => demo?.reset(), onClose: () => setPanelOpen(false),
});
const controls = new ControlsView(toolbar, panel.id, {
  onToggle: open => setPanelOpen(open), onQuality: profile => demo?.record('quality', profile),
  onReducedMotion: enabled => demo?.record('reduced-motion', enabled),
}, window.matchMedia('(prefers-reduced-motion: reduce)').matches);
function setPanelOpen(open: boolean): void {
  chat.setOpen(open); controls.setOpen(open); layout.classList.toggle('chat-is-closed', !open);
  if (!open) controls.focusToggle();
  demo?.record(open ? 'open' : 'close');
}
if (import.meta.env.DEV) {
  void import('./dev/ChatDemo').then(({ mountChatDemo }) => {
    if (disposed) return;
    const fixture = document.createElement('section'); app.insertBefore(fixture, app.querySelector('footer'));
    demo = mountChatDemo(chat, controls, fixture);
  });
}
const dispose = (): void => {
  if (disposed) return;
  disposed = true; demo?.dispose(); chat.dispose(); controls.dispose(); controller.dispose();
};
const onPageHide = (): void => { dispose(); };
const onPageShow = (event: PageTransitionEvent): void => {
  // Uma página restaurada do bfcache precisa de um novo ciclo de vida.
  if (event.persisted) window.location.reload();
};
window.addEventListener('pagehide', onPageHide);
window.addEventListener('pageshow', onPageShow);
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.removeEventListener('pagehide', onPageHide);
    window.removeEventListener('pageshow', onPageShow);
    dispose();
  });
}
