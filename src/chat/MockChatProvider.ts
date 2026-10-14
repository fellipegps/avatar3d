import type { ChatProvider, ChatReply } from '../app/contracts.js';
import { RESPONSES, selectIntent } from './responses.js';

/** Retorna uma função que remove o timer. O agendador deve executar assincronamente. */
export type ReplyScheduler = (callback: () => void, delayMs: number) => () => void;
export interface MockChatOptions { latencyMs?: number; schedule?: ReplyScheduler }
const defaultSchedule: ReplyScheduler = (callback, delayMs) => {
  const timer = globalThis.setTimeout(callback, delayMs);
  return () => globalThis.clearTimeout(timer);
};
let nextProvider = 0;

export class MockChatProvider implements ChatProvider {
  private readonly prefix = `local-${++nextProvider}`;
  private nextReply = 0;
  private readonly latencyMs: number;
  private readonly schedule: ReplyScheduler;

  constructor(options: MockChatOptions = {}) {
    this.latencyMs = options.latencyMs ?? 800;
    if (!Number.isFinite(this.latencyMs) || this.latencyMs < 0) throw new RangeError('Latência deve ser finita e não negativa.');
    this.schedule = options.schedule ?? defaultSchedule;
  }

  reply(text: string, signal: AbortSignal): Promise<ChatReply> {
    return new Promise((resolve, reject) => {
      if (signal.aborted) { reject(new DOMException('Resposta cancelada.', 'AbortError')); return; }
      let settled = false;
      let cancelTimer: (() => void) | undefined;
      const cleanup = (): void => { cancelTimer?.(); signal.removeEventListener('abort', onAbort); };
      const onAbort = (): void => {
        if (settled) return;
        settled = true; cleanup(); reject(new DOMException('Resposta cancelada.', 'AbortError'));
      };
      const finish = (): void => {
        if (settled) return;
        if (signal.aborted) { onAbort(); return; }
        settled = true; cleanup();
        resolve({ id: `${this.prefix}-reply-${++this.nextReply}`, text: RESPONSES[selectIntent(text)] });
      };
      signal.addEventListener('abort', onAbort, { once: true });
      try {
        cancelTimer = this.schedule(finish, this.latencyMs);
        // Protege também agendadores injetados que abortam/resolvem ao agendar.
        if (settled) cancelTimer();
      } catch (error) {
        settled = true; cleanup(); reject(error);
      }
    });
  }
}
