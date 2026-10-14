import '../src/styles/base.css';
import '../src/styles/layout.css';
import '../src/styles/chat.css';
import { AppController } from '../src/app/AppController';
import type { AppScene } from '../src/app/AppController';
import type { ChatProvider, ChatReply, CharacterState } from '../src/app/contracts';
import { ConversationStore } from '../src/app/ConversationStore';
import { MockChatProvider } from '../src/chat/MockChatProvider';
import { createFailingChatProvider } from '../src/dev/MockChatFailure';
import { SceneController } from '../src/scene/SceneController';

if (!import.meta.env.DEV) throw new Error('Verificação somente em desenvolvimento.');
const element = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const results: { name: string; passed: boolean; details?: unknown }[] = [];
const check = (name: string, passed: boolean, details?: unknown): void => { results.push({ name, passed, details }); };
const flush = async (): Promise<void> => { for (let i = 0; i < 6; i++) await Promise.resolve(); };
class Clock {
  now = 0; next = 0;
  tasks = new Map<number, { at: number; callback: () => void }>();
  schedule = (callback: () => void, delay: number): (() => void) => {
    const id = ++this.next; this.tasks.set(id, { at: this.now + delay, callback }); return () => { this.tasks.delete(id); };
  };
  advance(ms: number): void {
    const target = this.now + ms;
    while (true) {
      const next = [...this.tasks].filter(([, task]) => task.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      this.now = next[1].at; this.tasks.delete(next[0]); next[1].callback();
    }
    this.now = target;
  }
}
class ControlledProvider implements ChatProvider {
  requests: { signal: AbortSignal; resolve(reply: ChatReply): void; reject(error: Error): void }[] = [];
  reply(_text: string, signal: AbortSignal): Promise<ChatReply> {
    // Deliberadamente ignora aborto: o coordenador também precisa rejeitar resultados antigos.
    return new Promise((resolve, reject) => this.requests.push({ signal, resolve, reject }));
  }
}
function fixture(throwScene = false) {
  const host = document.createElement('section');
  host.innerHTML = '<nav></nav><div class="app-layout"><div data-scene></div><aside class="interface-panel" style="width:400px"></aside></div><p data-status></p><p data-fallback hidden></p>';
  element('test-host').append(host);
  const find = <T extends HTMLElement>(selector: string): T => host.querySelector<T>(selector)!;
  const clock = new Clock(), provider = new ControlledProvider(), store = new ConversationStore();
  const states: CharacterState[] = [], preferences: unknown[] = [];
  let resets = 0, disposed = 0, created = 0, changes = 0;
  const scene: AppScene = {
    availability: { available: false, message: '3D simulado indisponível.' },
    loadCharacter: async () => { throw new Error('Não deve carregar.'); },
    setCharacterState: state => { states.push(state); }, setMouthOpen: () => {}, resetFace: () => { resets++; },
    setQuality: value => { preferences.push(value); }, setReducedMotion: value => { preferences.push(value); }, dispose: () => { disposed++; },
  };
  store.subscribe(() => changes++);
  const app = new AppController(find('[data-scene]'), find('[data-status]'), find('[data-fallback]'), {
    ui: { panel: find('aside'), toolbar: find('nav'), layout: find('.app-layout') }, provider, store,
    createScene: () => { created++; if (throwScene) throw new Error('GPU ausente'); return scene; },
    presentation: { now: () => clock.now, schedule: clock.schedule }, inspector: false,
  });
  app.setReducedMotion(false);
  return { app, clock, provider, store, states, preferences, find, counts: () => ({ resets, disposed, created, changes }),
    dispose: () => { app.dispose(); host.remove(); } };
}
const answer = (id: string, text = 'Resposta completa com acentos e emoji 🙂. '.repeat(3)): ChatReply => ({ id, text });

async function run(): Promise<void> {
  let f = fixture();
  try {
    const pending = f.app.submit('olá');
    const input = f.find<HTMLTextAreaElement>('textarea'); input.focus(); input.value = 'próximo rascunho'; input.dispatchEvent(new Event('input'));
    await f.app.submit('segunda');
    check('Envio inicia thinking/waiting, permite digitar e bloqueia segunda solicitação', f.states.at(-1) === 'thinking'
      && f.store.getSnapshot().phase === 'waiting' && f.provider.requests.length === 1 && f.find<HTMLButtonElement>('[type=submit]').disabled && !input.disabled);
    f.provider.requests[0]!.resolve(answer('one')); await flush();
    check('Resposta entra completa no store e começa vazia na UI, com responding', f.states.at(-1) === 'responding'
      && f.store.getSnapshot().phase === 'revealing' && f.store.getSnapshot().messages[1]!.text === answer('one').text
      && f.find('.chat-message-assistant .chat-text').textContent === '');
    const changes = f.counts().changes; f.clock.advance(160);
    const partial = f.find('.chat-message-assistant .chat-text').textContent!;
    check('Apresentação gradual não grava letras no store nem perde rascunho/foco', partial.length > 0 && partial.length < answer('one').text.length
      && f.counts().changes === changes && input.value === 'próximo rascunho' && document.activeElement === input);
    f.app.setPanelOpen(false); f.clock.advance(160); f.app.setPanelOpen(true);
    check('Fechar/reabrir durante apresentação preserva nós, histórico e rascunho', f.find('textarea') === input && input.value === 'próximo rascunho'
      && f.store.getSnapshot().messages.length === 2 && f.counts().created === 1);
    f.clock.advance(10000); await pending;
    check('Fluxo completa idle → thinking → responding → idle e libera envio', f.states.join(',') === 'idle,thinking,responding,idle'
      && f.store.getSnapshot().phase === 'idle' && !f.find<HTMLButtonElement>('[type=submit]').disabled && f.clock.tasks.size === 0);
    f.find<HTMLSelectElement>('select').value = 'economy'; f.find('select').dispatchEvent(new Event('change'));
    const motion = f.find<HTMLInputElement>('input[type=checkbox]'); motion.checked = true; motion.dispatchEvent(new Event('change'));
    check('Controles aplicam qualidade e movimento sem recriar cena', f.preferences.slice(-2).join(',') === 'economy,true' && f.counts().created === 1);
    f.dispose(); f = fixture();

    const old = f.app.submit('antiga'); f.app.reset(); const fresh = f.app.submit('nova');
    f.provider.requests[0]!.resolve(answer('old')); await old;
    check('Reset aborta sinal; resolução e finally antigos não alteram nova espera', f.provider.requests[0]!.signal.aborted
      && f.store.getSnapshot().phase === 'waiting' && f.store.getSnapshot().messages.length === 1 && f.store.getSnapshot().messages[0]!.text === 'nova');
    f.provider.requests[1]!.resolve(answer('new')); await flush(); f.clock.advance(10000); await fresh;
    check('Nova solicitação conclui após descarte de resultado antigo', f.store.getSnapshot().phase === 'idle' && f.store.getSnapshot().messages[1]!.id === 'new');
    f.dispose(); f = fixture();

    const racing = f.app.submit('resolvida antes de reset'); f.provider.requests[0]!.resolve(answer('racing'));
    f.app.reset(); await racing;
    check('Corrida reset entre resolução e microtask não insere resposta', f.store.getSnapshot().messages.length === 0 && f.states.at(-1) === 'idle' && f.clock.tasks.size === 0);
    f.dispose(); f = fixture();

    const presentation = f.app.submit('cancelar texto'); f.provider.requests[0]!.resolve(answer('partial')); await flush(); f.clock.advance(160);
    f.app.reset(); const next = f.app.submit('depois'); await presentation; f.clock.advance(10000);
    check('Reset na apresentação remove timer, texto parcial e efeitos tardios', f.clock.tasks.size === 0 && f.store.getSnapshot().messages.length === 1
      && f.store.getSnapshot().phase === 'waiting' && f.find('.chat-messages').children.length === 1 && f.counts().resets >= 2);
    f.provider.requests[1]!.reject(new Error('falha atual')); await next;
    check('Erro atual retorna personagem/rosto a repouso, mostra recuperação e libera envio', f.states.at(-1) === 'idle'
      && f.store.getSnapshot().phase === 'error' && !f.find('.chat-error').hidden && f.store.getSnapshot().activeRequestId === null);
    const recovery = f.app.submit('recuperar'); f.provider.requests[2]!.resolve(answer('recovery')); await flush(); f.clock.advance(10000); await recovery;
    check('Envio depois do erro recupera fluxo e remove alerta', f.store.getSnapshot().phase === 'idle' && f.find('.chat-error').hidden === true);
    f.dispose(); f = fixture();

    const rejected = f.app.submit('antiga'); f.app.reset(); const current = f.app.submit('atual');
    f.provider.requests[0]!.reject(new Error('falha antiga')); await rejected;
    check('Rejeição antiga não troca espera atual por erro', f.store.getSnapshot().phase === 'waiting' && f.store.getSnapshot().error === undefined);
    f.app.setReducedMotion(true); f.provider.requests[1]!.resolve(answer('motion')); await current;
    check('Movimento reduzido apresenta texto completo sem timers', f.store.getSnapshot().phase === 'idle' && f.clock.tasks.size === 0
      && f.find('.chat-message-assistant .chat-text').textContent === answer('motion').text);
    f.app.setReducedMotion(false); const mid = f.app.submit('reduzir durante'); f.provider.requests[2]!.resolve(answer('mid')); await flush();
    f.app.setReducedMotion(true); await mid;
    check('Ativar movimento reduzido durante texto conclui e limpa timer', f.clock.tasks.size === 0 && f.store.getSnapshot().phase === 'idle');
    f.dispose(); f = fixture(true);

    const unavailable = f.app.submit('sem renderer'); f.provider.requests[0]!.resolve(answer('no-gpu')); await flush(); f.clock.advance(10000); await unavailable;
    check('Falha de criação do renderer mantém chat completo e fallback', !f.find('[data-fallback]').hidden && f.store.getSnapshot().phase === 'idle'
      && f.store.getSnapshot().messages.length === 2);
    f.dispose(); f = fixture();

    const waitingDispose = f.app.submit('descarte'); f.app.dispose(); f.app.dispose(); f.provider.requests[0]!.resolve(answer('disposed')); await waitingDispose;
    check('Dispose na espera aborta e ignora resposta tardia sem DOM remanescente', f.provider.requests[0]!.signal.aborted && f.find('aside').children.length === 0
      && f.counts().disposed === 1 && f.store.getSnapshot().messages.length === 0);
    f.dispose(); f = fixture();
    const revealingDispose = f.app.submit('descarte parcial'); f.provider.requests[0]!.resolve(answer('disposed-partial')); await flush();
    f.app.dispose(); f.clock.advance(10000); await revealingDispose;
    check('Dispose durante apresentação remove timers/listeners e finalização tardia', f.clock.tasks.size === 0 && f.find('aside').children.length === 0 && f.counts().disposed === 1);
  } catch (error) { check('Execução sem exceção inesperada', false, String(error)); }
  finally { f.dispose(); }
  element('results').textContent = JSON.stringify(results, null, 2);
  element('summary').textContent = results.filter(item => item.passed).length + '/' + results.length + ' verificações passaram.';
  mountLive();
}

function mountLive(): void {
  const store = new ConversationStore(), provider = new MockChatProvider(), failed = createFailingChatProvider();
  const failure = element<HTMLInputElement>('failure');
  let live: SceneController;
  const app = new AppController(element('live-scene'), element('live-status'), element('live-fallback'), {
    ui: { panel: element('live-panel'), toolbar: element('live-controls'), layout: element('live-layout') }, store, inspector: false,
    provider: { reply: (text, signal) => { const selected = failure.checked ? failed : provider; failure.checked = false; return selected.reply(text, signal); } },
    createScene: (container, callback) => { live = new SceneController(container, callback); return live; },
  });
  const timeline: object[] = [];
  store.subscribe(state => {
    const entry = { atMs: Math.round(performance.now()), phase: state.phase, character: live.getAnimationStatus()?.requestedState ?? 'loading', messages: state.messages.length };
    timeline.push(entry); if (timeline.length > 40) timeline.shift();
    element('live-state').textContent = 'Conversa: ' + state.phase + ' · Personagem: ' + entry.character;
    element('timeline').textContent = JSON.stringify(timeline, null, 2);
  });
  const readyCheck = live!.registerUpdater(() => {
    if (!live.getAnimationStatus()) return;
    element<HTMLButtonElement>('record').disabled = false; element('record-status').textContent = 'Pronto para gravar saudação integrada.'; readyCheck();
  });
  let contextControl: WEBGL_lose_context | null = null;
  element('lose-context').addEventListener('click', () => {
    contextControl = element('live-scene').querySelector('canvas')!.getContext('webgl2')!.getExtension('WEBGL_lose_context'); contextControl?.loseContext();
  });
  element('restore-context').addEventListener('click', () => contextControl?.restoreContext());
  mountRecording(app, live!, store);
  window.addEventListener('pagehide', () => { readyCheck(); app.dispose(); }, { once: true });
}

function mountRecording(app: AppController, scene: SceneController, store: ConversationStore): void {
  let stop: (() => void) | null = null, videoUrl = '';
  element('record').addEventListener('click', () => {
    if (stop) return;
    app.reset(); app.setReducedMotion(false);
    const source = element('live-scene').querySelector('canvas')!;
    const canvas = document.createElement('canvas'); canvas.width = 1100; canvas.height = 560;
    const context = canvas.getContext('2d')!;
    const stream = canvas.captureStream(30);
    const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8'].find(type => MediaRecorder.isTypeSupported(type));
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 2500000 } : undefined);
    const chunks: Blob[] = [], phases: object[] = [];
    const started = performance.now(); let sent = false, frames = 0, lastPhase = '';
    const unsubscribe = scene.registerUpdater(() => queueMicrotask(() => {
      if (!stop) return;
      const elapsed = (performance.now() - started) / 1000;
      if (!sent && elapsed > 0.6) { sent = true; void app.submit('Olá!'); }
      const snapshot = store.getSnapshot(), character = scene.getAnimationStatus()?.requestedState;
      if (snapshot.phase !== lastPhase) { phases.push({ at: elapsed, phase: snapshot.phase, character }); lastPhase = snapshot.phase; }
      context.fillStyle = '#0d141c'; context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(source, 0, 50, 700, 460);
      context.font = '20px sans-serif'; context.fillStyle = '#87cfc6';
      context.fillText('Fluxo integrado · cena real + texto apresentado na UI', 20, 30);
      context.fillText(snapshot.phase + ' / ' + character, 720, 65);
      context.font = '17px sans-serif'; context.fillStyle = '#e9eef4';
      let y = 110;
      for (const node of element('live-panel').querySelectorAll('.chat-message')) {
        const author = node.querySelector('.chat-author')!.textContent!;
        const text = node.querySelector('.chat-text')!.textContent!;
        context.fillText(author, 720, y); y += 26;
        let line = '';
        for (const word of text.split(' ')) {
          if (context.measureText(line + word).width > 350) { context.fillText(line, 720, y); y += 25; line = ''; }
          line += word + ' ';
        }
        context.fillText(line, 720, y); y += 45;
      }
      frames++; element('record-status').textContent = 'Gravando fluxo · ' + snapshot.phase;
      if (elapsed >= 5.5) stop?.();
    }));
    stop = () => { unsubscribe(); recorder.stop(); stream.getTracks().forEach(track => track.stop()); stop = null; };
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: recorder.mimeType });
      if (videoUrl) URL.revokeObjectURL(videoUrl); videoUrl = URL.createObjectURL(blob);
      const video = element<HTMLVideoElement>('video'); video.src = videoUrl; video.hidden = false;
      const reader = new FileReader(); reader.onload = () => {
        element('video-data').textContent = String(reader.result).split(',')[1]!;
        element('record-info').textContent = JSON.stringify({ bytes: blob.size, mimeType: blob.type, frames, phases, durationSeconds: (performance.now() - started) / 1000 }, null, 2);
        element('record-status').textContent = 'Vídeo integrado pronto.';
      }; reader.readAsDataURL(blob);
    };
    recorder.start();
  });
  window.addEventListener('pagehide', () => { stop?.(); if (videoUrl) URL.revokeObjectURL(videoUrl); }, { once: true });
}
void run();
