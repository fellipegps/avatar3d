import '../src/styles/base.css';
import { Mesh, SkinnedMesh, Vector3 } from 'three';
import type { CharacterState } from '../src/app/contracts';
import { loadCharacter, inspectCharacter } from '../src/scene/AssetLoader';
import { CharacterController } from '../src/scene/CharacterController';
import { FaceController } from '../src/scene/FaceController';
import { characterManifest } from '../src/scene/character.manifest';
import { SceneController } from '../src/scene/SceneController';

if (!import.meta.env.DEV) throw new Error('Verificação exclusiva do desenvolvimento.');
const element = (id: string): HTMLElement => document.getElementById(id)!;
const results: { name: string; passed: boolean; details: unknown }[] = [];
const check = (name: string, passed: boolean, details: unknown = null): void => { results.push({ name, passed, details }); };
let live: SceneController | null = null;
let cancelCapture: (() => void) | null = null;

async function run(): Promise<void> {
  const asset = await loadCharacter(characterManifest, new AbortController().signal);
  let face: FaceController | null = null;
  let body: CharacterController | null = null;
  try {
    const meshes = characterManifest.face.meshNames.map(name => asset.gltf.scene.getObjectByName(name) as Mesh);
    const values = (morph: string): number[] => meshes.map(mesh => mesh.morphTargetInfluences![mesh.morphTargetDictionary![morph]!]!);
    const all = (morph: string, expected: number): boolean => values(morph).every(value => Math.abs(value - expected) < 1e-8);
    const config = characterManifest.face;
    for (const [name, changed] of [
      ['mesh inexistente', { ...config, meshNames: ['missing'] }],
      ['olhos inexistentes', { ...config, blink: 'missing' }],
      ['boca inexistente', { ...config, mouth: 'missing' }],
      ['lista facial vazia', { ...config, meshNames: [] }],
      ['controles sobrepostos', { ...config, mouth: config.blink }],
    ] as const) {
      try { inspectCharacter(asset.gltf, { ...characterManifest, face: changed }, asset.report.bytes); check(`Rejeita ${name} no carregamento`, false); }
      catch (error) { check(`Rejeita ${name} no carregamento`, String(error).includes('facial'), String(error)); }
    }
    const dictionary = meshes[0]!.morphTargetDictionary!;
    const mouthIndex = dictionary[config.mouth]!;
    dictionary[config.mouth] = 999999;
    try { inspectCharacter(asset.gltf, characterManifest, asset.report.bytes); check('Índice inválido é rejeitado', false); }
    catch (error) { check('Índice inválido é rejeitado', String(error).includes('Controle facial'), String(error)); }
    finally { dictionary[config.mouth] = mouthIndex; }
    try { new FaceController(asset.gltf.scene, { ...config, blinkTiming: { ...config.blinkTiming, closing: 0 } }); check('Configuração de tempo inválida é rejeitada', false); }
    catch (error) { check('Configuração de tempo inválida é rejeitada', String(error).includes('Tempos'), String(error)); }
    face = new FaceController(asset.gltf.scene, config, () => 0);
    check('Nove meshes começam com olhos e boca neutros', meshes.length === 9 && all(config.blink, 0) && all(config.mouth, 0));
    for (const value of [0, 0.5, 1]) {
      face.setMouthOpen(value);
      check(`Boca ${value} alcança todos os meshes sem mudar olhos`, all(config.mouth, value) && all(config.blink, 0));
    }
    for (const [input, expected] of [[-5, 0], [4, 1], [NaN, 0], [Infinity, 0], [-Infinity, 0]] as const) {
      face.setMouthOpen(input); face.setBlink(input);
      check(`Clamp facial de ${String(input)}`, all(config.mouth, expected) && all(config.blink, expected));
    }
    face.reset();
    const mesh = meshes[0] as SkinnedMesh;
    const target = mesh.geometry.morphAttributes.position![mouthIndex]!;
    const base = mesh.geometry.getAttribute('position');
    let vertex = 0, maxDisplacement = 0;
    for (let index = 0; index < base.count; index++) {
      const offset = new Vector3().fromBufferAttribute(target, index);
      if (!mesh.geometry.morphTargetsRelative) offset.sub(new Vector3().fromBufferAttribute(base, index));
      if (offset.length() > maxDisplacement) { vertex = index; maxDisplacement = offset.length(); }
    }
    mesh.skeleton.update();
    const sample = (amount: number): Vector3 => { face!.setMouthOpen(amount); return mesh.getVertexPosition(vertex, new Vector3()); };
    const closed = sample(0), half = sample(0.5), open = sample(1);
    check('Deformação real da boca é não nula e intermediária em 0,5', maxDisplacement > 0.001
      && open.distanceTo(closed) > 0.001 && half.distanceTo(closed.clone().lerp(open, 0.5)) < 1e-6,
    { vertex, displacementAtOne: open.distanceTo(closed), halfError: half.distanceTo(closed.clone().lerp(open, 0.5)) });
    face.setMouthOpen(0.5); face.setBlink(1); face.update(0.05);
    check('Olhos fechados não alteram boca intermediária', all(config.blink, 1) && all(config.mouth, 0.5));
    face.setMouthOpen(1);
    check('Boca máxima não abre olhos fechados', all(config.blink, 1) && all(config.mouth, 1));
    face.reset();
    check('Reset neutraliza ambos os canais imediatamente', all(config.blink, 0) && all(config.mouth, 0) && !face.getStatus().manual);
    const minWait = face.getStatus().wait;
    face.dispose();
    face = new FaceController(asset.gltf.scene, config, () => 1);
    check('Intervalos configuráveis cobrem mínimo e máximo', minWait === 2.5 && face.getStatus().wait === 5.5);
    face.dispose(); face = new FaceController(asset.gltf.scene, config, () => 0);
    face.setMouthOpen(0.5);
    let sawPartial = false, sawClosed = false, reopened = false;
    for (let frame = 0; frame < 360; frame++) {
      face.update(1 / 120);
      const blink = face.getStatus().blink;
      sawPartial ||= blink > 0 && blink < 1; sawClosed ||= blink === 1;
      reopened ||= sawClosed && blink === 0;
    }
    check('Piscar fecha e reabre suavemente preservando boca', sawPartial && sawClosed && reopened && all(config.mouth, 0.5));
    face.reset();
    for (let frame = 0; frame < 305; frame++) face.update(1 / 120);
    check('Teste alcança piscar em andamento', face.getStatus().blink > 0);
    face.setReducedMotion(true);
    for (let frame = 0; frame < 1000; frame++) face.update(0.05);
    check('Movimento reduzido cancela o piscar e desativa repetição', all(config.blink, 0) && all(config.mouth, 0));
    face.setBlink(0.5); face.setMouthOpen(0.5); face.update(0.05);
    check('Ajustes manuais estáticos funcionam em movimento reduzido', all(config.blink, 0.5) && all(config.mouth, 0.5));
    face.reset(); face.setReducedMotion(false); face.update(0.05);
    check('Retomada espera novo intervalo sem rajada de piscadas', all(config.blink, 0) && face.getStatus().phase === 'waiting');
    face.setAutoBlink(false);
    for (let frame = 0; frame < 300; frame++) face.update(0.05);
    check('Piscar automático pode ser desativado', all(config.blink, 0));
    face.setAutoBlink(true); face.update(999);
    check('Delta de suspensão não comprime vários piscados', all(config.blink, 0) && face.getStatus().phase === 'waiting');
    face.setBlink(0.5); face.setMouthOpen(0.5); face.update(NaN); face.update(-1); face.update(Infinity);
    check('Deltas inválidos preservam expressão', all(config.blink, 0.5) && all(config.mouth, 0.5));
    face.dispose(); face.dispose(); face.setBlink(1); face.setMouthOpen(1); face.update(1);
    check('Descarte neutraliza face e ignora comandos tardios', all(config.blink, 0) && all(config.mouth, 0));
    const samples: number[] = [];
    for (const hz of [30, 120]) {
      face = new FaceController(asset.gltf.scene, config, () => 0.5);
      const frames = Math.round(hz * (4 + 4 / 30));
      for (let frame = 0; frame < frames; frame++) face.update(1 / hz);
      samples.push(face.getStatus().blink); face.dispose();
    }
    check('Mesmo tempo produz a mesma abertura a 30 e 120 atualizações/s', samples[0]! > 0 && samples[0]! < 1
      && Math.abs(samples[0]! - samples[1]!) < 1e-8, samples);
    face = null;
    body = new CharacterController(asset, characterManifest);
    for (const state of ['idle', 'thinking', 'responding'] as const) {
      for (const amount of [0, 0.5, 1]) {
        body.resetFace(); body.setState(state); body.setMouthOpen(amount);
        const head = asset.gltf.scene.getObjectByName('J_Bip_C_Head')!;
        const initial = head.quaternion.clone();
        let peak = 0, mouthStable = true, bodyMoved = false, returned = false;
        for (let frame = 0; frame < 720; frame++) {
          body.update(1 / 120);
          peak = Math.max(peak, body.getFaceStatus().blink);
          returned ||= peak === 1 && body.getFaceStatus().blink === 0;
          mouthStable &&= all(config.mouth, amount);
          bodyMoved ||= head.quaternion.angleTo(initial) > 0.005;
        }
        check(`Piscar automático durante ${state}, boca ${amount} e corpo ativo`, peak === 1 && returned && mouthStable && bodyMoved, { peak });
      }
    }
    body.setBlink(1); body.setMouthOpen(1); body.resetFace();
    check('Reset do controlador corporal neutraliza rosto', all(config.blink, 0) && all(config.mouth, 0));
  } catch (error) { check('Execução sem exceções inesperadas', false, String(error)); }
  finally { face?.dispose(); body?.dispose(); asset.dispose(); }

  live = new SceneController(element('fixture'));
  await live.loadCharacter(); live.setCharacterView('face');
  (element('controls') as HTMLFieldSetElement).disabled = false;
  element('results').textContent = JSON.stringify(results, null, 2);
  element('summary').textContent = `${results.filter(result => result.passed).length}/${results.length} verificações passaram.`;
}

element('controls').addEventListener('change', event => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement || input instanceof HTMLSelectElement) || !live) return;
  if (input.id === 'state') live.setCharacterState(input.value as CharacterState);
  if (input.id === 'mouth') live.setMouthOpen(Number(input.value));
  if (input.id === 'eyes') { live.setBlink(Number(input.value)); (element('automatic') as HTMLInputElement).checked = false; }
  if (input.id === 'automatic' && input instanceof HTMLInputElement) live.setAutoBlink(input.checked);
  if (input.id === 'reduced' && input instanceof HTMLInputElement) live.setReducedMotion(input.checked);
});
element('reset').addEventListener('click', () => {
  live?.resetFace();
  (element('mouth') as HTMLSelectElement).value = '0'; (element('eyes') as HTMLSelectElement).value = '0';
});
element('capture').addEventListener('click', () => {
  if (!live) return;
  cancelCapture?.();
  live.setAutoBlink(true); live.setReducedMotion(false);
  (element('automatic') as HTMLInputElement).checked = true; (element('reduced') as HTMLInputElement).checked = false;
  element('capture-status').textContent = 'Aguardando o próximo fechamento automático (até 6 segundos)…';
  cancelCapture = live.registerUpdater(() => {
    if (live?.getFaceStatus()?.blink !== 1) return;
    // A microtask roda após tick/render e antes do compositor limpar o drawing buffer.
    // Não cria outro RAF, render ou relógio; confirma a expressão do quadro recém-desenhado.
    queueMicrotask(() => {
      const status = live?.getFaceStatus();
      if (status?.blink !== 1 || !cancelCapture) return;
      const data = element('fixture').querySelector('canvas')!.toDataURL('image/png');
      (element('blink-capture') as HTMLImageElement).src = data; element('blink-capture').hidden = false;
      element('capture-data').textContent = data.split(',')[1]!;
      element('capture-info').textContent = JSON.stringify({ face: status, animation: live!.getAnimationStatus() }, null, 2);
      element('capture-status').textContent = 'Quadro do piscar automático capturado.';
      cancelCapture(); cancelCapture = null;
    });
  });
});
window.addEventListener('pagehide', () => { cancelCapture?.(); live?.dispose(); }, { once: true });
void run();
