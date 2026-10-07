# Fase 07 — Piscar e controles faciais

Status inicial: pendente. Tipo: MVP principal.

## Dependências

Concluir [06 — Animações corporais e transições](06-animacoes-corporais.md). Ler [escopo e contratos](00-escopo-e-contratos.md), [guia de execução](README.md) e o [AGENTS.md](../AGENTS.md).

## Resultado esperado

Ter rosto expressivo com um controle normalizado de boca e piscar independente do corpo.

## Arquivos previstos

- `src/scene/CharacterController.ts`
- `src/scene/FaceController.ts, se a separação ajudar`
- `src/scene/character.manifest.ts`

Os caminhos orientam a implementação. Reutilizar módulos equivalentes de um repositório existente e registrar qualquer adaptação; não criar duplicações só para reproduzir a estrutura sugerida.

## Tarefas

- [ ] Implementar somente o mecanismo facial escolhido na fase 03.
- [ ] Para morph targets, resolver meshes e índices pelo manifesto e validar os controles no carregamento.
- [ ] Para atlas, alterar somente as regiões preparadas para rosto; preservar a independência entre olhos e boca.
- [ ] Expor setMouthOpen(value) com clamp de 0 a 1 e reset para expressão neutra.
- [ ] Implementar piscar leve, com intervalos configuráveis e atualização pelo delta do loop existente.
- [ ] Garantir que a ordem de atualização de mixer e rosto não apague expressões.
- [ ] Respeitar movimento reduzido, diminuindo estímulos repetitivos.
- [ ] Se houver movimento sintético de boca no modo sem áudio, tratá-lo como simulação visual explícita.

## Fora do escopo

- Visemas, detecção de emoção por IA e sincronização fonética.
- Manter dois sistemas faciais completos quando o asset só utiliza um.

## Critérios de aceitação

- [ ] Abertura 0 fecha a boca e abertura 1 representa o máximo definido para o asset.
- [ ] Valores fora da faixa não deformam o rosto indevidamente.
- [ ] Piscar funciona durante idle, thinking e responding.
- [ ] Boca e olhos mudam independentemente.
- [ ] Reset deixa o rosto em estado neutro.
- [ ] Nenhuma expressão depende de nomes não validados do GLB.

## Verificação

1. Testar boca em 0, 0,5 e 1 junto com piscar e clipes corporais.
2. Registrar demonstração visual e executar typecheck/build.

## Casos especiais e decisões

- Ausência de controle facial precisa ser corrigida no asset, não escondida pela interface.
- Sem áudio, a animação não deve ser apresentada como sincronização de fala real.

## Evidências e atualização do progresso

Ao concluir, atualizar a linha desta fase em [progresso.md](progresso.md): status, arquivos alterados, checks executados, evidências e limitações. Não marcar concluída com critérios essenciais pendentes. O relatório deve distinguir o que foi verificado do que ficou sem cobertura.

