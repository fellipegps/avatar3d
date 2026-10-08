# Fase 09 — Estado da conversa e provider local

Status: concluída em 08/10/2026. Tipo: MVP principal. [Verificação e limites](evidencias/fase-09/verificacao.md).

## Dependências

Concluir [08 — Interface do chat e controles](08-interface-chat-controles.md). Ler [escopo e contratos](00-escopo-e-contratos.md), [guia de execução](README.md) e o [AGENTS.md](../AGENTS.md).

## Resultado esperado

Implementar a conversa simulada como domínio independente do DOM e de Three.js.

## Arquivos previstos

- `src/app/ConversationStore.ts`
- `src/chat/MockChatProvider.ts`
- `src/chat/responses.ts`
- `src/app/contracts.ts`
- `tests/conversation.test.ts e tests/mock-chat.test.ts, ou convenção equivalente`

Os caminhos orientam a implementação. Reutilizar módulos equivalentes de um repositório existente e registrar qualquer adaptação; não criar duplicações só para reproduzir a estrutura sugerida.

## Tarefas

- [x] Criar store com mensagens, fase da conversa, erro opcional e inscrição em mudanças.
- [x] Implementar catálogo local para saudação, apresentação, cenário, ajuda e resposta padrão.
- [x] Normalizar entrada para seleção simples de intenção, mantendo o texto original na mensagem.
- [x] Retornar ChatReply por Promise com latência configurável; valor inicial entre 0,6 e 1,2 segundo.
- [x] Implementar AbortSignal e limpeza do timer ao cancelar, sem resposta tardia.
- [x] Definir IDs de mensagens/respostas e limitar a uma resposta ativa no domínio.
- [x] Criar cenário de erro explícito apenas para desenvolvimento/verificação.
- [x] Adicionar testes focados em transições válidas, cancelamento e resposta padrão, com tempo controlado.

## Fora do escopo

- Chamadas de rede, LLM, armazenamento persistente e streaming real.
- Manipulação de canvas, som ou DOM no provider/store.

## Critérios de aceitação

- [x] O provider funciona sem inicializar UI ou renderer.
- [x] Entradas equivalentes em caixa/acentos recebem a intenção esperada.
- [x] Entrada desconhecida retorna uma resposta padrão coerente.
- [x] Cancelar antes da resolução impede a resposta.
- [x] Store notifica mudanças de conversa, sem dados de animação por frame.
- [x] Os testes de cancelamento e transição passam.

## Verificação

1. Executar testes com timers controlados, typecheck e build.
2. Demonstrar respostas e falha simulada sem dependência de rede.

## Casos especiais e decisões

- Cancelamento é um caminho normal, separado de erro exibido ao usuário.
- Injetar latência curta/zero no teste, evitando espera real e testes dependentes de aleatoriedade.
- Latência padrão fixa de 800 ms, configurável e não aleatória. Testes usam agendador determinístico sem timers reais.
- Store expõe snapshots congelados e exige ID ativo para receber/concluir/falhar/cancelar. Reinício não reutiliza IDs. Uma solicitação permanece ativa durante `revealing` até `complete`.
- Normalização só seleciona a intenção: caixa, acentos, pontuação e espaços. Prioridade explícita: ajuda, apresentação, cenário, saudação, padrão. Histórico preserva texto original.
- `cancel` conserva histórico e retorna a idle sem erro; `reset` limpa histórico. Ambos invalidam a solicitação no domínio. Abortar o provider e a apresentação continua responsabilidade da coordenação na fase 10.
- Falha explícita está em `src/dev/MockChatFailure.ts`; não há palavra secreta de falha no catálogo normal. A página `/tests/conversation.html` demonstra provider/store com UI, sem renderer. Apresentação termina por botão manual de verificação; não implementa a apresentação gradual da fase 10.
- Convenção de testes: `.test.mjs` no runner nativo do Node, após compilar os módulos TS para `.tmp/domain-tests/` por `npm test`. Nenhuma dependência adicional.

## Evidências e atualização do progresso

Ao concluir, atualizar a linha desta fase em [progresso.md](progresso.md): status, arquivos alterados, checks executados, evidências e limitações. Não marcar concluída com critérios essenciais pendentes. O relatório deve distinguir o que foi verificado do que ficou sem cobertura.

