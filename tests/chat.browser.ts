import '../src/styles/base.css';
import '../src/styles/layout.css';
import '../src/styles/chat.css';
import type { ChatMessage } from '../src/app/contracts';
import { ChatView, MAX_MESSAGE_LENGTH } from '../src/ui/ChatView';
import { ControlsView } from '../src/ui/ControlsView';
import { mountChatDemo } from '../src/dev/ChatDemo';

if (!import.meta.env.DEV) throw new Error('Verificação exclusiva do desenvolvimento.');
const element = (id: string): HTMLElement => document.getElementById(id)!;
const results: { name: string; passed: boolean; details: unknown }[] = [];
const check = (name: string, passed: boolean, details: unknown = null): void => { results.push({ name, passed, details }); };
const host = element('test-host');
const panel = document.createElement('aside'), toolbar = document.createElement('div');
panel.className = 'interface-panel'; panel.style.width = '360px'; panel.style.maxWidth = '100%';
host.append(toolbar, panel);
const events: { type: string; value?: unknown }[] = [];
let controls: ControlsView;
const chat = new ChatView(panel, {
  onSubmit: text => events.push({ type: 'submit', value: text }), onReset: () => events.push({ type: 'reset' }),
  onClose: () => { events.push({ type: 'close' }); chat.setOpen(false); controls.setOpen(false); controls.focusToggle(); },
});
controls = new ControlsView(toolbar, panel.id, {
  onToggle: open => { events.push({ type: open ? 'open' : 'close' }); chat.setOpen(open); controls.setOpen(open); },
  onQuality: value => events.push({ type: 'quality', value }), onReducedMotion: value => events.push({ type: 'motion', value }),
});
const input = panel.querySelector('textarea')!;
const send = panel.querySelector<HTMLButtonElement>('[type="submit"]')!;
const reset = panel.querySelector<HTMLButtonElement>('[data-reset]')!;
const close = panel.querySelector<HTMLButtonElement>('[data-close]')!;
const toggle = toolbar.querySelector('button')!;
const quality = toolbar.querySelector('select')!, motion = toolbar.querySelector('input')!;
const history = panel.querySelector<HTMLElement>('.chat-history')!;
const form = panel.querySelector('form')!;
const enter = (options: KeyboardEventInit = {}): KeyboardEvent => {
  const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, ...options });
  input.dispatchEvent(event); return event;
};

try {
  check('Chat DOM independente de canvas', input instanceof HTMLTextAreaElement && panel.querySelector('[role="log"]') !== null && document.querySelector('canvas') === null);
  chat.setDraft('rascunho inicial');
  check('Produção começa com envio/reinício e preferências indisponíveis', send.disabled && reset.disabled && quality.disabled && motion.disabled
    && panel.textContent!.includes('Envio em preparação.') && toolbar.textContent!.includes('Preferências em preparação.'));
  enter(); check('Envio indisponível não emite intenção', events.length === 0 && chat.getDraft() === 'rascunho inicial');
  chat.setAvailable(true); controls.setEnabled(true);
  chat.setDraft(' \n\t '); const emptyEvent = enter();
  check('Entrada vazia é rejeitada com orientação', emptyEvent.defaultPrevented && send.disabled && events.length === 0 && !panel.querySelector<HTMLElement>('.chat-validation')!.hidden);
  chat.setDraft('  olá\nmundo  '); const validEvent = enter();
  check('Enter emite mensagem completa normalizada', validEvent.defaultPrevented && events.at(-1)?.value === 'olá\nmundo');
  check('View preserva rascunho até decisão da coordenação', chat.getDraft() === '  olá\nmundo  ');
  let count = events.length;
  const shift = enter({ shiftKey: true });
  check('Shift+Enter libera quebra de linha sem envio', !shift.defaultPrevented && events.length === count);
  const composing = enter({ isComposing: true }); const legacyComposition = enter({ keyCode: 229 });
  check('Enter durante composição IME não envia', !composing.defaultPrevented && !legacyComposition.defaultPrevented && events.length === count);
  input.focus(); input.setSelectionRange(2, 5);
  const selection = [input.selectionStart, input.selectionEnd];
  const draft = chat.getDraft();
  for (const phase of ['waiting', 'revealing', 'error', 'idle'] as const) {
    chat.setState(phase, phase === 'error' ? '<b>Erro de demonstração</b>' : '');
    check(`${phase}: preserva texto, seleção e foco`, chat.getDraft() === draft && document.activeElement === input
      && input.selectionStart === selection[0] && input.selectionEnd === selection[1]);
    if (phase === 'waiting' || phase === 'revealing') {
      count = events.length; enter(); send.click();
      check(`${phase}: bloqueia envio e permite continuar digitando/reiniciar`, events.length === count && send.disabled && !input.disabled && !reset.disabled);
    }
    if (phase === 'error') check('Erro é texto literal em região de alerta', panel.querySelector('.chat-error')!.textContent === '<b>Erro de demonstração</b>' && panel.querySelector('.chat-error b') === null);
  }
  chat.setDraft('a'.repeat(MAX_MESSAGE_LENGTH + 100));
  check('API limita rascunho e textarea declara maxlength', chat.getDraft().length === MAX_MESSAGE_LENGTH && input.maxLength === MAX_MESSAGE_LENGTH);
  chat.setDraft('a'.repeat(MAX_MESSAGE_LENGTH - 1) + '😀');
  check('Truncamento não deixa metade de emoji', chat.getDraft().length === MAX_MESSAGE_LENGTH - 1 && !/[\uD800-\uDBFF]$/.test(chat.getDraft()));
  input.value = 'b'.repeat(MAX_MESSAGE_LENGTH + 20); count = events.length; enter();
  check('Submissão defensiva rejeita texto maior que o limite', events.length === count && !panel.querySelector<HTMLElement>('.chat-validation')!.hidden);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  check('Evento input aplica limite e atualiza contador', input.value.length === MAX_MESSAGE_LENGTH && panel.textContent!.includes(`${MAX_MESSAGE_LENGTH}/${MAX_MESSAGE_LENGTH}`));
  const markup = '<img src=x onerror="alert(1)"><script>alert(1)</script><b>Texto</b>\nLinha seguinte';
  const first: ChatMessage = { id: 'safe', role: 'assistant', text: markup };
  chat.renderMessages([first]);
  check('Tags HTML são texto; nenhum elemento executável é criado', panel.querySelector('.chat-text')!.textContent === markup
    && panel.querySelector('.chat-messages img, .chat-messages script, .chat-messages b') === null);
  const node = panel.querySelector('.chat-message'); chat.renderMessages([first]); chat.setState('waiting');
  check('Snapshots e estados não recriam mensagem nem textarea', node === panel.querySelector('.chat-message') && input === panel.querySelector('textarea'));
  const messages: ChatMessage[] = Array.from({ length: 25 }, (_, index) => ({ id: `message-${index}`, role: index % 2 ? 'user' : 'assistant', text: `Mensagem ${index}\n${'conteúdo longo '.repeat(20)}` }));
  chat.renderMessages(messages);
  check('Nova conversa acompanha o final quando já estava no final', Math.abs(history.scrollHeight - history.clientHeight - history.scrollTop) < 2);
  history.scrollTop = 30;
  chat.renderMessages([...messages, { id: 'new', role: 'assistant', text: 'Nova mensagem sem roubar a leitura.' }]);
  check('Novas mensagens preservam leitura de histórico antigo', Math.abs(history.scrollTop - 30) < 1);
  const longMessage: ChatMessage = { id: 'long', role: 'assistant', text: 'x'.repeat(4000) };
  chat.renderMessages([...messages, longMessage]);
  check('Mensagem longa sem espaços não causa rolagem horizontal', history.scrollWidth <= history.clientWidth + 1);
  chat.setState('idle'); chat.setDraft('rascunho preservado'); input.focus();
  close.click();
  check('Fechar emite evento, oculta painel e devolve foco ao botão externo', events.at(-1)?.type === 'close' && panel.hidden
    && document.activeElement === toggle && toggle.getAttribute('aria-expanded') === 'false');
  chat.renderMessages([...messages, longMessage, { id: 'hidden-update', role: 'assistant', text: 'Atualização com painel fechado.' }]);
  toggle.click();
  check('Reabrir preserva mensagens, rascunho, rolagem e foco de escrita', events.at(-1)?.type === 'open' && !panel.hidden && chat.getDraft() === 'rascunho preservado'
    && panel.textContent!.includes('Atualização com painel fechado.') && Math.abs(history.scrollTop - 30) < 1 && document.activeElement === input);
  check('Controles têm rótulos e relação de expansão acessíveis', input.labels!.length === 1 && quality.labels!.length === 1 && motion.labels!.length === 1
    && toggle.getAttribute('aria-controls') === panel.id && toggle.getAttribute('aria-expanded') === 'true');
  check('Campo de escrita tem foco visível', getComputedStyle(input).outlineStyle !== 'none' && parseFloat(getComputedStyle(input).outlineWidth) >= 2);
  quality.value = 'economy'; quality.dispatchEvent(new Event('change', { bubbles: true }));
  motion.checked = true; motion.dispatchEvent(new Event('change', { bubbles: true }));
  check('Qualidade e movimento emitem valores tipados', events.at(-2)?.type === 'quality' && events.at(-2)?.value === 'economy'
    && events.at(-1)?.type === 'motion' && events.at(-1)?.value === true);
  const beforeReset = chat.getDraft(); reset.click();
  check('Reinício emite intenção sem apagar dados por conta própria', events.at(-1)?.type === 'reset' && chat.getDraft() === beforeReset);
  count = events.length; chat.dispose(); controls.dispose(); chat.dispose(); controls.dispose();
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); reset.click(); close.click(); toggle.click();
  quality.dispatchEvent(new Event('change')); motion.dispatchEvent(new Event('change'));
  chat.renderMessages([first]); chat.setState('idle'); chat.setDraft('tardio'); chat.setOpen(false);
  check('Descarte idempotente remove DOM/listeners e ignora trabalho tardio', events.length === count && panel.children.length === 0 && toolbar.children.length === 0);
} catch (error) { check('Execução sem exceção inesperada', false, String(error)); }
finally { chat.dispose(); controls.dispose(); host.replaceChildren(); }

let demo: ReturnType<typeof mountChatDemo> | null = null;
let demoControls: ControlsView;
const demoPanel = element('demo-panel');
const demoChat = new ChatView(demoPanel, {
  onSubmit: text => demo?.submit(text), onReset: () => demo?.reset(),
  onClose: () => { demoChat.setOpen(false); demoControls.setOpen(false); demoControls.focusToggle(); demo?.record('close'); },
});
demoControls = new ControlsView(element('demo-controls'), demoPanel.id, {
  onToggle: open => { demoChat.setOpen(open); demoControls.setOpen(open); demo?.record(open ? 'open' : 'close'); },
  onQuality: value => demo?.record('quality', value), onReducedMotion: value => demo?.record('reduced-motion', value),
});
demo = mountChatDemo(demoChat, demoControls, element('demo-fixture'));
element('summary').textContent = `${results.filter(result => result.passed).length}/${results.length} verificações passaram.`;
element('results').textContent = JSON.stringify(results, null, 2);
window.addEventListener('pagehide', () => { demo?.dispose(); demoChat.dispose(); demoControls.dispose(); }, { once: true });
