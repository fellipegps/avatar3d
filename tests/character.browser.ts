import '../src/styles/base.css';
import { Box3, Mesh, SkinnedMesh, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { loadCharacter, inspectCharacter } from '../src/scene/AssetLoader';
import type { LoadedCharacter } from '../src/scene/AssetLoader';
import { characterManifest } from '../src/scene/character.manifest';
import { CharacterPreview } from '../src/scene/CharacterPreview';
import { SceneController } from '../src/scene/SceneController';
import { AppController } from '../src/app/AppController';
import type { CharacterState } from '../src/app/contracts';

const element = (id: string): HTMLElement => {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Elemento ausente: ${id}`);
  return found;
};
const results: { name: string; passed: boolean; details?: unknown }[] = [];
function check(name: string, passed: boolean, details?: unknown): void { results.push({ name, passed, details }); }
async function rejects(name: string, action: () => Promise<unknown>, expected: string): Promise<void> {
  try { await action(); check(name, false, 'Não rejeitou'); }
  catch (error) { check(name, String(error).includes(expected), String(error)); }
}
const delay = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 20));
async function until(condition: () => boolean): Promise<void> {
  for (let i = 0; i < 100; i++) { if (condition()) return; await delay(); }
  throw new Error('Tempo excedido aguardando resultado.');
}

async function run(): Promise<void> {
  const nativeFetch = window.fetch;
  const nativeParse = GLTFLoader.prototype.parseAsync;
  let asset: LoadedCharacter | null = null;
  let preview: CharacterPreview | null = null;
  let scene: SceneController | null = null;
  let app: AppController | null = null;
  try {
    asset = await loadCharacter(characterManifest, new AbortController().signal);
    element('inventory').textContent = JSON.stringify(asset.report, null, 2);
    check('GLB real: rig, 26.130 triângulos e 16 meshes materiais', asset.report.triangles === 26130
      && asset.report.bones.length === 155 && asset.report.meshes.length === 16, {
      bytes: asset.report.bytes, bones: asset.report.bones.length, meshes: asset.report.meshes.length, triangles: asset.report.triangles });
    check('Transformação: chão em zero e altura aproximada de 1,713 m',
      Math.abs(asset.report.bounds.min[1] ?? 1) < 0.001 && Math.abs((asset.report.bounds.size[1] ?? 0) - 1.71308) < 0.002,
      asset.report.bounds);
    check('41 morph targets com nomes reais nos nove meshes faciais',
      asset.report.meshes.filter(m => m.morphTargets.length === 41).length === 9);
    for (const [label, changed, expected] of [
      ['clipe inexistente', { ...characterManifest, clips: { ...characterManifest.clips, thinking: 'missing' } }, 'Clipe obrigatório'],
      ['morph inexistente', { ...characterManifest, face: { ...characterManifest.face, blink: 'missing' } }, 'Controle facial'],
    ] as const) {
      await rejects(`Manifesto rejeita ${label}`, async () => inspectCharacter(asset!.gltf, changed, asset!.report.bytes), expected);
    }
    preview = new CharacterPreview(asset, characterManifest);
    const root = asset.gltf.scene;
    const head = root.getObjectByName('J_Bip_C_Head');
    if (!head) throw new Error('Cabeça ausente');
    const face = root.getObjectByName(characterManifest.face.meshNames[0] ?? '');
    if (!(face instanceof Mesh)) throw new Error('Face ausente');
    const blink = face.morphTargetDictionary?.[characterManifest.face.blink];
    const mouth = face.morphTargetDictionary?.[characterManifest.face.mouth];
    if (blink === undefined || mouth === undefined || !face.morphTargetInfluences) throw new Error('Morphs ausentes');
    preview.setBlink(1); preview.setMouthOpen(0.75);
    const loopReports = [];
    for (const state of ['idle', 'thinking', 'responding'] as CharacterState[]) {
      preview.setState(state);
      const start = head.quaternion.clone();
      const clip = asset.gltf.animations.find(c => c.name === characterManifest.clips[state]);
      if (!clip) throw new Error('Clipe ausente');
      let moved = false;
      let validBounds = true;
      const samples = [];
      for (let i = 0; i < 4; i++) {
        preview.update(clip.duration / 4);
        root.updateMatrixWorld(true);
        moved ||= head.quaternion.angleTo(start) > 0.005;
        const box = new Box3().setFromObject(root, true);
        const size = box.getSize(new Vector3());
        validBounds &&= [...box.min, ...box.max].every(Number.isFinite) && size.y > 1.5 && size.y < 1.9
          && size.x < 1.5 && size.z < 1 && Math.abs(box.min.y) < 0.002;
        samples.push({ min: box.min.toArray(), max: box.max.toArray() });
      }
      check(`${state}: animação de rig e limites finitos durante o ciclo`, moved && validBounds);
      check(`${state}: loop retorna à pose sem deslocar o chão`, head.quaternion.angleTo(start) < 0.00001);
      loopReports.push({ state, duration: clip.duration, samples });
    }
    check('Clipes corporais preservam os valores faciais manuais', face.morphTargetInfluences[blink] === 1 && face.morphTargetInfluences[mouth] === 0.75);
    preview.setState('idle');
    const idle = head.quaternion.clone();
    preview.setState('thinking'); preview.update(0.7);
    preview.setState('responding'); preview.update(0.8);
    preview.setState('idle');
    check('Retorno após três estados restaura a pose idle', head.quaternion.angleTo(idle) < 0.00001);
    preview.setReducedMotion(true);
    const paused = head.quaternion.clone(); preview.update(2);
    check('Movimento reduzido congela o corpo', head.quaternion.angleTo(paused) < 0.00001);
    preview.setBlink(-1); preview.setMouthOpen(5);
    check('Valores faciais são limitados a 0–1', face.morphTargetInfluences[blink] === 0 && face.morphTargetInfluences[mouth] === 1);
    preview.setMouthOpen(NaN);
    check('Valor facial não finito volta a zero', face.morphTargetInfluences[mouth] === 0);
    element('inventory').textContent = JSON.stringify({ ...asset.report, loopReports }, null, 2);
    const geometryCounts = new Map<object, number>();
    root.traverse(o => {
      if (o instanceof Mesh && !geometryCounts.has(o.geometry)) {
        geometryCounts.set(o.geometry, 0);
        o.geometry.addEventListener('dispose', () => geometryCounts.set(o.geometry, (geometryCounts.get(o.geometry) ?? 0) + 1));
      }
    });
    preview.dispose(); preview.dispose(); asset.dispose();
    check('Dispose repetido libera cada geometria uma vez', [...geometryCounts.values()].every(n => n === 1) && root.children.length === 0);

    await rejects('Abort anterior ao fetch', () => loadCharacter(characterManifest, AbortSignal.abort()), 'AbortError');
    window.fetch = async () => new Response('', { status: 404 });
    await rejects('HTTP 404 controlado', () => loadCharacter(characterManifest, new AbortController().signal), 'HTTP 404');
    window.fetch = async () => new Response('<html>fallback SPA</html>');
    await rejects('HTML no lugar de GLB é rejeitado', () => loadCharacter(characterManifest, new AbortController().signal), 'GLB válido');
    window.fetch = nativeFetch;

    const cancelParse = new AbortController();
    let disposedAfterParse = 0;
    let parsedGeometryCount = 0;
    GLTFLoader.prototype.parseAsync = async function(data, path) {
      const parsed = await nativeParse.call(this, data, path);
      const seen = new Set();
      parsed.scene.traverse(object => {
        if (object instanceof SkinnedMesh && !seen.has(object.geometry)) {
          seen.add(object.geometry); parsedGeometryCount++;
          object.geometry.addEventListener('dispose', () => disposedAfterParse++);
        }
      });
      cancelParse.abort();
      return parsed;
    };
    await rejects('Abort durante parse ignora resultado tardio', () => loadCharacter(characterManifest, cancelParse.signal), 'AbortError');
    check('GLB que termina após abort libera geometrias', disposedAfterParse === parsedGeometryCount && parsedGeometryCount > 0);
    GLTFLoader.prototype.parseAsync = nativeParse;

    scene = new SceneController(element('fixture'));
    await scene.loadCharacter();
    check('Integração usa um canvas, substitui cubo e mantém cena disponível',
      element('fixture').querySelectorAll('canvas').length === 1 && scene.availability.available
      && scene.scene.getObjectByName('J_Bip_C_Head') !== undefined && !scene.scene.children.some(c => c instanceof Mesh));
    scene.dispose();
    scene = new SceneController(element('fixture'));
    const late = scene.loadCharacter(); scene.dispose();
    await rejects('Descarte durante download cancela carga', () => late, 'AbortError');
    check('Descarte não reinsere canvas/modelo tardiamente', element('fixture').querySelectorAll('canvas').length === 0 && scene.scene.children.length === 0);

    window.fetch = async () => new Response('', { status: 404 });
    app = new AppController(element('fixture'), element('asset-status'), element('fallback'));
    await until(() => element('asset-status').textContent === 'Personagem indisponível');
    check('Erro do asset mostra aviso e preserva interface', !element('fallback').hidden
      && element('fallback').textContent?.includes('HTTP 404') === true
      && element('interface').textContent === 'A interface permanece disponível.');
    app.dispose();
  } catch (error) {
    check('Exceção inesperada', false, String(error));
  } finally {
    window.fetch = nativeFetch;
    GLTFLoader.prototype.parseAsync = nativeParse;
    preview?.dispose(); asset?.dispose(); scene?.dispose(); app?.dispose();
    element('results').textContent = JSON.stringify(results, null, 2);
    element('summary').textContent = `${results.filter(r => r.passed).length}/${results.length} verificações passaram.`;
  }
}
void run();
