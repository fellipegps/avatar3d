# Fase 11 — Responsividade e acessibilidade

Status: concluída em 09/10/2026, com cobertura móvel por emulação. Tipo: MVP principal.

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

- [x] Definir layout desktop com cena predominante e painel de aproximadamente 340–400 px.
- [x] Definir layout móvel com cena acima do chat e espaço adequado para envio.
- [x] Reenquadrar câmera por proporção do contêiner, preservando rosto e gestos.
- [x] Validar resize e teclado virtual usando altura dinâmica da viewport quando necessário.
- [x] Garantir navegação por teclado, foco visível e retorno de foco ao abrir/fechar.
- [x] Anunciar resposta completa por região acessível, sem anúncio letra por letra.
- [x] Respeitar prefers-reduced-motion e permitir preferência manual.
- [x] Ajustar rolagem para mensagens longas, preservando leitura anterior e acesso ao fim da conversa.

## Fora do escopo

- Redesign do produto, navegação por avatar e aplicativos nativos.
- Recursos novos fora do fluxo do MVP.

## Critérios de aceitação

- [x] Sem overflow horizontal em larguras de 360, 390, 768 e 1440 px.
- [x] Rosto permanece visível e o chat é utilizável nesses tamanhos.
- [x] O teclado virtual não impede alcançar o campo e o envio.
- [x] Todas as ações principais podem ser feitas por teclado.
- [x] Movimento reduzido evita gestos/câmera repetitivos e exibição letra por letra.
- [x] Mensagem completa é anunciada uma vez.
- [x] Alterar orientação não duplica ou perde a cena.

## Verificação

1. Verificar tamanhos representativos, orientação e navegação de teclado.
2. Verificar teclado virtual em dispositivo real quando disponível; registrar se a cobertura foi apenas emulação.
3. Executar os checks existentes e registrar capturas desktop/móvel.

## Casos especiais e decisões

- Não declarar validação em celular físico se só houve emulação.
- Canvas deve ter descrição textual equivalente e não concentrar controles essenciais de chat.

## Evidências e atualização do progresso

Ao concluir, atualizar a linha desta fase em [progresso.md](progresso.md): status, arquivos alterados, checks executados, evidências e limitações. Não marcar concluída com critérios essenciais pendentes. O relatório deve distinguir o que foi verificado do que ficou sem cobertura.

## Resultado verificado em 09/10/2026

Critérios atendidos no Chromium integrado, com cobertura móvel emulada. Quatro larguras, orientação retrato/paisagem e altura disponível de 360 px verificadas no preview de produção. Navegação por teclado, foco, mensagens longas e acesso ao fim demonstrados. Região acessível publica a resposta completa uma vez; nenhum anúncio parcial, duplicado ou cancelado. Sem teste de teclado virtual físico ou escuta com leitor de tela real.

28 checks novos e regressões de domínio/UI/integração/cena/ambiente/corpo/face passaram: **206 checks/testes**, além de tipos/build. [Matriz, reprodução e limitações](evidencias/fase-11/verificacao.md), [desktop](evidencias/fase-11/desktop-1440.jpg), [móvel](evidencias/fase-11/mobile-390.jpg), [teclado com altura reduzida](evidencias/fase-11/teclado-altura-reduzida.jpg).

