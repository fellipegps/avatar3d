import { MAX_MESSAGE_LENGTH } from './contracts.js';
import type { ChatMessage, ChatReply, ConversationSnapshot } from './contracts.js';

type Listener = (snapshot: ConversationSnapshot) => void;
let nextStoreId = 0;

/** Domínio em memória: não conhece DOM, provider, relógio ou animações. */
export class ConversationStore {
  private readonly prefix = `conversation-${++nextStoreId}`;
  private nextRequest = 0;
  private readonly listeners = new Set<Listener>();
  private disposed = false;
  private notifying = false;
  private readonly pending: ConversationSnapshot[] = [];
  private state: ConversationSnapshot = Object.freeze({
    messages: Object.freeze([]), phase: 'idle', activeRequestId: null,
  });

  getSnapshot(): ConversationSnapshot { return this.state; }

  /** A primeira chamada entrega o snapshot atual; remoção é idempotente. */
  subscribe(listener: Listener): () => void {
    if (this.disposed) return () => {};
    this.listeners.add(listener);
    listener(this.state);
    return () => { this.listeners.delete(listener); };
  }

  private publish(state: ConversationSnapshot): void {
    this.state = Object.freeze(state);
    this.pending.push(this.state);
    if (this.notifying) return;
    this.notifying = true;
    try {
      // Mudanças feitas por assinantes são entregues em ordem, sem recursão.
      while (this.pending.length && !this.disposed) {
        const snapshot = this.pending.shift()!;
        for (const listener of [...this.listeners]) {
          if (this.disposed) break;
          if (this.listeners.has(listener)) listener(snapshot);
        }
      }
    } finally { this.notifying = false; }
  }

  private matches(requestId: number): boolean {
    return !this.disposed && this.state.activeRequestId === requestId;
  }

  begin(text: string): number | null {
    if (this.disposed || this.state.activeRequestId !== null || !text.trim() || text.length > MAX_MESSAGE_LENGTH) return null;
    const requestId = ++this.nextRequest;
    const message: Readonly<ChatMessage> = Object.freeze({ id: `${this.prefix}-user-${requestId}`, role: 'user', text });
    this.publish({ messages: Object.freeze([...this.state.messages, message]), phase: 'waiting', activeRequestId: requestId });
    return requestId;
  }

  receive(requestId: number, reply: ChatReply): boolean {
    if (!this.matches(requestId) || this.state.phase !== 'waiting' || !reply.id || !reply.text.trim()
      || this.state.messages.some(message => message.id === reply.id)) return false;
    const message: Readonly<ChatMessage> = Object.freeze({ id: reply.id, role: 'assistant', text: reply.text });
    this.publish({ messages: Object.freeze([...this.state.messages, message]), phase: 'revealing', activeRequestId: requestId });
    return true;
  }

  complete(requestId: number): boolean {
    if (!this.matches(requestId) || this.state.phase !== 'revealing') return false;
    this.publish({ messages: this.state.messages, phase: 'idle', activeRequestId: null });
    return true;
  }

  fail(requestId: number, error = 'Não foi possível responder. Tente novamente.'): boolean {
    if (!this.matches(requestId)) return false;
    this.publish({ messages: this.state.messages, phase: 'error', error: error.trim() || 'Não foi possível responder. Tente novamente.', activeRequestId: null });
    return true;
  }

  /** Cancelamento conserva histórico e não vira erro. Reinício limpa histórico. */
  cancel(requestId: number): boolean {
    if (!this.matches(requestId)) return false;
    this.publish({ messages: this.state.messages, phase: 'idle', activeRequestId: null });
    return true;
  }

  reset(): void {
    if (this.disposed) return;
    this.publish({ messages: Object.freeze([]), phase: 'idle', activeRequestId: null });
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true; this.listeners.clear(); this.pending.length = 0;
    this.state = Object.freeze({ messages: Object.freeze([]), phase: 'idle', activeRequestId: null });
  }
}
