import './styles/base.css';
import { AppController } from './app/AppController';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Contêiner #app não encontrado.');
}

app.innerHTML = `
  <header class="app-header">
    <div>
      <p class="eyebrow">MVP · Fase 02</p>
      <h1>Avatar 3D</h1>
    </div>
    <span class="stage-badge">Cena WebGL 2</span>
  </header>
  <main class="app-layout">
    <section class="scene-panel" aria-labelledby="scene-title">
      <header class="panel-header">
        <h2 id="scene-title">Espaço 3D</h2>
        <span id="scene-status" class="panel-meta" role="status">Inicializando 3D…</span>
      </header>
      <div id="scene-container" class="scene-container">
        <p id="scene-fallback" class="scene-placeholder" role="alert" hidden></p>
      </div>
      <p class="scene-caption">Cubo de referência · Renderer, câmera e ciclo de vida</p>
    </section>
    <aside id="interface-container" class="interface-panel" aria-labelledby="interface-title">
      <header class="panel-header">
        <h2 id="interface-title">Conversa local</h2>
        <span class="panel-meta">DEMO</span>
      </header>
      <div class="interface-placeholder">
        <span class="eyebrow">Interface</span>
        <h3>Vamos conversar por aqui.</h3>
        <p>Esta área receberá o histórico, a entrada de mensagens e os controles da experiência.</p>
        <p class="note">Chat disponível em uma fase futura.</p>
      </div>
    </aside>
  </main>
  <footer class="app-footer">Protótipo local · Estrutura inicial</footer>
`;

const container = app.querySelector<HTMLElement>('#scene-container');
const status = app.querySelector<HTMLElement>('#scene-status');
const fallback = app.querySelector<HTMLElement>('#scene-fallback');
if (!container || !status || !fallback) throw new Error('Estrutura da cena incompleta.');

const controller = new AppController(container, status, fallback);
const onPageHide = (): void => { controller.dispose(); };
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
    controller.dispose();
  });
}
