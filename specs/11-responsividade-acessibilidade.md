# Fase 11 — Responsividade e acessibilidade

Status inicial: pendente. Tipo: MVP principal.

## Dependências

Concluir [10 — Integração entre chat e personagem](10-integracao-chat-personagem.md). Ler [escopo e contratos](00-escopo-e-contratos.md), [guia de execução](README.md) e o [AGENTS.md](../AGENTS.md).

## Resultado esperado

Permitir uso confortável do fluxo completo em desktop e celular, com teclado e movimento reduzido.

## Arquivos previstos

- `src/styles/layout.css e src/styles/chat.css`
- `src/ui/ChatView.ts e src/ui/ControlsView.ts`
- `src/scene/scene.config.ts`
- `src/scene/SceneController.ts`

Os caminhos orientam a implementação. Reutilizar módulos equivalentes de um repositório existente e registrar qualquer adaptação; não criar duplicações só para reproduzir a estrutura sugerida.

## Tarefas

- [ ] Definir layout desktop com cena predominante e painel de aproximadamente 340–400 px.
- [ ] Definir layout móvel com cena acima do chat e espaço adequado para envio.
- [ ] Reenquadrar câmera por proporção do contêiner, preservando rosto e gestos.
- [ ] Validar resize e teclado virtual usando altura dinâmica da viewport quando necessário.
- [ ] Garantir navegação por teclado, foco visível e retorno de foco ao abrir/fechar.
- [ ] Anunciar resposta completa por região acessível, sem anúncio letra por letra.
- [ ] Respeitar prefers-reduced-motion e permitir preferência manual.
- [ ] Ajustar rolagem para mensagens longas, preservando leitura anterior e acesso ao fim da conversa.

## Fora do escopo

- Redesign do produto, navegação por avatar e aplicativos nativos.
- Recursos novos fora do fluxo do MVP.

## Critérios de aceitação

- [ ] Sem overflow horizontal em larguras de 360, 390, 768 e 1440 px.
- [ ] Rosto permanece visível e o chat é utilizável nesses tamanhos.
- [ ] O teclado virtual não impede alcançar o campo e o envio.
- [ ] Todas as ações principais podem ser feitas por teclado.
- [ ] Movimento reduzido evita gestos/câmera repetitivos e exibição letra por letra.
- [ ] Mensagem completa é anunciada uma vez.
- [ ] Alterar orientação não duplica ou perde a cena.

## Verificação

1. Verificar tamanhos representativos, orientação e navegação de teclado.
2. Verificar teclado virtual em dispositivo real quando disponível; registrar se a cobertura foi apenas emulação.
3. Executar os checks existentes e registrar capturas desktop/móvel.

## Casos especiais e decisões

- Não declarar validação em celular físico se só houve emulação.
- Canvas deve ter descrição textual equivalente e não concentrar controles essenciais de chat.

## Evidências e atualização do progresso

Ao concluir, atualizar a linha desta fase em [progresso.md](progresso.md): status, arquivos alterados, checks executados, evidências e limitações. Não marcar concluída com critérios essenciais pendentes. O relatório deve distinguir o que foi verificado do que ficou sem cobertura.

