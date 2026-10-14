# Fase 12 — Resiliência, desempenho e entrega

Verificada em **09/10/2026**. Núcleo 01–12 concluído com as limitações de cobertura abaixo. Extensões 13/14 não solicitadas; nenhuma publicação realizada.

## Entrega e caminhos de falha

- `AppController` oferece **Tentar carregar o 3D**. Falha do GLB reutiliza o renderer; indisponibilidade/perda de contexto permite recriar a cena após descartar a anterior. Repetição durante carga é bloqueada. Histórico, rascunho, preferências e estado da conversa permanecem no controlador existente.
- Imagem estática SVG local, ilustrada para este projeto, cobre os caminhos de falha. Não representa a personagem final. O fluxo normal continua usando Vita real, seu rig, clipes e controles faciais.
- `AssetLoader` limita download + parse a 30 segundos. Erro de prazo é visível e permite nova tentativa. Aborto libera imediatamente a espera; parse não interrompível que termina depois é descartado. Timer e listener do prazo são removidos em `finally`.
- Recuperação automática de contexto já existente preserva o canvas/modelo. A tentativa manual oferece saída caso o navegador não restaure o contexto.
- `BASE_URL` resolve GLB e fallback. [Preview em subpasta](preview-base.json) mostra `/avatar3d/images/scene-fallback.svg` decodificado e modelo carregado; [requisições HTTP](transferencia-base.json) retornaram 200.

## Checks executados

**257/257 aprovados**, somando 29 testes de domínio/provider e 228 verificações no navegador:

| Suíte | Resultado | Evidência |
| --- | --- | --- |
| Domínio e provider | 29/29 | [Log](testes.log) |
| Resiliência nova, build de produção isolado | 15/15 | [Resultados](checks-resiliencia.json) |
| GLB e loader | 26/26 | [Resultados](checks-personagem.json) |
| Ciclo de vida | 24/24 | [Resultados](checks-scene.json) |
| Ambiente | 14/14 | [Resultados](checks-environment.json) |
| Materiais/painéis | 10/10 | [Resultados](checks-lighting.json) |
| Animações | 21/21 | [Resultados](checks-animation.json) |
| Face | 41/41 | [Resultados](checks-face.json) |
| Interface | 31/31 | [Resultados](checks-chat.json) |
| Integração | 18/18 | [Resultados](checks-app-controller.json) |
| Acessibilidade/enquadramento | 28/28 | [Resultados](checks-accessibility.json) |

Falhas controladas: HTTP 404, download que não termina, cancelamento com parse real pendente, ausência de WebGL por substituição de `getContext`. Perda/restauração usa a extensão real `WEBGL_lose_context`. O chat completou respostas nos estados sem GLB, sem WebGL e com contexto perdido. Inspeção visual da [falha](fallback.png) e [recuperação](recuperacao.png), preservando a conversa, realizada no build de verificação.

Três recargas do GLB mantiveram **24 geometrias, 32 texturas e 10 programas** no renderer. O parse tardio liberou as 16 geometrias observadas uma vez. A suíte de ciclo de vida confirmou remontagens sem crescimento de canvas/RAF/listeners/observers e nenhum restante após descarte. As suítes de ambiente, face, corpo, UI e provider cobrem liberação de recursos compartilhados, mixer, assinantes e timers. Isto não equivale a uma análise longa de heap/VRAM do driver.

## Build e reprodução

- `npm run typecheck` passou; executado também em todos os builds abaixo.
- `npm run build`: [log](build.log).
- Instalação em cópia temporária isolada `.tmp/fase12-repro`: `npm ci --prefix .tmp/fase12-repro`, [log](instalacao-limpa.log), seguido de [build limpo](build-limpo.log). Uma tentativa anterior offline falhou por ausência do pacote Vite no cache; a instalação pelo registro funcionou. A cópia não alterou as dependências do checkout.
- Os cinco arquivos distribuídos têm SHA-256 idêntico entre build principal e instalação limpa: [comparação](build-reproduzivel.json).
- `npm run build -- --base=/avatar3d/ --outDir .tmp/base-preview`: [log](build-base.log). Preview local em 4175, com `--base=/avatar3d/ --outDir .tmp/base-preview`.
- `npm run build -- --config tests/vite.config.ts`: [log](build-verificacao.log). Gera apenas a ferramenta de verificação em `.tmp/verification`, servida com `npm run preview -- --outDir .tmp/verification --port 4174`. As páginas de teste não integram `dist/` do produto.
- Nenhuma dependência nova; package.json/lockfile preservados. O build limpo emitiu aviso de opção de ambiente npm `global-ignore-file`, sem impedir instalação/build.

## Desempenho medido

[Equipamento](equipamento.json): Windows 10.0.26200, Intel Core i7-1185G7, 8 processadores lógicos, 16,71 GB de RAM, GPU **Intel Iris Xe** via ANGLE/D3D11. Chromium integrado 155, Node 24.15.0, npm 12.0.2.

Ferramenta `tests/performance.html`, compilada para produção, usa o SceneController real e o loop existente. Cada amostra tem 2 s de aquecimento e uma janela de 10 s, alternando idle/thinking/responding/idle. Mede intervalos não limitados com `performance.now()` entre atualizações; **não é tempo exclusivo de GPU**. Sem limitação artificial de CPU/rede. Cena isolada de medição, sem o chat DOM; o fluxo completo foi inspecionado separadamente no preview.

Viewport **1280×720**, canvas CSS **900×440**. DPR nativo 1. DPR solicitado 2 é injetado somente na ferramenta para exercitar os limites, sem simular hardware móvel. [Dados completos](desempenho.json).

| Perfil | DPR solicitado / efetivo | FPS estimado médio | Intervalo médio | p95 | Frames >33,34 ms |
| --- | --- | --- | --- | --- | --- |
| Normal | 1 / 1 | 59,86 | 16,71 ms | 19,80 ms | 1/598 |
| Econômico | 1 / 1 | 59,97 | 16,68 ms | 18,90 ms | 0/599 |
| Normal | 2 / 1,5 | 59,89 | 16,70 ms | 18,70 ms | 1/599 |
| Econômico | 2 / 1 | 59,98 | 16,67 ms | 18,40 ms | 0/600 |

| Referência | Resultado |
| --- | --- |
| Personagem ~60 mil triângulos | 26.130, GLB real validado pela suíte da personagem |
| Ambiente ~40 mil | 1.574 únicos, suíte de ambiente |
| ~80 draw calls | 59; 28.664 triângulos efetivamente desenhados por frame |
| Transferência essencial ~15 MB | **9.010.378 bytes (9,01 MB)** de corpos HTTP, com gzip de JS/CSS; 9.519.198 bytes decodificados |
| 60 FPS desktop | Aproximadamente atingido no equipamento e nas amostras acima |
| 30 FPS celular de referência | **Não verificado: celular físico indisponível** |

[Transferência medida](transferencia.json) inclui HTML, JS, CSS, GLB e SVG de fallback, todos HTTP 200. Exclui headers/protocolo; não mede latência de rede móvel. Reproduzir com `node scripts/measure-transfer.mjs http://127.0.0.1:4173/`.

Decisão: manter limites **normal 1,5 / econômico 1**, sem shadow maps ou pós-processamento. O perfil econômico reduz pixels quando o DPR nativo é maior que 1; em DPR 1 os dois têm o mesmo custo de resolução. Não houve necessidade medida de compressão avançada ou redução adicional das duas texturas de 2048 px. Elas excedem a preferência inicial de 1024, mas o conjunto ficou dentro das metas disponíveis. Sem benchmark móvel, isto permanece uma restrição a reavaliar nesse equipamento.

Aviso de chunk >500 kB permanece visível: JS **675,73 kB**, gzip estimado pelo build 173,36 kB e transferido pelo preview 172,10 kB (compressão diferente). Nenhum limite de aviso foi aumentado. O orçamento de transferência e o desempenho medidos foram atendidos; carregamento progressivo de Three.js é uma possível otimização futura caso medições de rede/dispositivos mais lentos justifiquem.

## Fluxo e aparência em produção

- Preview normal: pergunta “Quem é você?”, espera, resposta completa, retorno a pronto, reinício durante espera e nova resposta “Olá!” sem ressuscitar a antiga. [Registro do DOM e console](preview-fluxo.json), sem avisos/erros nesse fluxo.
- [Desktop 1440×900](desktop.png) e [móvel emulado 390×844](mobile-390.png) inspecionados. No móvel: documento com 390 px, um canvas 356×337, sem overflow horizontal; qualidade econômica e movimento reduzido funcionais.
- [Preview em subdiretório](preview-base.png), com um canvas e Vita carregada.
- Origem/licença do GLB e preparação reproduzível: [créditos](../../../assets/credits.md).

## Limites e próximos passos

Sem celular físico, teclado virtual real, leitor de tela real, matriz Firefox/Safari, benchmark térmico prolongado, rede móvel ou análise de heap do driver. Ocultação da aba continua coberta por evento/estado controlados, sem comprovação da ocultação nativa neste navegador integrado. As medições não prometem 60 FPS em qualquer computador.

Sem bloqueio dos critérios essenciais do núcleo. Ao obter celular de referência, executar a mesma matriz de perfis e revisar DPR/texturas caso fique abaixo de 30 FPS. Áudio continua opcional e fora desta entrega.
