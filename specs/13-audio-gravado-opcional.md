# Fase 13 — Áudio gravado — extensão opcional

Status inicial: pendente. Tipo: extensão opcional.

## Dependências

Concluir [12 — Resiliência, desempenho e entrega do núcleo](12-resiliencia-performance-entrega.md). Ler [escopo e contratos](00-escopo-e-contratos.md), [guia de execução](README.md) e o [AGENTS.md](../AGENTS.md).

## Resultado esperado

Reproduzir algumas respostas mock com áudio estático correspondente ao texto.

## Arquivos previstos

- `src/audio/AudioController.ts`
- `public/audio/`
- `src/chat/responses.ts`
- `src/ui/ControlsView.ts`
- `src/app/AppController.ts`
- `assets/credits.md`

Os caminhos orientam a implementação. Reutilizar módulos equivalentes de um repositório existente e registrar qualquer adaptação; não criar duplicações só para reproduzir a estrutura sugerida.

## Tarefas

- [ ] Selecionar/gravar arquivos em português brasileiro com origem e uso registrados.
- [ ] Associar audioUrl somente às respostas cujo texto corresponda ao arquivo.
- [ ] Adicionar controle de ativação de som, iniciando/retomando AudioContext em gesto do usuário.
- [ ] Implementar carregamento, reprodução, volume e cancelamento por solicitação ativa.
- [ ] Usar o término real do áudio como fim de responding quando a reprodução estiver ativa.
- [ ] Em reprodução bloqueada/falha ou modo sem áudio, concluir pelo fluxo de texto.
- [ ] Ao reiniciar ou ocultar a aba, interromper áudio e estabilizar o estado da conversa.
- [ ] Cancelar recursos de áudio no dispose, preservando o funcionamento do núcleo.

## Fora do escopo

- TTS de servidor, síntese neural, microfone e reconhecimento de voz.
- Visemas e análise de amplitude, que pertencem à fase 14.

## Critérios de aceitação

- [ ] Som depende de ativação do usuário e possui controle acessível.
- [ ] Texto e áudio de cada resposta são coerentes.
- [ ] Não há duas reproduções simultâneas.
- [ ] Fim, erro e cancelamento deixam conversa/personagem em estado consistente.
- [ ] Reiniciar ou ocultar a aba interrompe o som.
- [ ] Modo sem áudio continua passando pelo fluxo completo.

## Verificação

1. Verificar primeira ativação, reprodução, volume, arquivo inválido e cancelamento.
2. Reexecutar checks existentes e o fluxo do núcleo para detectar regressão.

## Casos especiais e decisões

- Fase opcional, fora do critério de conclusão do MVP principal.
- A ausência de arquivo adequado não justifica um áudio genérico que não corresponde à resposta.

## Evidências e atualização do progresso

Ao concluir, atualizar a linha desta fase em [progresso.md](progresso.md): status, arquivos alterados, checks executados, evidências e limitações. Não marcar concluída com critérios essenciais pendentes. O relatório deve distinguir o que foi verificado do que ficou sem cobertura.

