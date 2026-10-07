# Fase 06 — Animações corporais e transições

Status inicial: pendente. Tipo: MVP principal.

## Dependências

Concluir [05 — Materiais, iluminação e painéis](05-materiais-luzes-paineis.md). Ler [escopo e contratos](00-escopo-e-contratos.md), [guia de execução](README.md) e o [AGENTS.md](../AGENTS.md).

## Resultado esperado

Encapsular os clipes da personagem em um controlador que aceite comandos de estado simples.

## Arquivos previstos

- `src/scene/CharacterController.ts`
- `src/scene/character.manifest.ts`
- `src/scene/SceneController.ts`

Os caminhos orientam a implementação. Reutilizar módulos equivalentes de um repositório existente e registrar qualquer adaptação; não criar duplicações só para reproduzir a estrutura sugerida.

## Tarefas

- [ ] Mover a reprodução do GLB de inspeção para CharacterController, sem duplicar o carregamento.
- [ ] Criar AnimationMixer e ações a partir dos clipes mapeados.
- [ ] Implementar idle, thinking e responding, com transições iniciais de 0,2–0,4 segundo ajustáveis.
- [ ] Definir retorno ao repouso e tratamento de comandos repetidos ou recebidos durante uma transição.
- [ ] Manter posição estável atrás da mesa; corrigir root motion incompatível.
- [ ] Separar canais corporais e faciais para evitar que o mixer sobrescreva boca e olhos.
- [ ] Atualizar mixer no loop único e implementar descarte das ações/recursos.
- [ ] Adicionar comandos de demonstração somente no modo de desenvolvimento.

## Fora do escopo

- Interpretação do conteúdo do chat dentro da personagem.
- Retargeting tardio e movimentos procedurais extras de cabeça.

## Critérios de aceitação

- [ ] Os três estados são demonstráveis por comando.
- [ ] Transições não produzem salto de posição ou troca abrupta indevida.
- [ ] Repetir o mesmo comando não reinicia continuamente a animação.
- [ ] Encerrar a resposta permite retornar ao repouso.
- [ ] O controlador não importa ChatView ou MockChatProvider.
- [ ] Não há segundo loop de animação.

## Verificação

1. Alternar idle/thinking/responding em sequência e rapidamente.
2. Registrar vídeo curto das transições e executar typecheck/build.

## Casos especiais e decisões

- Definir se clipes finitos retornam automaticamente ou são sustentados até o comando seguinte; documentar a política.
- Não marcar um clipe ausente como resolvido apenas usando silenciosamente outro nome.

## Evidências e atualização do progresso

Ao concluir, atualizar a linha desta fase em [progresso.md](progresso.md): status, arquivos alterados, checks executados, evidências e limitações. Não marcar concluída com critérios essenciais pendentes. O relatório deve distinguir o que foi verificado do que ficou sem cobertura.

