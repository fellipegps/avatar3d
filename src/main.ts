import './styles/base.css';
import './styles/layout.css';
import './styles/chat.css';
import { AppController } from './app/AppController';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Contêiner #app não encontrado.');
}

app.innerHTML = `
  <header class="app-header">
    <div>
      <p class="eyebrow">MVP · Fase 10</p>
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
  <footer class="app-footer">Conversa local · Respostas pré-definidas · DEMO</footer>
`;

const container = app.querySelector<HTMLElement>('#scene-container');
const status = app.querySelector<HTMLElement>('#scene-status');
const fallback = app.querySelector<HTMLElement>('#scene-fallback');
if (!container || !status || !fallback) throw new Error('Estrutura da cena incompleta.');

const controller = new AppController(container, status, fallback, {
  ui: {
    panel: app.querySelector<HTMLElement>('#interface-container')!,
    toolbar: app.querySelector<HTMLElement>('#controls-container')!,
    layout: app.querySelector<HTMLElement>('.app-layout')!,
  },
});
const dispose = (): void => controller.dispose();
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
