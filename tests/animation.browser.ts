import '../src/styles/base.css';
import { Mesh, VectorKeyframeTrack, NumberKeyframeTrack, Quaternion } from 'three';
import type { CharacterState } from '../src/app/contracts';
import { loadCharacter } from '../src/scene/AssetLoader';
import { CharacterController } from '../src/scene/CharacterController';
import { characterManifest } from '../src/scene/character.manifest';
import { SceneController } from '../src/scene/SceneController';

if (!import.meta.env.DEV) throw new Error('Verificação exclusiva do desenvolvimento.');
const results: { name: string; passed: boolean; details: unknown }[] = [];
const check = (name: string, passed: boolean, details: unknown = null): void => { results.push({ name, passed, details }); };
const element = (id: string): HTMLElement => document.getElementById(id)!;
const fixture = element('fixture');
let live: SceneController | null = null;
let stopRecording: (() => void) | null = null;
let videoUrl: string | null = null;

async function run(): Promise<void> {
  const asset = await loadCharacter(characterManifest, new AbortController().signal);
  let character: CharacterController | null = null;
  try {
    for (const kind of ['missing', 'face'] as const) {
      const animations = asset.gltf.animations.map(clip => clip.clone());
      if (kind === 'missing') animations.splice(1, 1);
      else animations[0]!.tracks.push(new NumberKeyframeTrack('VitaFace.morphTargetInfluences[0]', [0, 1], [0, 1]));
      try {
        new CharacterController({ ...asset, gltf: { ...asset.gltf, animations } }, characterManifest);
        check(`Rejeitar ${kind}`, false);
      } catch (error) {
        check(kind === 'missing' ? 'Clipe ausente não usa fallback silencioso' : 'Clipe facial é rejeitado na fronteira corporal',
          String(error).includes(kind === 'missing' ? 'Clipe ausente' : 'controles faciais'), String(error));
      }
    }
    // Introduzir root motion controlado sem alterar o GLB ou seus clipes originais.
    const originals = asset.gltf.animations;
    const animated = originals.map(clip => {
      const copy = clip.clone();
      copy.tracks.push(new VectorKeyframeTrack('Root.position', [0, 1], [0, 0, 0, 3, 2, -4]),
        new VectorKeyframeTrack('J_Bip_C_Hips.position', [0, 1], [0, 1, 0, 2, 3, 4]),
        new VectorKeyframeTrack('.position', [0, 1], [0, 0, 0, 4, 5, 6]));
      return copy;
    });
    character = new CharacterController({ ...asset, gltf: { ...asset.gltf, animations: animated } }, characterManifest);
    const root = asset.gltf.scene;
    const anchor = root.position.clone(), scale = root.scale.clone(), facing = root.quaternion.clone();
    const hips = root.getObjectByName('J_Bip_C_Hips')!, motionRoot = root.getObjectByName('Root')!;
    const hipPosition = hips.position.clone(), rootPosition = motionRoot.position.clone();
    const head = root.getObjectByName('J_Bip_C_Head')!, arm = root.getObjectByName('J_Bip_L_UpperArm')!;
    const joints = [head, arm];
    const pose = (): Quaternion[] => joints.map(joint => joint.quaternion.clone());
    // Comandos sem avanço de tempo devem preservar componentes exatamente; angleTo pressupõe normalização perfeita.
    const equal = (before: Quaternion[]): boolean => joints.every((joint, index) => joint.quaternion.equals(before[index]!));
    const advance = (seconds: number): void => { for (let i = 0; i < Math.round(seconds * 120); i++) character!.update(1 / 120); };
    const status = () => character!.getAnimationStatus();
    const weight = (state: CharacterState): number => status().actions.find(action => action.state === state)!.weight;
    check('Inicialização aplica idle sem T-pose', weight('idle') === 1 && status().actions[0]!.running);
    character.update(0.4);
    const idleTime = status().actions[0]!.time;
    for (let i = 0; i < 30; i++) character.setState('idle');
    character.update(0.05);
    check('Repetir estado não reinicia tempo nem cria transição', Math.abs(status().actions[0]!.time - idleTime - 0.05) < 1e-8 && !status().transitioning);

    const before = pose(); character.setState('thinking');
    check('Comando de troca preserva a pose instantânea', equal(before) && status().transitioning);
    advance(0.15);
    check('Metade da transição mistura os dois estados com pesos normalizados', Math.abs(weight('idle') - 0.5) < 1e-6 && Math.abs(weight('thinking') - 0.5) < 1e-6);
    const mid = pose(); const weightsBefore = status().actions.map(action => action.weight);
    character.setState('responding');
    check('Interromper mistura preserva pose e contribuições correntes', equal(mid)
      && status().actions.every((action, index) => Math.abs(action.weight - weightsBefore[index]!) < 1e-8));
    advance(0.1);
    const respondingTime = status().actions[2]!.time;
    character.setState('responding');
    advance(0.1);
    check('Comando repetido durante transição não reinicia o fade ou o clipe', Math.abs(status().actions[2]!.time - respondingTime - 0.1) < 1e-8);
    advance(0.15);
    check('Responder conclui blend e para as ações que saíram', !status().transitioning && weight('responding') === 1
      && status().actions.filter(action => action.running).length === 1);
    advance(8);
    check('Estado sustentado atravessa vários ciclos até comando seguinte', status().targetState === 'responding' && weight('responding') === 1 && status().actions[2]!.running);

    let maxJointStep = 0, normalized = true, stable = true, commandContinuous = true;
    for (let i = 0; i < 120; i++) {
      const current = pose();
      if (i % 5 === 0) {
        character.setState((['idle', 'thinking', 'responding'] as const)[(i / 5) % 3]!);
        commandContinuous &&= equal(current);
      }
      character.update(1 / 60);
      maxJointStep = Math.max(maxJointStep, ...joints.map((joint, index) => joint.quaternion.angleTo(current[index]!)));
      normalized &&= Math.abs(status().actions.reduce((sum, action) => sum + action.weight, 0) - 1) < 1e-6;
      stable &&= root.position.distanceTo(anchor) < 1e-9 && hips.position.distanceTo(hipPosition) < 1e-9
        && motionRoot.position.distanceTo(rootPosition) < 1e-9 && root.scale.distanceTo(scale) < 1e-9 && root.quaternion.angleTo(facing) < 1e-7;
    }
    check('Trocas rápidas mantêm soma dos pesos e continuidade sem salto', commandContinuous && normalized && maxJointStep < 0.08, { maxJointStepRadians: maxJointStep });
    check('Root motion incompatível removido; posição, escala e orientação estáveis', stable);
    check('Filtragem não modifica os clipes de origem', animated.every((clip, index) => clip.tracks.length === originals[index]!.tracks.length + 3));
    character.setState('idle'); advance(0.4);
    check('Encerrar resposta retorna ao repouso em 0,3 s', status().targetState === 'idle' && weight('idle') === 1 && !status().transitioning);

    character.setState('thinking'); advance(0.1);
    character.setReducedMotion(true);
    const frozen = pose(), frozenTime = status().actions.map(action => action.time);
    character.setState('responding'); character.setState('idle'); character.setState('responding');
    character.update(5);
    check('Movimento reduzido congela pose/fade e guarda somente comando mais recente', equal(frozen) && status().requestedState === 'responding'
      && status().actions.every((action, index) => action.time === frozenTime[index]));
    character.setReducedMotion(false);
    check('Retomada começa da pose congelada sem salto', equal(frozen));
    advance(0.4);
    check('Retomada conclui o estado solicitado', status().targetState === 'responding' && weight('responding') === 1 && !status().transitioning);
    const face = root.getObjectByName('VitaFace') as Mesh;
    character.setBlink(0.8); character.setMouthOpen(0.6);
    character.setState('idle'); advance(0.4);
    check('Misturas corporais preservam olhos e boca independentes', face.morphTargetInfluences![face.morphTargetDictionary![characterManifest.face.blink]!] === 0.8
      && face.morphTargetInfluences![face.morphTargetDictionary![characterManifest.face.mouth]!] === 0.6);
    const finalPose = pose(); character.update(NaN); character.update(-1); character.update(Infinity);
    check('Delta inválido não corrompe animação', equal(finalPose));
    character.dispose(); character.dispose(); character.setState('thinking'); character.update(1);
    check('Descarte interrompe ações e ignora comandos tardios', status().disposed && status().actions.every(action => !action.running) && root.children.length === 0);
  } catch (error) { check('Execução sem exceção inesperada', false, String(error)); }
  finally { character?.dispose(); asset.dispose(); }

  live = new SceneController(fixture);
  live.setCharacterState('thinking');
  await live.loadCharacter();
  check('Comando anterior à carga é preservado no controlador da cena', live.getAnimationStatus()?.requestedState === 'thinking');
  live.setCharacterState('idle');
  element('results').textContent = JSON.stringify(results, null, 2);
  element('summary').textContent = `${results.filter(result => result.passed).length}/${results.length} checks passaram`;
  (element('record') as HTMLButtonElement).disabled = false;
  element('record-status').textContent = 'Pronto para gravar 8 segundos: sequência normal, trocas rápidas e retorno ao repouso.';
}

element('record').addEventListener('click', () => {
  if (!live || stopRecording) return;
  const canvas = fixture.querySelector('canvas')!;
  const stream = canvas.captureStream(30);
  const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8'].find(type => MediaRecorder.isTypeSupported(type));
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 2500000 } : undefined);
  const chunks: Blob[] = [];
  const timeline: readonly [number, CharacterState][] = [[0, 'idle'], [1, 'thinking'], [2.3, 'responding'], [3.8, 'idle'],
    [5, 'thinking'], [5.1, 'responding'], [5.2, 'idle'], [5.3, 'thinking'], [5.4, 'responding'], [6.7, 'idle']];
  let elapsed = 0, next = 0, frames = 0;
  const commands: object[] = [];
  live.setReducedMotion(false);
  const unsubscribe = live.registerUpdater(delta => {
    elapsed += delta; frames++;
    while (next < timeline.length && elapsed >= timeline[next]![0]) {
      const [at, state] = timeline[next++]!;
      live!.setCharacterState(state); commands.push({ at, observedAt: elapsed, state });
      element('record-status').textContent = `Gravando · ${state} · ${elapsed.toFixed(1)} s`;
    }
    if (elapsed >= 8) stopRecording?.();
  });
  stopRecording = () => { unsubscribe(); recorder.stop(); stream.getTracks().forEach(track => track.stop()); stopRecording = null; };
  recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: recorder.mimeType });
    const video = element('video') as HTMLVideoElement;
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    videoUrl = URL.createObjectURL(blob);
    video.src = videoUrl; video.hidden = false;
    const reader = new FileReader();
    reader.onload = () => {
      element('video-data').textContent = String(reader.result).split(',')[1]!;
      element('record-info').textContent = JSON.stringify({ mimeType: blob.type, bytes: blob.size, elapsed, frames, commands }, null, 2);
      element('record-status').textContent = 'Vídeo de transições pronto.';
    };
    reader.readAsDataURL(blob);
  };
  recorder.start();
});
window.addEventListener('pagehide', () => {
  stopRecording?.(); live?.dispose();
  if (videoUrl) URL.revokeObjectURL(videoUrl);
}, { once: true });
void run();
