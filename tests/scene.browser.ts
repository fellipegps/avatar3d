import '../src/styles/base.css';
import { Mesh, Vector3 } from 'three';
import { SceneController } from '../src/scene/SceneController';
import { AppController } from '../src/app/AppController';

if (!import.meta.env.DEV) throw new Error('Esta verificação requer o servidor de desenvolvimento.');

function element(id: string): HTMLElement {
  const value = document.getElementById(id);
  if (!value) throw new Error(`Elemento ausente: ${id}`);
  return value;
}
const fixture = element('fixture');
const results: { name: string; passed: boolean; details: unknown }[] = [];
function check(name: string, condition: boolean, details: unknown = null): void {
  results.push({ name, passed: condition, details });
  if (!condition) throw new Error(name);
}
const delay = (ms = 80): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// Instrumentação exclusiva desta página: GPU/ResizeObserver reais; relógio e
// visibilidade controlados para reproduzir suspensão e contar recursos ativos.
const nativeRAF = window.requestAnimationFrame.bind(window);
const nativeCancel = window.cancelAnimationFrame.bind(window);
const nativeAdd = EventTarget.prototype.addEventListener;
const nativeRemove = EventTarget.prototype.removeEventListener;
const NativeObserver = window.ResizeObserver;
const nativeGetContext = HTMLCanvasElement.prototype.getContext;
const originalHidden = Object.getOwnPropertyDescriptor(document, 'hidden');
const originalDPR = Object.getOwnPropertyDescriptor(window, 'devicePixelRatio');
const listeners = new Map<EventTarget, Map<string, Set<EventListenerOrEventListenerObject>>>();
const observers = new Set<ResizeObserver>();
const pending = new Map<number, FrameRequestCallback>();
let nextFrame = 0;
let hidden = false;
let controller: SceneController | null = null;

function listenerCount(target?: EventTarget): number {
  return [...listeners].filter(([item]) => !target || item === target)
    .reduce((sum, [, types]) => sum + [...types.values()].reduce((n, callbacks) => n + callbacks.size, 0), 0);
}
function step(time: number): void {
  const callbacks = [...pending.values()];
  pending.clear();
  callbacks.forEach((callback) => callback(time));
}
function dimensions(width: number, height: number): void {
  fixture.style.width = `${width}px`;
  fixture.style.height = `${height}px`;
}

async function run(): Promise<void> {
  EventTarget.prototype.addEventListener = function (type, callback, options) {
    // Contar apenas eventos que pertencem ao ciclo de vida sob teste; a
    // automação do navegador também instala seus próprios listeners de UI.
    const sceneEvent = (this === document && type === 'visibilitychange')
      || (this instanceof HTMLCanvasElement && type.startsWith('webglcontext'))
      || (this instanceof MediaQueryList && type === 'change');
    if (callback && sceneEvent) {
      const types = listeners.get(this) ?? new Map<string, Set<EventListenerOrEventListenerObject>>();
      const callbacks = types.get(type) ?? new Set<EventListenerOrEventListenerObject>();
      callbacks.add(callback);
      types.set(type, callbacks);
      listeners.set(this, types);
    }
    nativeAdd.call(this, type, callback, options);
  };
  EventTarget.prototype.removeEventListener = function (type, callback, options) {
    if (callback) listeners.get(this)?.get(type)?.delete(callback);
    nativeRemove.call(this, type, callback, options);
  };
  window.ResizeObserver = class extends NativeObserver {
    override observe(target: Element, options?: ResizeObserverOptions): void {
      observers.add(this);
      super.observe(target, options);
    }
    override disconnect(): void { observers.delete(this); super.disconnect(); }
  };
  window.requestAnimationFrame = (callback) => { pending.set(++nextFrame, callback); return nextFrame; };
  window.cancelAnimationFrame = (id) => { pending.delete(id); };
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  Object.defineProperty(window, 'devicePixelRatio', { configurable: true, get: () => 3 });

  try {
    controller = new SceneController(fixture);
    await delay();
    const canvas = fixture.querySelector('canvas');
    const gl = canvas?.getContext('webgl2');
    check('WebGL 2 real, um canvas e um RAF pendente',
      !!gl && controller.availability.available && fixture.querySelectorAll('canvas').length === 1 && pending.size === 1,
      { version: gl?.getParameter(gl.VERSION), canvases: fixture.querySelectorAll('canvas').length, frames: pending.size });
    const initialListeners = listenerCount();
    check('Pixel ratio normal limitado a 1,5', canvas?.width === Math.floor(fixture.clientWidth * 1.5),
      { bufferWidth: canvas?.width, cssWidth: fixture.clientWidth, injectedDPR: 3 });
    controller.setQuality('economy');
    check('Pixel ratio econômico limitado a 1', canvas?.width === fixture.clientWidth);
    controller.setQuality('normal');
    const deltas: number[] = [];
    const unsubscribe = controller.registerUpdater((delta) => { deltas.push(delta); });
    step(1000); step(1016); step(60000);
    check('Delta em segundos e suspensão limitada a 0,05 s',
      deltas[0] === 0 && Math.abs((deltas[1] ?? 0) - 0.016) < 1e-9 && deltas[2] === 0.05, deltas.slice());
    const reference = controller.scene.children.find((child) => child instanceof Mesh);
    if (!(reference instanceof Mesh)) throw new Error('Geometria de referência ausente.');
    const rotation = reference.rotation.y;
    controller.setReducedMotion(true);
    step(60016);
    check('Movimento reduzido pausa rotação da referência', reference.rotation.y === rotation);
    controller.setReducedMotion(false);

    hidden = true;
    document.dispatchEvent(new Event('visibilitychange'));
    const updatesBeforeHide = deltas.length;
    step(120000);
    check('Aba oculta cancela RAF e não atualiza módulos', pending.size === 0 && deltas.length === updatesBeforeHide);
    hidden = false;
    document.dispatchEvent(new Event('visibilitychange'));
    document.dispatchEvent(new Event('visibilitychange'));
    check('Retomada agenda somente um RAF', pending.size === 1);
    step(180000);
    check('Primeiro delta após retomar é zero', deltas.at(-1) === 0);
    unsubscribe();

    for (const [width, height] of [[240, 160], [32, 16], [1, 1], [600, 360]] as const) {
      dimensions(width, height);
      await delay();
      const actualWidth = fixture.clientWidth;
      const actualHeight = fixture.clientHeight;
      controller.camera.updateMatrixWorld();
      const center = new Vector3(0, 0, 0).project(controller.camera);
      const x = new Vector3(1, 0, 0).project(controller.camera);
      const y = new Vector3(0, 1, 0).project(controller.camera);
      const projectedRatio = ((x.x - center.x) * actualWidth) / ((y.y - center.y) * actualHeight);
      check(`ResizeObserver ${width}×${height}: aspecto, projeção e buffer coerentes`,
        controller.camera.aspect === actualWidth / actualHeight && Math.abs(projectedRatio - 1) < 1e-8
        && canvas?.width === Math.floor(actualWidth * 1.5) && canvas?.height === Math.floor(actualHeight * 1.5),
        { actualWidth, actualHeight, cameraAspect: controller.camera.aspect, projectedRatio });
      step(180016);
    }
    dimensions(0, 0);
    await delay();
    check('Sem área: nenhum RAF e projeção finita', pending.size === 0 && Number.isFinite(controller.camera.aspect));
    dimensions(600, 360);
    await delay();
    check('Área restaurada: um RAF e cena disponível', pending.size === 1 && controller.availability.available);

    let geometryDisposals = 0;
    let materialDisposals = 0;
    reference.geometry.addEventListener('dispose', () => { geometryDisposals++; });
    // A geometria de referência tem um único material.
    const referenceMaterial = Array.isArray(reference.material) ? reference.material[0] : reference.material;
    referenceMaterial?.addEventListener('dispose', () => { materialDisposals++; });
    controller.dispose(); controller.dispose();
    check('Dispose duplo libera recursos uma vez e remove RAF, canvas, listeners e observer',
      geometryDisposals === 1 && materialDisposals === 1 && pending.size === 0
      && fixture.querySelectorAll('canvas').length === 0 && listenerCount() === 0 && observers.size === 0,
      { geometryDisposals, materialDisposals, pending: pending.size, listeners: listenerCount(), observers: observers.size });

    for (let index = 0; index < 3; index++) {
      controller = new SceneController(fixture);
      await delay();
      step(200000 + index * 16);
      check(`Remontagem ${index + 1}: somente um canvas, loop, observer e conjunto de listeners`,
        fixture.querySelectorAll('canvas').length === 1 && pending.size === 1
        && observers.size === 1 && listenerCount() === initialListeners,
        { listeners: listenerCount(), initialListeners, observers: observers.size, frames: pending.size });
      controller.dispose();
    }
    controller = new SceneController(fixture);
    const replacement = new SceneController(fixture);
    check('Nova montagem no mesmo contêiner descarta a anterior',
      !controller.availability.available && fixture.querySelectorAll('canvas').length === 1 && pending.size === 1);
    replacement.dispose();

    controller = new SceneController(fixture);
    const context = fixture.querySelector('canvas')?.getContext('webgl2');
    const contextControl = context?.getExtension('WEBGL_lose_context');
    if (!contextControl) throw new Error('WEBGL_lose_context indisponível para verificar recuperação.');
    contextControl.loseContext();
    await delay(150);
    check('Perda real de contexto pausa o loop e informa indisponibilidade',
      !controller.availability.available && pending.size === 0 && context?.isContextLost() === true);
    contextControl.restoreContext();
    await delay(200);
    check('Restauração real de contexto recupera a cena com somente um RAF',
      controller.availability.available && pending.size === 1 && context?.isContextLost() === false);
    step(250000);
    controller.dispose();

    controller = new SceneController(fixture);
    controller.registerUpdater(() => { throw new Error('Falha deliberada de atualização.'); });
    step(260000);
    check('Falha durante o frame é controlada e libera recursos',
      !controller.availability.available && pending.size === 0 && observers.size === 0
      && listenerCount() === 0 && fixture.querySelectorAll('canvas').length === 0);

    HTMLCanvasElement.prototype.getContext = (() => null) as typeof nativeGetContext;
    const app = new AppController(fixture, element('fixture-status'), element('fallback'));
    check('Falha de WebGL 2 mostra aviso sem remover a interface',
      !element('fallback').hidden && element('fallback').textContent?.includes('WebGL 2') === true
      && element('interface').textContent === 'A área de conversa permanece disponível.'
      && fixture.querySelectorAll('canvas').length === 0 && pending.size === 0);
    app.dispose(); app.dispose();
    check('Falha de inicialização e dispose não deixam listeners/observers', listenerCount() === 0 && observers.size === 0);
  } catch (error) {
    results.push({ name: 'Exceção durante a verificação', passed: false, details: String(error) });
  } finally {
    controller?.dispose();
    HTMLCanvasElement.prototype.getContext = nativeGetContext;
    EventTarget.prototype.addEventListener = nativeAdd;
    EventTarget.prototype.removeEventListener = nativeRemove;
    window.ResizeObserver = NativeObserver;
    window.requestAnimationFrame = nativeRAF;
    window.cancelAnimationFrame = nativeCancel;
    if (originalHidden) Object.defineProperty(document, 'hidden', originalHidden);
    else Reflect.deleteProperty(document, 'hidden');
    if (originalDPR) Object.defineProperty(window, 'devicePixelRatio', originalDPR);
    else Reflect.deleteProperty(window, 'devicePixelRatio');
    element('results').textContent = JSON.stringify(results, null, 2);
    element('summary').textContent = `${results.filter((item) => item.passed).length}/${results.length} verificações passaram.`;
    startNativeVisibilityCheck();
  }
}

function startNativeVisibilityCheck(): void {
  element('fallback').hidden = true;
  const live = new SceneController(fixture, (state) => {
    element('fixture-status').textContent = state.available ? 'Cena de referência' : state.message;
  });
  let failedApp: AppController | null = null;
  let updates = 0;
  let hiddenUpdates = 0;
  let awaitingFirstDelta = false;
  const visibilityHistory: object[] = [];
  live.registerUpdater((delta) => {
    updates++;
    if (awaitingFirstDelta) {
      visibilityHistory.push({ event: 'first-frame-after-resume', delta, passed: delta === 0 });
      awaitingFirstDelta = false;
      element('visibility').textContent = JSON.stringify(visibilityHistory, null, 2);
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hiddenUpdates = updates;
    else awaitingFirstDelta = true;
    visibilityHistory.push({ event: document.hidden ? 'hidden' : 'visible', updates,
      ...(document.hidden ? {} : { noUpdatesWhileHidden: updates === hiddenUpdates }) });
    element('visibility').textContent = JSON.stringify(visibilityHistory, null, 2);
  });
  element('small').addEventListener('click', () => { dimensions(240, 160); });
  element('zero').addEventListener('click', () => { dimensions(0, 0); });
  element('restore').addEventListener('click', () => { dimensions(600, 360); });
  element('failure').addEventListener('click', () => {
    live.dispose();
    failedApp?.dispose();
    HTMLCanvasElement.prototype.getContext = (() => null) as typeof nativeGetContext;
    try { failedApp = new AppController(fixture, element('fixture-status'), element('fallback')); }
    finally { HTMLCanvasElement.prototype.getContext = nativeGetContext; }
  });
  window.addEventListener('pagehide', () => { live.dispose(); failedApp?.dispose(); }, { once: true });
}

void run();
