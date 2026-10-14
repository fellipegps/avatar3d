import type { ChatMessage, ConversationPhase } from '../app/contracts';
import type { ChatView } from '../ui/ChatView';
import type { ControlsView } from '../ui/ControlsView';

/** Fixture de layout/eventos. Não simula provider ou conversa de domínio. */
export function mountChatDemo(chat: ChatView, controls: ControlsView, container: HTMLElement) {
  const initial: ChatMessage[] = [
    { id: 'demo-intro', role: 'assistant', text: 'Olá! Este é um exemplo da interface da conversa.' },
    { id: 'demo-text', role: 'user', text: 'Texto seguro: <b>olá</b> aparece literalmente.\nAs mensagens também podem ter mais de uma linha.' },
  ];
  let messages = [...initial];
  let nextMessage = 0;
  let disposed = false;
  const events: object[] = [];
  const listeners = new AbortController();
  container.className = 'chat-demo';
  container.innerHTML = `<p>Demonstração da interface · Respostas não conectadas. Preferências ainda não aplicadas à cena.</p>
    <label>Estado visual <select><option value="idle">Pronto</option><option value="waiting">Espera</option><option value="revealing">Apresentação</option><option value="error">Erro</option><option value="unavailable">Envio indisponível</option></select></label>
    <details><summary>Eventos da demonstração</summary><pre></pre></details>`;
  const output = container.querySelector('pre')!;
  const record = (event: string, value?: unknown): void => {
    if (disposed) return;
    events.push({ event, value }); output.textContent = JSON.stringify(events.slice(-12), null, 2);
  };
  container.querySelector('select')!.addEventListener('change', event => {
    const value = (event.target as HTMLSelectElement).value;
    chat.setAvailable(value !== 'unavailable', 'Envio indisponível nesta demonstração.');
    chat.setState(value === 'unavailable' ? 'idle' : value as ConversationPhase,
      value === 'error' ? 'Erro de demonstração. Seu rascunho foi preservado.' : '');
    record('visual-state', value);
  }, { signal: listeners.signal });
  chat.renderMessages(messages); chat.setAvailable(true); chat.setState('idle', 'Demonstração · Envio gera apenas um evento local.');
  controls.setEnabled(true, 'Demonstração de preferências.');
  return {
    record,
    submit(text: string): void {
      if (disposed) return;
      record('submit', text); messages.push({ id: `demo-user-${++nextMessage}`, role: 'user', text });
      chat.renderMessages(messages); chat.setDraft(''); chat.setState('waiting', 'Evento recebido · Selecione outro estado visual para continuar.');
      container.querySelector('select')!.value = 'waiting';
    },
    reset(): void {
      if (disposed) return;
      record('reset'); messages = [...initial]; chat.renderMessages(messages); chat.setDraft(''); chat.setState('idle');
      container.querySelector('select')!.value = 'idle'; chat.focusInput();
    },
    dispose(): void { disposed = true; listeners.abort(); container.replaceChildren(); },
  };
}
