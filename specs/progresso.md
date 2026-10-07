# Progresso da implementação

As fases 01 e 02 foram implementadas e verificadas em 7 de outubro de 2026, com cobertura e limitações registradas abaixo. As demais fases principais continuam pendentes; o modelo ainda não foi selecionado/validado.

## Status das fases

Valores permitidos: pendente, em andamento, bloqueada, concluída. Fases opcionais também podem ficar como não solicitada.

| Fase | Status atual | Dependência | Evidência/observação |
| --- | --- | --- | --- |
| [01 — Base Vite e TypeScript](01-base-vite-typescript.md) | concluída | — | Tipos, build, desenvolvimento e preview verificados. [Checks](evidencias/fase-01/verificacao.md), [dev](evidencias/fase-01/desenvolvimento.jpg), [preview](evidencias/fase-01/preview.jpg). |
| [02 — Renderer, câmera e ciclo de vida](02-renderer-camera-ciclo-de-vida.md) | concluída | 01 | WebGL 2 real, 24 checks de ciclo de vida, tipos/build e preview. Visibilidade testada por simulação controlada. [Verificação e limites](evidencias/fase-02/verificacao.md), [preview](evidencias/fase-02/preview.jpg). |
| [03 — Validação do modelo da personagem](03-validacao-asset-personagem.md) | pendente | 02 | GLB ainda não selecionado/fornecido. |
| [04 — Sala e objetos 3D](04-sala-e-objetos-3d.md) | pendente | 03 | — |
| [05 — Materiais, iluminação e painéis](05-materiais-luzes-paineis.md) | pendente | 04 | — |
| [06 — Animações corporais e transições](06-animacoes-corporais.md) | pendente | 05 | — |
| [07 — Piscar e controles faciais](07-expressoes-faciais.md) | pendente | 06 | — |
| [08 — Interface do chat e controles](08-interface-chat-controles.md) | pendente | 07 | — |
| [09 — Estado da conversa e provider local](09-estado-conversa-mock.md) | pendente | 08 | — |
| [10 — Integração entre chat e personagem](10-integracao-chat-personagem.md) | pendente | 09 | — |
| [11 — Responsividade e acessibilidade](11-responsividade-acessibilidade.md) | pendente | 10 | — |
| [12 — Resiliência, desempenho e entrega do núcleo](12-resiliencia-performance-entrega.md) | pendente | 11 | — |
| [13 — Áudio gravado — extensão opcional](13-audio-gravado-opcional.md) | não solicitada | 12 | Extensão opcional. |
| [14 — Boca pela amplitude — extensão opcional](14-boca-amplitude-opcional.md) | não solicitada | 13 | Extensão opcional. |

## Registro por fase

### Fase 01 — Base Vite e TypeScript

- Status: concluída.
- Data: 07/10/2026.
- Resultado obtido: aplicação Vite vanilla-ts executável, TypeScript estrito, áreas semânticas da cena/interface e contratos públicos da especificação 00.
- Arquivos alterados: `../package.json`, `../package-lock.json`, `../tsconfig.json`, `../index.html`, `../src/main.ts`, `../src/app/contracts.ts`, `../src/styles/base.css`, `../.gitignore`, `../README.md`, `README.md`, `01-base-vite-typescript.md`, este registro e [evidências](evidencias/fase-01/verificacao.md).
- Critérios de aceitação atendidos: desenvolvimento abre com estrutura visual mínima; typecheck estrito passa; build gera dist e preview abre; inicialização única em main.ts; dependências diretas com finalidade documentada no README.
- Comandos/checks executados e resultados: `npm run typecheck` e `npm run build`, ambos com código 0; [log de tipos](evidencias/fase-01/typecheck.txt), [log de build](evidencias/fase-01/build.txt). Servidores dev e preview iniciados com portas fixas e abertos no navegador. [Inspeção do DOM e console](evidencias/fase-01/navegador.json).
- Evidências visuais: [desenvolvimento](evidencias/fase-01/desenvolvimento.jpg), [preview de produção, página completa](evidencias/fase-01/preview.jpg).
- Equipamento/resolução/perfil: ambiente Windows, Node 22.20.0, npm 11.7.0; navegador integrado do Codex. Dev observado em 1280×720; preview inspecionado inicialmente em 1280×720 e captura final com viewport 664×484 (página completa). Sem medição de desempenho.
- Limitações ou cobertura não executada: não houve teste em celular real nem matriz de navegadores; WebGL, GLB, animação e chat estão fora desta fase. O empilhamento em largura estreita foi observado, mas não conclui os critérios da fase 11.
- Decisões e mudanças de contrato: contratos preservados sem implementação vazia; Vite sem configuração adicional; versões diretas exatas no package.json e dependências transitivas no lockfile. Three.js e seus tipos preparados para a fase 02, sem importação na UI. Repositório inicial tinha apenas documentação e não era um checkout Git. README das specs foi atualizado para refletir o início da implementação.
- Bloqueios e próximo passo concreto: nenhum bloqueio da fase 01; próxima fase é 02, somente quando solicitada. Núcleo continua incompleto.

### Fase 02 — Renderer, câmera e ciclo de vida

- Status: concluída, com limitação de cobertura da ocultação nativa documentada.
- Data: 07/10/2026.
- Resultado obtido: cena e câmera de perspectiva com cubo de referência; WebGL 2, um canvas/loop por montagem, módulos atualizados por delta em segundos, ResizeObserver, pausa, descarte idempotente e disponibilidade/erros enviados ao AppController.
- Arquivos alterados: `../src/scene/SceneController.ts`, `../src/scene/scene.config.ts`, `../src/app/AppController.ts`, `../src/main.ts`, `../src/styles/base.css`, `../tsconfig.json`, `../tests/scene.html`, `../tests/scene.browser.ts`, `../README.md`, `README.md`, `02-renderer-camera-ciclo-de-vida.md`, este registro e [evidências](evidencias/fase-02/verificacao.md). Dependências e lockfile preservados.
- Critérios de aceitação atendidos: canvas/RAF únicos; aspecto e projeção coerentes após resize; área pequena e zero sem exceções; pausa/retomada sem salto em visibilidade simulada; remontagens sem duplicação; falha controlada com interface preservada. [24 resultados](evidencias/fase-02/testes-browser.json).
- Comandos/checks executados e resultados: `npm run typecheck` e `npm run build`, código 0; [tipos](evidencias/fase-02/typecheck.txt), [build](evidencias/fase-02/build.txt). Desenvolvimento aberto em `/` e `/tests/scene.html`, produção aberta em preview na porta 4173. Tentativa de iniciar outro dev na porta 5173 informou porta ocupada; servidor existente reutilizado e código da fase 02 confirmado no navegador.
- Evidências visuais: [24 checks](evidencias/fase-02/testes.jpg), [falha deliberada do renderer](evidencias/fase-02/falha-renderer.jpg), [preview completo](evidencias/fase-02/preview.jpg). [Inspeção do preview](evidencias/fase-02/preview-navegador.json).
- Equipamento/resolução/perfil: Windows, Node 22.20.0, npm 11.7.0; navegador integrado Chromium com WebGL 2.0 / OpenGL ES 3.0. Preview observado em viewport 598×484 e canvas CSS/buffer 541×300. Sem medição de FPS ou hardware de GPU. DPR 3 foi injetado apenas nos testes de limite normal/econômico.
- Limitações ou cobertura não executada: a ocultação do painel, troca de aba e atalho no navegador integrado não produziram `visibilitychange` nativo observável; essa parte foi verificada com `document.hidden` e evento controlados, usando renderer real. Sem celular físico, matriz de navegadores ou benchmark. Logs da aba reutilizada contêm erros esperados das falhas de WebGL forçadas anteriormente. Build avisa que o chunk JS tem 530,77 kB (132,45 kB gzip); otimização fica para fase 12, sem suprimir o aviso.
- Decisões e mudanças de contrato: contratos de 00 preservados. SceneController implementa apenas as capacidades usadas nesta fase (`Pick<ScenePort, 'setQuality' | 'setReducedMotion' | 'dispose'>`), sem métodos vazios de personagem/boca. API local de disponibilidade e registro de atualizações atende à fase 02. Recursos de referência pertencem à cena; módulos futuros descartam os próprios recursos. HMR e pagehide descartam; retorno pelo bfcache recarrega. Perda/restauração reais de contexto também passaram nos testes. Duas falhas da instrumentação foram corrigidas: arredondamento do buffer e exclusão de listeners da automação.
- Bloqueios e próximo passo concreto: sem bloqueio de implementação; próxima fase é 03, quando solicitada. Recomenda-se repetir ocultação/retomada nativa em navegador externo quando disponível; a página de verificação mantém um monitor para essa inspeção. Cubo não representa a personagem nem conclui o núcleo.

Copiar o bloco abaixo para cada fase executada. Manter histórico das decisões e atualizar o resumo de status correspondente.

```md
### Fase NN — nome
- Status:
- Data:
- Resultado obtido:
- Arquivos alterados:
- Critérios de aceitação atendidos:
- Comandos/checks executados e resultados:
- Evidências visuais (links relativos):
- Equipamento/resolução/perfil, se houve medição:
- Limitações ou cobertura não executada:
- Decisões e mudanças de contrato:
- Bloqueios e próximo passo concreto:
```

## Definição de pronto do núcleo

- [ ] Fases principais concluídas com critérios verificados.
- [ ] Personagem real GLB validada, com rig, clipes e rosto funcional.
- [ ] Sala, personagem e objetos no mesmo canvas.
- [ ] Chat local e transições funcionando na versão de produção em preview.
- [ ] Reinício impede respostas e apresentações antigas.
- [ ] Layout desktop/móvel, teclado e movimento reduzido verificados.
- [ ] Falhas de asset/renderer e fallback tratados.
- [ ] Desempenho medido, com limitações e cobertura registradas.
- [ ] Origem dos assets e instruções de execução entregues.
- [ ] Nenhum recurso opcional exigido para concluir o núcleo sem áudio.
