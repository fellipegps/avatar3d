# Verificação — Fase 08

Executada em 08/10/2026, Windows, Node 24.15.0, npm 12.0.2, Chromium integrado ao Codex. Fase concluída no escopo da interface DOM; respostas locais e coordenação ainda dependem das fases 09/10.

## Critérios e evidências

| Critério | Verificação executada |
| --- | --- |
| Chat HTML independente do canvas | `/tests/chat.html` monta somente views DOM, sem canvas. UI importa apenas tipos dos contratos; cena/provider não são acessados. Aplicação completa mantém um canvas. |
| Tags como texto | Checks com `img`, `script` e `b` não criam elementos executáveis. Fixture e envio por teclado mostram `<b>literal</b>` literalmente. |
| Enviar/reiniciar/abrir/fechar demonstráveis | Callbacks controlados nos checks e interação real registrada em [eventos-teclado.json](eventos-teclado.json), incluindo qualidade e movimento. |
| Campo preservado ao trocar estados | `waiting`, `revealing`, `error` e `idle` preservam valor, seleção e foco. Interação real error → fechar → abrir preservou “Rascunho preservado”. |
| Rótulos e foco visível | Labels, `aria-controls`, `aria-expanded`, regiões status/alert/log e foco do textarea verificados no DOM. Fechamento leva foco ao botão externo; reabertura ao campo. Contorno visível nas capturas. |
| Fechar/reabrir preserva conteúdo | Checks com mensagens, rascunho e histórico rolado a 30 px, incluindo atualização enquanto fechado. Produção também preservou rascunho e foco. |

## Execução

- `npm run typecheck`: saída 0, [log](typecheck.log).
- `npm run build`: saída 0, [log](build.log). JS 663,30 kB / 169,94 kB gzip; CSS 6,38 kB / 1,98 kB gzip. Aviso de chunk acima de 500 kB permanece para a fase 12.
- `/tests/chat.html`: **31/31** checks passaram; [resultados completos](checks-interface.json). Incluem vazio, limite, corte seguro de emoji, excesso defensivo, bloqueio durante espera/apresentação, texto seguro, preservação de nós, rolagem, abertura e descarte idempotente/listeners/trabalho tardio. IME e eventos dessa suíte são simulações controladas.
- Teclado pela automação do navegador: preenchido “Primeira linha”, Shift+Enter resultou em `Primeira linha\n`; digitada segunda linha com tags; Enter emitiu uma mensagem completa com a quebra. Sem envio intermediário. Estado de espera bloqueou novo envio. Alterados erro, fechar, abrir, qualidade e movimento; reinício restaurou as duas mensagens. [Eventos](eventos-teclado.json).
- `/tests/scene.html`: **24/24** checks de regressão passaram; [resultados](checks-ciclo-de-vida.json). Relógio, visibilidade e DPR continuam controlados por essa suíte; não houve teste novo de ocultação nativa.
- Página principal DEV: Vita carregada e um canvas; layout lateral em **1280×720**, empilhado em **425×570**. Mensagem real de **1.981 unidades UTF-16**, incluindo sequência longa sem espaços e tags, ficou contida no histórico: `clientWidth = scrollWidth = 353`; documento 410 px para viewport de 425 px. [Desktop](desktop-dev.jpg), [estreito/texto longo](estreito-dev.jpg).
- Preview de produção em `127.0.0.1:4173`: um canvas, Vita carregada, sem fixture/inspetor; envio/reinício/qualidade/movimento desabilitados com avisos de preparação. Campo permanece editável e abrir/fechar preserva rascunho/foco. [DOM desktop](producao-desktop.json), [DOM estreito](producao-estreita.json), [desktop](preview.jpg), [estreito](estreito-preview.jpg).
- Zero avisos/erros capturados nas páginas de UI, desenvolvimento e produção: [console](console.json). O aviso do empacotador está registrado separadamente no build.

## Decisões e limites

As views recebem dados e emitem intenções tipadas. Não geram respostas, não alteram o domínio, não comandam a personagem e não criam outro loop. `src/main.ts` monta as views e coordena somente a abertura DOM; `AppController` mantém sua responsabilidade 3D atual. `base.css` foi preservado e complementado por `layout.css`/`chat.css`. A fixture usa `import.meta.env.DEV` e não entra no build de produção. Nenhuma dependência adicionada.

`maxlength` conta unidades UTF-16, não grafemas. A API evita cortar um par surrogate; teclado IME físico, leitor de tela, Safari/Firefox, celular real e matriz de GPUs não foram testados. Não há medição nova de FPS ou promessa de desempenho. Responsividade/acessibilidade completas permanecem na fase 11; aqui foram verificados rótulos, foco, teclado e dois tamanhos. Não foram reexecutadas as suítes de asset, ambiente, materiais, corpo ou face, cujos módulos não mudaram. Respostas, cancelamento do provider e apresentação gradual serão verificados após implementação das fases 09/10.
