import type { ChatProvider } from '../app/contracts.js';
import { MockChatProvider } from '../chat/MockChatProvider.js';
import type { MockChatOptions } from '../chat/MockChatProvider.js';

/** Usado somente por demonstração DEV e testes; nenhum gatilho no catálogo normal. */
export function createFailingChatProvider(options: MockChatOptions = {}): ChatProvider {
  const provider = new MockChatProvider(options);
  return {
    async reply(text, signal) {
      await provider.reply(text, signal);
      if (signal.aborted) throw new DOMException('Resposta cancelada.', 'AbortError');
      throw new Error('Falha simulada do provider local. Tente novamente.');
    },
  };
}
