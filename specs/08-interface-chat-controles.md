# Fase 08 — Interface do chat e controles

Status inicial: pendente. Tipo: MVP principal.

## Dependências

Concluir [07 — Piscar e controles faciais](07-expressoes-faciais.md). Ler [escopo e contratos](00-escopo-e-contratos.md), [guia de execução](README.md) e o [AGENTS.md](../AGENTS.md).

## Resultado esperado

Construir a camada DOM do chat e seus controles com eventos e contratos claros, antes de adicionar respostas.

## Arquivos previstos

- `src/ui/ChatView.ts`
- `src/ui/ControlsView.ts`
- `src/styles/base.css`
- `src/styles/layout.css`
- `src/styles/chat.css`

Os caminhos orientam a implementação. Reutilizar módulos equivalentes de um repositório existente e registrar qualquer adaptação; não criar duplicações só para reproduzir a estrutura sugerida.

## Tarefas

- [ ] Criar painel lateral com título, lista de mensagens, textarea, envio e reinício.
- [ ] Adicionar abrir/fechar painel, seleção de qualidade e preferência de movimento reduzido.
- [ ] Expor eventos de UI e métodos de renderização; deixar a coordenação funcional para a fase 10.
- [ ] Inserir conteúdo de mensagens por textContent ou nós de texto.
- [ ] Adicionar estados visuais de espera, erro e envio indisponível.
- [ ] Implementar Enter para envio e Shift+Enter para nova linha; rejeitar entrada vazia e limitar tamanho.
- [ ] Cuidar de foco e rolagem; preservar leitura de mensagens antigas quando o usuário rolar para cima.
- [ ] Usar uma pequena fixture de demonstração apenas em desenvolvimento para verificar o layout.

## Fora do escopo

- Provider de respostas, estado de domínio e ligação direta com Three.js.
- Botões de upload, câmera, microfone ou conta sem funcionalidade prevista.

## Critérios de aceitação

- [ ] O chat é HTML e permanece independente do canvas.
- [ ] Mensagens com tags são exibidas como texto.
- [ ] Eventos de enviar/reiniciar/abrir/fechar são demonstráveis.
- [ ] O campo não perde texto ao alternar estados visuais.
- [ ] Os controles têm rótulos acessíveis e foco visível.
- [ ] Fechar e reabrir preserva o conteúdo exibido.

## Verificação

1. Verificar teclado, mensagens longas e texto com tags HTML.
2. Inspecionar desktop e tela estreita; executar typecheck/build.

## Casos especiais e decisões

- Controles desta fase podem ser demonstrados por handlers de desenvolvimento, mas não devem aparecer como recurso funcional final antes da integração.
- Não reconstruir todo o painel a cada frame da cena.

## Evidências e atualização do progresso

Ao concluir, atualizar a linha desta fase em [progresso.md](progresso.md): status, arquivos alterados, checks executados, evidências e limitações. Não marcar concluída com critérios essenciais pendentes. O relatório deve distinguir o que foi verificado do que ficou sem cobertura.

