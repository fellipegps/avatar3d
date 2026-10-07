# Fase 09 — Estado da conversa e provider local

Status inicial: pendente. Tipo: MVP principal.

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

- [ ] Criar store com mensagens, fase da conversa, erro opcional e inscrição em mudanças.
- [ ] Implementar catálogo local para saudação, apresentação, cenário, ajuda e resposta padrão.
- [ ] Normalizar entrada para seleção simples de intenção, mantendo o texto original na mensagem.
- [ ] Retornar ChatReply por Promise com latência configurável; valor inicial entre 0,6 e 1,2 segundo.
- [ ] Implementar AbortSignal e limpeza do timer ao cancelar, sem resposta tardia.
- [ ] Definir IDs de mensagens/respostas e limitar a uma resposta ativa no domínio.
- [ ] Criar cenário de erro explícito apenas para desenvolvimento/verificação.
- [ ] Adicionar testes focados em transições válidas, cancelamento e resposta padrão, com tempo controlado.

## Fora do escopo

- Chamadas de rede, LLM, armazenamento persistente e streaming real.
- Manipulação de canvas, som ou DOM no provider/store.

## Critérios de aceitação

- [ ] O provider funciona sem inicializar UI ou renderer.
- [ ] Entradas equivalentes em caixa/acentos recebem a intenção esperada.
- [ ] Entrada desconhecida retorna uma resposta padrão coerente.
- [ ] Cancelar antes da resolução impede a resposta.
- [ ] Store notifica mudanças de conversa, sem dados de animação por frame.
- [ ] Os testes de cancelamento e transição passam.

## Verificação

1. Executar testes com timers controlados, typecheck e build.
2. Demonstrar respostas e falha simulada sem dependência de rede.

## Casos especiais e decisões

- Cancelamento é um caminho normal, separado de erro exibido ao usuário.
- Injetar latência curta/zero no teste, evitando espera real e testes dependentes de aleatoriedade.

## Evidências e atualização do progresso

Ao concluir, atualizar a linha desta fase em [progresso.md](progresso.md): status, arquivos alterados, checks executados, evidências e limitações. Não marcar concluída com critérios essenciais pendentes. O relatório deve distinguir o que foi verificado do que ficou sem cobertura.

