import '../src/styles/base.css';
import '../src/styles/layout.css';
import '../src/styles/chat.css';
import { ConversationStore } from '../src/app/ConversationStore';
import { MockChatProvider } from '../src/chat/MockChatProvider';
import { createFailingChatProvider } from '../src/dev/MockChatFailure';
import { ChatView } from '../src/ui/ChatView';

if (!import.meta.env.DEV) throw new Error('Demonstração disponível somente em desenvolvimento.');
const element = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const store = new ConversationStore();
const provider = new MockChatProvider();
const failingProvider = createFailingChatProvider();
const listeners = new AbortController();
const errorToggle = element<HTMLInputElement>('simulate-error');
const toggle = element<HTMLButtonElement>('toggle');
const cancel = element<HTMLButtonElement>('cancel');
const complete = element<HTMLButtonElement>('complete');
let active: { id: number; controller: AbortController } | null = null;
let open = true;
let disposed = false;
const phases: string[] = [];

function setOpen(value: boolean): void {
  open = value; chat.setOpen(open); toggle.textContent = open ? 'Fechar conversa' : 'Abrir conversa';
  toggle.setAttribute('aria-expanded', String(open));
  if (!open) toggle.focus();
}
const chat = new ChatView(element('chat-panel'), {
  onSubmit: text => { void submit(text); }, onReset: () => { abort(); store.reset(); chat.setDraft(''); chat.focusInput(); },
  onClose: () => setOpen(false),
});
chat.setAvailable(true);
const unsubscribe = store.subscribe(state => {
  phases.push(state.phase); if (phases.length > 20) phases.shift();
  chat.renderMessages(state.messages); chat.setState(state.phase, state.error);
  cancel.disabled = state.activeRequestId === null; complete.disabled = state.phase !== 'revealing';
  element('domain-status').textContent = `Estado: ${state.phase} · Solicitação ativa: ${state.activeRequestId ?? 'nenhuma'}`;
  element('domain-state').textContent = JSON.stringify({ snapshot: state, transitions: phases }, null, 2);
});

function abort(): void { const previous = active; active = null; previous?.controller.abort(); }
async function submit(text: string): Promise<void> {
  const id = store.begin(text); if (id === null || store.getSnapshot().activeRequestId !== id) return;
  const controller = new AbortController(); active = { id, controller }; chat.setDraft('');
  const selected = errorToggle.checked ? failingProvider : provider; errorToggle.checked = false;
  try { store.receive(id, await selected.reply(text, controller.signal)); }
  catch (error) {
    if (disposed) return;
    if (error instanceof Error && error.name === 'AbortError') store.cancel(id);
    else store.fail(id, error instanceof Error ? error.message : 'Falha local. Tente novamente.');
    if (active?.id === id) active = null;
  }
}
toggle.addEventListener('click', () => setOpen(!open), { signal: listeners.signal });
cancel.addEventListener('click', () => {
  const id = active?.id; abort(); if (id !== undefined) store.cancel(id);
}, { signal: listeners.signal });
complete.addEventListener('click', () => {
  const id = active?.id; if (id !== undefined && store.complete(id)) active = null;
}, { signal: listeners.signal });
const dispose = (): void => {
  if (disposed) return;
  disposed = true; abort(); unsubscribe(); listeners.abort(); chat.dispose(); store.dispose();
};
window.addEventListener('pagehide', dispose, { once: true });
if (import.meta.hot) import.meta.hot.dispose(dispose);
