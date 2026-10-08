# Fase 07 — Piscar e controles faciais

Status: concluída em 08/10/2026. Tipo: MVP principal. [Verificação e demonstração](evidencias/fase-07/verificacao.md).

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

- [x] Implementar somente o mecanismo facial escolhido na fase 03: morph targets.
- [x] Para morph targets, resolver meshes e índices pelo manifesto e validar os controles no carregamento.
- [x] Atlas não se aplica ao asset escolhido; independência entre olhos e boca preservada por morph targets.
- [x] Expor setMouthOpen(value) com clamp de 0 a 1 e reset para expressão neutra.
- [x] Implementar piscar leve, com intervalos configuráveis e atualização pelo delta do loop existente.
- [x] Garantir que a ordem de atualização de mixer e rosto não apague expressões.
- [x] Respeitar movimento reduzido, diminuindo estímulos repetitivos.
- [x] Boca manual normalizada; movimento sintético automático de fala não utilizado nesta fase.

## Fora do escopo

- Visemas, detecção de emoção por IA e sincronização fonética.
- Manter dois sistemas faciais completos quando o asset só utiliza um.

## Critérios de aceitação

- [x] Abertura 0 fecha a boca e abertura 1 representa o máximo definido para o asset.
- [x] Valores fora da faixa não deformam o rosto indevidamente.
- [x] Piscar funciona durante idle, thinking e responding.
- [x] Boca e olhos mudam independentemente.
- [x] Reset deixa o rosto em estado neutro.
- [x] Nenhuma expressão depende de nomes não validados do GLB.

## Verificação

1. Testar boca em 0, 0,5 e 1 junto com piscar e clipes corporais.
2. Registrar demonstração visual e executar typecheck/build.

## Casos especiais e decisões

- Ausência de controle facial precisa ser corrigida no asset, não escondida pela interface.
- Sem áudio, a animação não deve ser apresentada como sincronização de fala real.

Política: espera aleatória de 2,5–5,5 s após cada ciclo; fechar/segurar/abrir em 0,06/0,04/0,1 s, com interpolação suave. Movimento reduzido desativa repetição e deixa olhos abertos, mantendo ajustes manuais estáticos. Ajuste manual de olhos desativa o automático; reset neutraliza os canais e preserva essa preferência. O botão de restauração do inspetor reativa o automático explicitamente. Nenhum timer ou segundo RAF. [41 checks e demonstrações reais](evidencias/fase-07/verificacao.md).

## Evidências e atualização do progresso

Ao concluir, atualizar a linha desta fase em [progresso.md](progresso.md): status, arquivos alterados, checks executados, evidências e limitações. Não marcar concluída com critérios essenciais pendentes. O relatório deve distinguir o que foi verificado do que ficou sem cobertura.

