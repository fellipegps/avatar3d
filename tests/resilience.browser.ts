import '../src/styles/base.css';
import '../src/styles/layout.css';
import '../src/styles/chat.css';
import { AppController } from '../src/app/AppController';
import { SceneController } from '../src/scene/SceneController';
import { loadCharacter } from '../src/scene/AssetLoader';
import { characterManifest } from '../src/scene/character.manifest';
import { MockChatProvider } from '../src/chat/MockChatProvider';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Mesh } from 'three';

const host = document.querySelector<HTMLElement>('#host')!;
const results: { name: string; passed: boolean; details?: unknown }[] = [];
const check = (name: string, passed: boolean, details?: unknown): void => { results.push({ name, passed, details }); if (!passed) throw new Error(name); };
const delay = (ms = 40): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
async function until(predicate: () => boolean): Promise<void> {
  const deadline = performance.now() + 15000;
  while (!predicate()) { if (performance.now() > deadline) throw new Error('Prazo do teste excedido'); await delay(); }
}
const nativeFetch = window.fetch, nativeContext = HTMLCanvasElement.prototype.getContext, nativeParse = GLTFLoader.prototype.parseAsync;
let app: AppController | null = null, scene: SceneController | null = null, created = 0;
function mount(): void {
  app?.dispose();
  host.innerHTML = '<nav></nav><main class="app-layout"><section class="scene-panel"><header class="panel-header"><h2>Espaço 3D</h2><span id="status" role="status"></span></header><div id="scene" class="scene-container"><p id="fallback" class="scene-placeholder" role="alert" hidden></p></div></section><aside class="interface-panel" id="chat"></aside></main>';
  app = new AppController(find('#scene'), find('#status'), find('#fallback'), {
    ui: { toolbar: find('nav'), panel: find('aside'), layout: find('main') }, inspector: false,
    provider: new MockChatProvider({ latencyMs: 0 }),
    createScene: (container, callback) => { created++; scene = new SceneController(container, callback); return scene; },
  });
  app.setReducedMotion(true);
}
function find<T extends HTMLElement>(selector: string): T { return host.querySelector<T>(selector)!; }
const ready = (): boolean => find('#status').textContent === 'Vita · Modelo carregado';
const retry = (): void => find<HTMLButtonElement>('#fallback button').click();
async function run(): Promise<void> {
  try {
    let aborted = false;
    window.fetch = async (_url, options) => new Promise((_resolve, reject) => {
      options?.signal?.addEventListener('abort', () => { aborted = true; reject(options.signal?.reason); }, { once: true });
    });
    let timeout = '';
    try { await loadCharacter(characterManifest, new AbortController().signal, 20); } catch (error) { timeout = (error as Error).name; }
    check('Download travado termina com TimeoutError e aborta a requisição', timeout === 'TimeoutError' && aborted);
    window.fetch = nativeFetch;

    let release: (() => void) | undefined, geometries = 0, disposed = 0;
    const cancel = new AbortController();
    GLTFLoader.prototype.parseAsync = async function(data, path) {
      const parsed = await nativeParse.call(this, data, path);
      const seen = new Set();
      parsed.scene.traverse(object => { if (object instanceof Mesh && !seen.has(object.geometry)) {
        seen.add(object.geometry); geometries++; object.geometry.addEventListener('dispose', () => disposed++);
      } });
      await new Promise<void>(resolve => { release = resolve; });
      return parsed;
    };
    const late = loadCharacter(characterManifest, cancel.signal).catch(error => (error as Error).name);
    await until(() => !!release); cancel.abort();
    check('Aborto encerra a espera mesmo com parse pendente', await late === 'AbortError' && disposed === 0);
    release!(); await until(() => disposed > 0);
    check('Parse tardio libera cada geometria uma única vez', geometries > 0 && disposed === geometries, { geometries, disposed });
    GLTFLoader.prototype.parseAsync = nativeParse;

    window.fetch = async () => new Response('', { status: 404 }); mount();
    await until(() => find('#status').textContent === 'Personagem indisponível');
    check('HTTP 404 mostra fallback estático e tentativa habilitada', !find('#fallback').hidden && find('#fallback').textContent?.includes('HTTP 404') === true
      && !find<HTMLButtonElement>('#fallback button').disabled && !!find('#fallback img'));
    await app!.submit('Olá');
    check('Chat responde com GLB indisponível', app!.getSnapshot().messages.length === 2 && app!.getSnapshot().phase === 'idle');
    const previousScene = scene, beforeCreated = created;
    window.fetch = nativeFetch; retry(); retry();
    check('Tentativa mostra carregamento, bloqueia repetição e preserva histórico', find('#scene').getAttribute('aria-busy') === 'true' && app!.getSnapshot().messages.length === 2);
    await until(ready); await delay(150);
    check('Recarga de GLB reutiliza renderer e um canvas', scene === previousScene && created === beforeCreated && host.querySelectorAll('canvas').length === 1 && find('#fallback').hidden === true);
    const snapshots = [scene!.getRenderStats()];
    for (let i = 0; i < 3; i++) { await scene!.loadCharacter(); await delay(100); snapshots.push(scene!.getRenderStats()); }
    check('Três recargas estabilizam geometrias/texturas/programas', snapshots.every(s => s?.geometries === snapshots[0]?.geometries && s?.textures === snapshots[0]?.textures && s?.programs === snapshots[0]?.programs), snapshots);
    app!.setQuality('economy');
    const canvas = find<HTMLCanvasElement>('canvas');
    const ext = canvas.getContext('webgl2')!.getExtension('WEBGL_lose_context')!;
    ext.loseContext(); await until(() => !find('#fallback').hidden);
    check('Perda real de contexto mostra feedback e mantém chat', find('#fallback').textContent?.includes('contexto gráfico') === true);
    await app!.submit('ajuda'); check('Chat completa resposta durante perda de contexto', app!.getSnapshot().messages.length === 4);
    ext.restoreContext(); await until(() => find('#fallback').hidden === true); await delay(100);
    check('Recuperação nativa retoma o mesmo canvas e modelo', find('canvas') === canvas && !!scene!.getAnimationStatus());
    ext.loseContext(); await until(() => !find('#fallback').hidden); retry(); await until(ready);
    check('Reinício manual após perda troca renderer sem duplicar canvas ou conversa', find('canvas') !== canvas && host.querySelectorAll('canvas').length === 1 && app!.getSnapshot().messages.length === 4 && find<HTMLSelectElement>('select').value === 'economy');

    HTMLCanvasElement.prototype.getContext = (() => null) as typeof nativeContext; mount();
    HTMLCanvasElement.prototype.getContext = nativeContext;
    await app!.submit('olá');
    check('Sem WebGL 2: zero canvas, imagem de fallback e conversa completa', !host.querySelector('canvas') && !find('#fallback').hidden && app!.getSnapshot().messages.length === 2);
    retry(); await until(ready);
    check('Nova tentativa recupera renderer ausente sem apagar conversa', host.querySelectorAll('canvas').length === 1 && app!.getSnapshot().messages.length === 2);
    app!.dispose(); app!.dispose();
    check('Descarte repetido remove canvas e estado de carregamento', !host.querySelector('canvas') && !find('#scene').hasAttribute('aria-busy'));
  } catch (error) { results.push({ name: 'Exceção inesperada', passed: false, details: String(error) }); }
  finally {
    window.fetch = nativeFetch; HTMLCanvasElement.prototype.getContext = nativeContext; GLTFLoader.prototype.parseAsync = nativeParse;
    document.querySelector('#results')!.textContent = JSON.stringify(results, null, 2);
    document.querySelector('#summary')!.textContent = `${results.filter(r => r.passed).length}/${results.length} verificações passaram.`;
    mount();
  }
}
document.querySelector('#demo-failure')!.addEventListener('click', () => {
  HTMLCanvasElement.prototype.getContext = (() => null) as typeof nativeContext;
  try { mount(); } finally { HTMLCanvasElement.prototype.getContext = nativeContext; }
});
let lostExtension: WEBGL_lose_context | null = null;
document.querySelector('#demo-loss')!.addEventListener('click', () => { lostExtension = find<HTMLCanvasElement>('canvas').getContext('webgl2')!.getExtension('WEBGL_lose_context'); lostExtension?.loseContext(); });
document.querySelector('#demo-restore')!.addEventListener('click', () => lostExtension?.restoreContext());
window.addEventListener('pagehide', () => app?.dispose(), { once: true });
void run();

