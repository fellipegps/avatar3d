export type ConversationPhase = 'idle' | 'waiting' | 'revealing' | 'error';
export type CharacterState = 'idle' | 'thinking' | 'responding';
export type QualityProfile = 'normal' | 'economy';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export interface ChatReply {
  id: string;
  text: string;
  /** Reservado para a extensão opcional de áudio. */
  audioUrl?: string;
}

export interface ChatProvider {
  reply(text: string, signal: AbortSignal): Promise<ChatReply>;
}

export interface ScenePort {
  setCharacterState(state: CharacterState): void;
  setMouthOpen(value: number): void;
  setReducedMotion(enabled: boolean): void;
  setQuality(profile: QualityProfile): void;
  dispose(): void;
}
