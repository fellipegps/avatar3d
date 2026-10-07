# Fase 10 — Integração entre chat e personagem

Status inicial: pendente. Tipo: MVP principal.

## Dependências

Concluir [09 — Estado da conversa e provider local](09-estado-conversa-mock.md). Ler [escopo e contratos](00-escopo-e-contratos.md), [guia de execução](README.md) e o [AGENTS.md](../AGENTS.md).

## Resultado esperado

Entregar o fluxo completo de mensagem, espera, gesto de resposta e retorno ao repouso.

## Arquivos previstos

- `src/app/AppController.ts`
- `src/main.ts`
- `src/ui/ChatView.ts`
- `src/app/contracts.ts`
- `tests/app-controller.test.ts, ou convenção equivalente`

Os caminhos orientam a implementação. Reutilizar módulos equivalentes de um repositório existente e registrar qualquer adaptação; não criar duplicações só para reproduzir a estrutura sugerida.

## Tarefas

- [ ] Inicializar módulos existentes por AppController, passando dependências e callbacks explícitos.
- [ ] Ao enviar, adicionar a mensagem, marcar waiting e comandar thinking.
- [ ] Ao receber a resposta atual, marcar revealing, apresentar o texto e comandar responding.
- [ ] Ao concluir a apresentação, voltar para idle e reabilitar envio.
- [ ] Manter o texto completo no domínio; a apresentação gradual pertence à UI e não altera o store a cada letra.
- [ ] Usar AbortController e identificador/generation da solicitação ativa para ignorar resultados antigos.
- [ ] Ao reiniciar, cancelar provider e apresentação, limpar histórico e retornar personagem/rosto ao repouso.
- [ ] Ligar qualidade, movimento reduzido e abrir/fechar chat sem recriar a cena.
- [ ] Garantir que indisponibilidade do 3D não bloqueie o chat e testar a corrida entre reinício e resolução.

## Fora do escopo

- Áudio, IA real e acoplamento do texto da conversa a ossos/materiais.
- Uma fila complexa de mensagens ou múltiplas respostas simultâneas.

## Critérios de aceitação

- [ ] Saudação executa idle → thinking → responding → idle.
- [ ] O usuário pode escrever durante a espera, mas não enviar uma segunda solicitação.
- [ ] Reiniciar antes ou durante a apresentação não gera mensagem atrasada.
- [ ] Uma resposta antiga nunca altera o estado de uma nova solicitação.
- [ ] Erro de resposta retorna a personagem ao repouso e oferece recuperação.
- [ ] Chat funciona mesmo com a cena indisponível.
- [ ] Fechar o painel não perde histórico nem duplica a aplicação.

## Verificação

1. Testar fluxo completo, erro e reinício em diferentes momentos.
2. Automatizar a corrida com um provider controlável; executar testes, typecheck e build.
3. Registrar vídeo curto do fluxo integrado.

## Casos especiais e decisões

- Evitar encerrar uma solicitação nova em finally de uma solicitação antiga.
- Se a aba ficar oculta, manter o domínio consistente e retomar a cena com delta limitado; o chat não depende do número de frames.

## Evidências e atualização do progresso

Ao concluir, atualizar a linha desta fase em [progresso.md](progresso.md): status, arquivos alterados, checks executados, evidências e limitações. Não marcar concluída com critérios essenciais pendentes. O relatório deve distinguir o que foi verificado do que ficou sem cobertura.

