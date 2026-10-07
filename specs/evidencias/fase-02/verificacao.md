# Verificação da fase 02 — 07/10/2026

## Fluxo verificado

Página inicial → AppController → SceneController → canvas WebGL 2. Disponibilidade/falhas retornam ao AppController, que atualiza somente a apresentação da cena; a área da interface continua presente. Não há API/backend/chat funcional nesta fase.

## Critérios de aceitação

| Critério | Evidência executada |
| --- | --- |
| Um canvas WebGL e um loop | GPU real e RAF instrumentado: um canvas e um callback pendente. Confirmado também um canvas na página de produção. |
| Proporção após resize | ResizeObserver real: 240×160, 32×16, 1×1 e largura solicitada 600×360 (543×360 disponíveis na rodada final). Aspecto, buffer e projeção horizontal/vertical comparados; razão projetada 1 dentro de tolerância 1e-8. Inspeção visual do cubo na página. |
| Contêiner pequeno ou sem área | Até 1×1 sem exceção; 0×0 cancela RAF e mantém projeção finita; restauração agenda apenas um frame. |
| Ocultar/retomar sem avanço brusco | Visibilidade **simulada** com `document.hidden` e `visibilitychange`: nenhum update oculto, um RAF na retomada, primeiro delta zero. Relógio injetado: 0 s, 0,016 s e máximo 0,05 s após salto de tempo. Ocultação nativa não coberta; ver limites abaixo. |
| Desmontar/remontar sem duplicação | Dispose duplo: geometria/material liberados uma vez, zero canvas/RAF/listeners/observers. Três remontagens: um canvas/RAF/observer, seis listeners de ciclo de vida em cada montagem. Nova instância no mesmo contêiner descarta a anterior. |
| Falha controlada | WebGL 2 ausente forçado retornando null em getContext: aviso legível, nenhum canvas/frame remanescente, interface preservada. Falha de atualização durante frame também controlada e descartada. [Captura](falha-renderer.jpg). |

Checks adicionais: limites de DPR 1,5 normal / 1 econômico (DPR 3 injetado); rotação parada com movimento reduzido; perda/restauração **reais** de contexto usando `WEBGL_lose_context`, com retomada de um único RAF.

Resultado final: **24/24 verificações passaram** em [testes-browser.json](testes-browser.json); [captura](testes.jpg). A fonte reexecutável é [tests/scene.browser.ts](../../../tests/scene.browser.ts), aberta em `/tests/scene.html` no Vite de desenvolvimento. Renderer/GPU e ResizeObserver são reais; RAF, visibilidade e DPR são instrumentados nessa página isolada. Sem nova dependência de testes. A instrumentação não entra no bundle de produção.

## Comandos e página de produção

- `npm run typecheck`: código 0, [log](typecheck.txt).
- `npm run build`: código 0, [log](build.txt), arquivos de produção gerados em dist.
- Dev existente na porta 5173 reutilizado após uma tentativa de iniciar outro servidor informar porta ocupada. `/` abriu com o cubo e status “Cena de referência”.
- Preview existente na porta 4173 serviu o build atualizado. [Página completa](preview.jpg), [inspeção de DOM/console](preview-navegador.json): um canvas, CSS/buffer 541×300, viewport 598×484, sem overflow horizontal.

## Limites e observações

- O navegador integrado não emitiu `visibilitychange` nativo ao esconder o painel nem nas tentativas de troca de aba/atalho. Por isso a evidência de pausa/retomada é a simulação controlada no navegador, não uma validação em aba externa minimizada. O monitor de visibilidade da página de testes permite repetir esse check nativo quando houver navegador compatível disponível.
- Foi solicitada uma mudança de viewport para 1280×720 pela ferramenta; a leitura do DOM permaneceu 598×484. Não se declara teste desktop nessa resolução. O override foi resetado. Resize **do contêiner** foi efetivamente executado e passou nos tamanhos acima.
- Os logs da aba de testes reutilizada no preview retêm mensagens esperadas “Error creating WebGL context” das falhas deliberadas anteriores; não equivalem a falha da página de produção, cuja disponibilidade foi confirmada e cujo cubo foi renderizado. Uma captura anterior parcial foi preservada como [preview parcial](preview-parcial.jpg).
- A primeira execução de 21 checks passou. A expansão e reexecução identificaram duas falhas na instrumentação: comparação sem arredondamento em largura ímpar e contagem de listeners da automação. Os testes foram corrigidos e a rodada final passou com 24 checks.
- Aviso do Vite: JS minificado 530,77 kB / gzip 132,45 kB, acima do limiar de 500 kB. Não se alterou o limiar; registrar para a fase 12. Não houve benchmark, teste em celular físico ou matriz de navegadores.
- Nenhum GLB, sala final, controles de órbita, áudio, chat funcional ou deploy foi acrescentado. O cubo de referência deve ser removido antes da cena final.

Referências consultadas: [documentação do Three.js](https://threejs.org/docs/#WebGLRenderer) e código da versão 0.186.1 instalada, incluindo inicialização WebGL 2 e liberação do renderer.
