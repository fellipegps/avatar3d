export type ChatIntent = 'greeting' | 'introduction' | 'scene' | 'help' | 'fallback';

export const RESPONSES: Readonly<Record<ChatIntent, string>> = Object.freeze({
  greeting: 'Olá! Sou Vita. Esta é uma conversa local com respostas pré-definidas. Como posso ajudar?',
  introduction: 'Sou Vita, a personagem desta demonstração 3D. Minhas respostas vêm de um catálogo local, sem IA ou serviços externos.',
  scene: 'Estou em um escritório 3D com mesa, monitores, luminária, planta e caneca. Os painéis mostram dados fictícios identificados como DEMO.',
  help: 'Você pode me cumprimentar, perguntar quem sou ou conhecer o cenário. Enter envia e Shift+Enter quebra a linha. Reiniciar limpa a conversa.',
  fallback: 'Ainda não tenho uma resposta para esse assunto. Experimente dizer “olá”, perguntar “quem é você?”, sobre o cenário ou pedir ajuda.',
});

export function normalizeInput(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Regras por palavras/frases inteiras; prioridade: ajuda, apresentação, cenário, saudação. */
export function selectIntent(text: string): ChatIntent {
  const normalized = ` ${normalizeInput(text)} `;
  if (/\b(ajuda|ajudar|help)\b|\bo que (voce )?(pode|sabe) fazer\b/.test(normalized)) return 'help';
  if (/\b(quem (e )?voce|se apresente|apresentacao|seu nome)\b/.test(normalized)) return 'introduction';
  if (/\b(cenario|sala|escritorio|ambiente|mesa|monitores)\b/.test(normalized)) return 'scene';
  if (/\b(oi|ola|bom dia|boa tarde|boa noite)\b/.test(normalized)) return 'greeting';
  return 'fallback';
}
