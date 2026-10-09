# Fase 12 — Resiliência, desempenho e entrega do núcleo

Status: concluída em 09/10/2026. [Evidências e limitações](evidencias/fase-12/verificacao.md). Tipo: MVP principal.

## Dependências

Concluir [11 — Responsividade e acessibilidade](11-responsividade-acessibilidade.md). Ler [escopo e contratos](00-escopo-e-contratos.md), [guia de execução](README.md) e o [AGENTS.md](../AGENTS.md).

## Resultado esperado

Concluir o MVP principal com falhas tratadas, desempenho medido e build reproduzível.

## Arquivos previstos

- `src/scene/AssetLoader.ts e src/scene/SceneController.ts`
- `src/scene/scene.config.ts`
- `public/images/scene-fallback.webp, ou equivalente`
- `README.md`
- `specs/progresso.md`

Os caminhos orientam a implementação. Reutilizar módulos equivalentes de um repositório existente e registrar qualquer adaptação; não criar duplicações só para reproduzir a estrutura sugerida.

## Tarefas

- [x] Finalizar feedback de carregamento, falha de asset e tentativa de recarregar sem duplicar recursos.
- [x] Adicionar fallback estático para ausência de WebGL 2, mantendo o chat ativo.
- [x] Tratar perda de contexto com feedback e recuperação/reinício controlado.
- [x] Medir transferência, triângulos, draw calls e frame time nos equipamentos disponíveis.
- [x] Ajustar perfis normal/econômico, pixel ratio e sombras antes de considerar compressão ou efeitos.
- [x] Verificar descarte de texturas, materiais, geometrias, mixer, observadores e timers.
- [x] Resolver caminhos de assets com a base de publicação do Vite; verificar o build em preview.
- [x] Documentar setup, assets, comandos, estados mock, limitações e evidências.
- [x] Executar a verificação final do fluxo e preencher a definição de pronto no registro.

## Fora do escopo

- Publicação em produção ou alteração de serviços externos.
- Backend, autenticação e recursos da extensão de áudio.
- Compressão avançada sem necessidade medida.

## Critérios de aceitação

- [x] Build e typecheck passam, assim como os testes significativos introduzidos.
- [x] Fluxo principal funciona na versão de produção em preview.
- [x] Erro de GLB, renderer indisponível e perda de contexto recebem tratamento.
- [x] Chat continua utilizável quando o 3D não está disponível.
- [x] Não há aumento contínuo de canvas/loops/listeners após remontagens.
- [x] Metas de desempenho estão medidas ou marcadas como não verificadas com motivo.
- [x] Há capturas desktop/móvel, origem dos assets e instruções de execução.
- [x] Fases 01–11 e critérios do núcleo estão concluídos; nenhum placeholder é apresentado como personagem final.

## Verificação

1. Executar checks, build e abrir a aplicação por preview.
2. Verificar fluxo completo, reinício, falhas, fallback e remontagem.
3. Registrar dispositivos reais, perfis e resultados; não inventar métricas de equipamento indisponível.

## Casos especiais e decisões

- Metas: personagem ~60 mil triângulos, ambiente ~40 mil, até ~80 draw calls, transferência essencial ~15 MB; referências completas em 00.
- Buscar 60 FPS no computador e ao menos 30 no celular de referência. Desvios relevantes exigem ajuste ou registro explícito para revisão.
- Fallback não satisfaz a entrega 3D principal; serve apenas aos caminhos de falha.

## Evidências e atualização do progresso

Ao concluir, atualizar a linha desta fase em [progresso.md](progresso.md): status, arquivos alterados, checks executados, evidências e limitações. Não marcar concluída com critérios essenciais pendentes. O relatório deve distinguir o que foi verificado do que ficou sem cobertura.

