import { SceneController } from '../src/scene/SceneController';
import type { QualityProfile } from '../src/app/contracts';

const container = document.querySelector<HTMLElement>('#scene')!;
const scene = new SceneController(container);
const summary = document.querySelector('#summary')!;
const results = document.querySelector('#results')!;
const originalDPR = Object.getOwnPropertyDescriptor(window, 'devicePixelRatio');
const nativeDPR = window.devicePixelRatio;
const runs: object[] = [];
async function measure(profile: QualityProfile, dpr: number): Promise<void> {
  Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: dpr });
  scene.setQuality(profile);
  summary.textContent = `Medindo ${profile}, DPR solicitado ${dpr} · 2 s de aquecimento + 10 s de amostra`;
  const samples: number[] = [];
  const start = performance.now(); let previous = 0;
  await new Promise<void>(resolve => {
    const remove = scene.registerUpdater(() => {
      const now = performance.now(), elapsed = now - start;
      scene.setCharacterState(elapsed < 4000 ? 'idle' : elapsed < 7000 ? 'thinking' : elapsed < 10000 ? 'responding' : 'idle');
      if (elapsed >= 2000 && previous) samples.push(now - previous);
      previous = elapsed >= 2000 ? now : 0;
      if (elapsed >= 12000) { remove(); resolve(); }
    });
  });
  const sorted = [...samples].sort((a,b) => a-b);
  const mean = samples.reduce((a,b) => a+b, 0) / samples.length;
  const gl = container.querySelector('canvas')!.getContext('webgl2')!;
  const debug = gl.getExtension('WEBGL_debug_renderer_info');
  runs.push({ profile, requestedDPR: dpr, nativeDPR, viewport: [innerWidth,innerHeight], samples: samples.length,
    durationMs: samples.reduce((a,b) => a+b, 0), meanFrameIntervalMs: mean, estimatedFPS: 1000/mean,
    p50Ms: sorted[Math.floor(sorted.length*.5)], p95Ms: sorted[Math.floor(sorted.length*.95)], maxMs: sorted.at(-1),
    over33ms: samples.filter(s => s > 33.34).length, stats: scene.getRenderStats(),
    gpu: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : 'indisponível', userAgent: navigator.userAgent });
  results.textContent = JSON.stringify(runs, null, 2);
}
async function run(): Promise<void> {
  try {
    await scene.loadCharacter();
    for (const dpr of [nativeDPR, 2]) for (const profile of ['normal','economy'] as const) await measure(profile,dpr);
    summary.textContent = 'Concluído: 4 amostras de 10 segundos. Intervalos de apresentação do loop; não são tempo exclusivo de GPU.';
  } catch (error) { summary.textContent = String(error); }
  finally {
    if (originalDPR) Object.defineProperty(window,'devicePixelRatio',originalDPR); else Reflect.deleteProperty(window,'devicePixelRatio');
    scene.dispose();
  }
}
window.addEventListener('pagehide', () => scene.dispose(), { once: true });
void run();
