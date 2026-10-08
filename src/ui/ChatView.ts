import type { ChatMessage, ConversationPhase } from '../app/contracts';
import { MAX_MESSAGE_LENGTH } from '../app/contracts';
export { MAX_MESSAGE_LENGTH } from '../app/contracts';
export interface ChatViewEvents {
  onSubmit(text: string): void;
  onReset(): void;
  onClose(): void;
}
let nextId = 0;

/** Camada DOM: recebe snapshots e emite intenções, sem provider, store ou cena. */
export class ChatView {
  private readonly listeners = new AbortController();
  private readonly input: HTMLTextAreaElement;
  private readonly send: HTMLButtonElement;
  private readonly reset: HTMLButtonElement;
  private readonly list: HTMLUListElement;
  private readonly scroller: HTMLElement;
  private readonly empty: HTMLElement;
  private readonly status: HTMLElement;
  private readonly error: HTMLElement;
  private readonly validation: HTMLElement;
  private readonly counter: HTMLElement;
  private readonly form: HTMLFormElement;
  private readonly messages = new Map<string, { item: HTMLLIElement; author: HTMLElement; text: HTMLElement }>();
  private phase: ConversationPhase = 'idle';
  private stateMessage = '';
  private available = false;
  private unavailableMessage = 'Envio em preparação.';
  private open = true;
  private closedScrollTop = 0;
  private closedAtBottom = true;
  private disposed = false;

  constructor(private readonly container: HTMLElement, private readonly events: ChatViewEvents) {
    const prefix = `chat-${++nextId}`;
    if (!container.id) container.id = `${prefix}-panel`;
    container.classList.add('chat-panel');
    container.setAttribute('aria-labelledby', `${prefix}-title`);
    container.innerHTML = `
      <header class="panel-header chat-header">
        <div><h2 id="${prefix}-title">Conversa local</h2><span class="panel-meta">DEMO</span></div>
        <button type="button" class="button-quiet" data-close aria-label="Fechar conversa">Fechar</button>
      </header>
      <div class="chat-history" tabindex="0" aria-label="Histórico da conversa">
        <p class="chat-empty">Sua conversa fica aqui.<br />Escreva uma mensagem para começar.</p>
        <ul class="chat-messages" role="log" aria-label="Mensagens da conversa" aria-live="polite" aria-relevant="additions text"></ul>
      </div>
      <p class="chat-status" role="status"></p><p class="chat-error" role="alert" hidden></p>
      <form class="chat-form" novalidate>
        <label for="${prefix}-input">Mensagem</label>
        <textarea id="${prefix}-input" name="message" rows="3" maxlength="${MAX_MESSAGE_LENGTH}" aria-describedby="${prefix}-help ${prefix}-count" placeholder="Escreva sua mensagem…"></textarea>
        <div class="chat-input-meta"><p id="${prefix}-help">Enter envia · Shift+Enter quebra a linha</p><span id="${prefix}-count"></span></div>
        <p class="chat-validation" role="alert" hidden></p>
        <div class="chat-actions"><button type="button" class="button-quiet" data-reset>Reiniciar conversa</button><button type="submit" class="button-primary">Enviar</button></div>
      </form>`;
    const find = <T extends Element>(selector: string): T => container.querySelector<T>(selector)!;
    this.input = find('textarea'); this.send = find('[type="submit"]'); this.reset = find('[data-reset]');
    this.list = find('.chat-messages'); this.scroller = find('.chat-history'); this.empty = find('.chat-empty');
    this.status = find('.chat-status'); this.error = find('.chat-error'); this.validation = find('.chat-validation');
    this.counter = find(`#${prefix}-count`); this.form = find('form');
    const options = { signal: this.listeners.signal };
    this.form.addEventListener('submit', event => { event.preventDefault(); this.submit(); }, options);
    this.input.addEventListener('keydown', event => {
      if (event.key !== 'Enter' || event.shiftKey || event.isComposing || event.keyCode === 229) return;
      event.preventDefault(); this.submit();
    }, options);
    this.input.addEventListener('input', () => {
      this.limitDraft(); this.validation.hidden = true; this.validation.textContent = ''; this.updateSend();
    }, options);
    this.reset.addEventListener('click', () => { if (this.available) this.events.onReset(); }, options);
    find<HTMLButtonElement>('[data-close]').addEventListener('click', () => this.events.onClose(), options);
    this.updateState();
  }

  private limitDraft(): void {
    let text = this.input.value.slice(0, MAX_MESSAGE_LENGTH);
    // maxlength conta unidades UTF-16; evitar cortar um emoji ao definir o rascunho pela API.
    if (text.length === MAX_MESSAGE_LENGTH && /[\uD800-\uDBFF]$/.test(text)) text = text.slice(0, -1);
    if (this.input.value !== text) this.input.value = text;
  }

  private updateSend(): void {
    this.send.disabled = !this.available || this.phase === 'waiting' || this.phase === 'revealing' || !this.input.value.trim();
    this.counter.textContent = `${this.input.value.length}/${MAX_MESSAGE_LENGTH}`;
  }

  private submit(): void {
    if (this.disposed || !this.available || this.phase === 'waiting' || this.phase === 'revealing') return;
    const text = this.input.value.trim();
    if (!text) {
      this.validation.textContent = 'Escreva uma mensagem antes de enviar.'; this.validation.hidden = false; return;
    }
    if (this.input.value.length > MAX_MESSAGE_LENGTH) {
      this.validation.textContent = `Use até ${MAX_MESSAGE_LENGTH} caracteres.`; this.validation.hidden = false; return;
    }
    // A coordenação decide quando limpar o rascunho ou iniciar a espera.
    this.events.onSubmit(text);
  }

  getDraft(): string { return this.input.value; }
  setDraft(text: string): void {
    if (this.disposed) return;
    this.input.value = text; this.limitDraft(); this.validation.hidden = true; this.validation.textContent = ''; this.updateSend();
  }

  setAvailable(available: boolean, message = 'Envio em preparação.'): void {
    if (this.disposed) return;
    this.available = available; this.unavailableMessage = message; this.updateState();
  }

  setState(phase: ConversationPhase, message = ''): void {
    if (this.disposed) return;
    this.phase = phase; this.stateMessage = message; this.updateState();
  }

  private updateState(): void {
    const busy = this.phase === 'waiting' || this.phase === 'revealing';
    this.form.setAttribute('aria-busy', String(busy));
    this.error.hidden = !this.available || this.phase !== 'error';
    this.error.textContent = this.error.hidden ? '' : this.stateMessage || 'Não foi possível concluir. Tente novamente.';
    this.status.textContent = !this.available ? this.unavailableMessage : this.phase === 'error' ? ''
      : this.stateMessage || (this.phase === 'waiting' ? 'Aguardando resposta…'
        : this.phase === 'revealing' ? 'Apresentando resposta…' : 'Pronto para escrever.');
    this.reset.disabled = !this.available;
    this.updateSend();
  }

  renderMessages(messages: readonly ChatMessage[]): void {
    if (this.disposed) return;
    const atBottom = this.open ? this.scroller.scrollHeight - this.scroller.scrollTop - this.scroller.clientHeight <= 40 : this.closedAtBottom;
    const previousTop = this.open ? this.scroller.scrollTop : this.closedScrollTop;
    const ids = new Set(messages.map(message => message.id));
    for (const [id, entry] of this.messages) {
      if (!ids.has(id)) { entry.item.remove(); this.messages.delete(id); }
    }
    messages.forEach((message, index) => {
      let entry = this.messages.get(message.id);
      if (!entry) {
        const item = document.createElement('li');
        const author = document.createElement('p'), text = document.createElement('p');
        author.className = 'chat-author'; text.className = 'chat-text'; item.append(author, text);
        entry = { item, author, text }; this.messages.set(message.id, entry);
      }
      entry.item.className = `chat-message chat-message-${message.role}`;
      entry.author.textContent = message.role === 'user' ? 'Você' : 'Vita';
      if (entry.text.textContent !== message.text) entry.text.textContent = message.text;
      if (this.list.children[index] !== entry.item) this.list.insertBefore(entry.item, this.list.children[index] ?? null);
    });
    this.empty.hidden = messages.length > 0;
    if (this.open) this.scroller.scrollTop = atBottom ? this.scroller.scrollHeight : previousTop;
    else { this.closedAtBottom = atBottom; this.closedScrollTop = previousTop; }
  }

  setOpen(open: boolean): void {
    if (this.disposed || open === this.open) return;
    if (!open) {
      this.closedScrollTop = this.scroller.scrollTop;
      this.closedAtBottom = this.scroller.scrollHeight - this.scroller.scrollTop - this.scroller.clientHeight <= 40;
    }
    this.open = open; this.container.hidden = !open;
    if (open) {
      this.scroller.scrollTop = this.closedAtBottom ? this.scroller.scrollHeight : this.closedScrollTop;
      this.focusInput();
    }
  }

  focusInput(): void { if (!this.disposed && this.open) this.input.focus({ preventScroll: true }); }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true; this.listeners.abort(); this.messages.clear(); this.container.replaceChildren();
  }
}
