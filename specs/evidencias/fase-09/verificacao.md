# Verificação — Fase 09

Executada em 08/10/2026. Windows, Node 24.15.0, npm 12.0.2 e Chromium integrado ao Codex. Domínio e provider independentes entregues; integração de produção aguarda fase 10.

## Critérios de aceitação

| Critério | Evidência executada |
| --- | --- |
| Provider sem UI/renderer | 15 testes do provider executados em Node, sem `document`, DOM ou Three.js. Módulos importam apenas contratos/catálogo e não acessam rede. |
| Caixa/acentos equivalentes | Testes para `Olá!/OLÁ/ola`, `Quem é você?/QUEM E VOCE`, `cenário/CENARIO`, `ajuda/AJÚDA!`; catálogo de cinco intenções e limites de palavras (boi/escolar não são saudação) verificados. |
| Resposta padrão coerente | Texto desconhecido, vazio e emoji retornam orientação para saudação/apresentação/cenário/ajuda; demonstração real recuperou de erro com “astronomia quântica”. |
| Cancelar impede resposta | Testes com relógio controlado: sinal pré-abortado, cancelamento em 799 ms antes de 800 ms, avanço posterior de 5.000 ms, zero respostas e zero timers/listeners. Sinais isolados e abortar após resolução também verificados. |
| Store notifica eventos, sem animação | 14 testes do store; sequência inicial idle → waiting → revealing → idle, resposta completa em uma mudança, erro/recuperação, snapshots congelados, notificações reentrantes, inscrição/remoção/descarte. Sem relógio, canvas ou atualização por frame. |
| Transições e cancelamento passam | **29/29 testes** passaram por `npm test`: [log completo](testes.log). Reinício em waiting/revealing, IDs antigos, finalização/falha/cancelamento tardios, duplicidade de ID e Promise antiga resolvida após nova solicitação estão cobertos. |

## Comandos reais

- `npm test`: saída 0, 29 testes, 29 passaram, 0 falhas/cancelados/ignorados. Runner nativo do Node; TS compilado por `tsconfig.domain-tests.json` em `.tmp/domain-tests/`. Sem dependência nova. O relógio de teste controla o agendador do provider, não espera tempo real.
- `npm run typecheck`: saída 0, [log](typecheck.log).
- `npm run build`: saída 0, [log](build.log). JS 663,30 kB / 169,94 kB gzip e CSS 6,38 kB / 1,98 kB gzip, iguais à fase 08. Módulos de domínio não são importados pela entrada principal antes da fase 10. Aviso de chunk acima de 500 kB permanece para a fase 12.
- `/tests/chat.html`: regressão **31/31** passou após compartilhar `MAX_MESSAGE_LENGTH`, preservando a exportação da UI e seu comportamento. [Resultados](regressao-interface.json).

## Demonstração no navegador

Servidor Vite local iniciado em `127.0.0.1:5173`. `/tests/conversation.html` importa store/provider e usa a `ChatView` existente, sem renderer. Provider usa seu agendador real e configuração de 800 ms; não foi medida precisão de latência real.

1. Enviado “OLÁ!” por Enter: waiting, envio desabilitado e rascunho digitado durante espera. Recebida saudação completa em revealing; rascunho preservado. [Captura](resposta.jpg).
2. Concluída apresentação pelo botão da fixture: idle. Habilitada falha DEV e enviado “Quem é você?”: error com mensagem explícita, sem resposta fictícia no histórico. [Captura](erro-simulado.jpg).
3. Enviado assunto desconhecido: recuperação waiting → revealing com resposta padrão.
4. Reiniciada apresentação e enviada “oi antiga”; reiniciada imediatamente a espera; enviada “ajuda nova”. Somente a nova mensagem e a resposta de ajuda ficaram no histórico, requestId 5.
5. Após concluir, enviada “cenário cancelado” e acionado Cancelar resposta antes da resolução. Voltou a idle sem erro, conservando a mensagem do usuário. Observação posterior ao prazo manteve o mesmo histórico, sem resposta tardia.

Snapshots completos, IDs, transições e bloqueio de envio: [demonstracao.json](demonstracao.json). [Console](console.json): zero avisos/erros capturados na demonstração e regressão UI. A falha simulada foi exibida na região de alerta, tratada sem rejeição não capturada.

## Decisões e limites

Store expõe snapshots imutáveis e requer ID ativo para transições de solicitação. ID não é reutilizado após reinício. `receive` mantém o texto completo e segura a solicitação em revealing até `complete`. IDs de usuário são exclusivos por instância do store; IDs do provider por instância/chamada resolvida. IDs de respostas duplicados no histórico são recusados.

`cancel` invalida a solicitação e mantém mensagens; `reset` limpa. Nenhum deles conhece `AbortController`: o consumidor deve abortar o provider. A fixture demonstra essa coordenação mínima; a coordenação de produção, apresentação gradual e comandos à personagem continuam na fase 10. Na página de teste, apresentação é concluída manualmente por botão. Não há provider, store ou falha DEV ligados à página principal nesta fase.

Normalização preserva texto original no domínio e só escolhe intenção; prioridade ajuda → apresentação → cenário → saudação → padrão. Entradas vazias ou acima de 2.000 unidades UTF-16 são rejeitadas pelo store sem mudança. Latência padrão fixa, sem aleatoriedade. Falha é módulo separado em `src/dev/MockChatFailure.ts`, importado só pela verificação; texto especial não dispara erro no provider normal.

A página principal DEV foi inspecionada em 1280×720: Vita carregada no escritório e um canvas, mantendo a fixture da fase 08 e sem a demonstração de domínio da fase 09 embutida. [Captura real](pagina-principal.jpg), [DOM](pagina-principal.json), [console sem avisos/erros](console.json). Não houve override de viewport nesta fase.

Sem celular físico, nova tela estreita, matriz de navegadores/GPUs, leitor de tela ou medição de FPS. Suítes de geometria, animação, face e ciclo de vida não reexecutadas: módulos 3D inalterados. Testes de integração de produção e vídeo do fluxo completo pertencem à fase 10. Nenhuma publicação ou serviço externo. A primeira tentativa de abrir a demonstração ocorreu com servidor desligado; após iniciar Vite, a validação foi executada em uma aba nova.
