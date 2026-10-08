# Fase 06 — Verificação real

Data: 07/10/2026. Status: concluída. Fase 05 concluída antes desta implementação. Nenhum asset, dependência ou contrato público de `ScenePort` alterado.

## Implementação

`CharacterController` substitui `CharacterPreview` e recebe o GLB já carregado por `AssetLoader`. Usa os nomes reais `Vita_Idle`, `Vita_Thinking` e `Vita_Responding`. Mantém mixer e três ações; não carrega novamente o modelo. `SceneController.tick` continua sendo o único relógio da aplicação e atualiza o mixer antes de renderizar.

A duração inicial é 0,3 s, ajustável em `characterManifest.animation.transitionSeconds`. Os pesos normalizados usam smoothstep. Uma interrupção parte dos pesos existentes; uma ação que ainda contribui mantém seu tempo quando escolhida novamente. Ao completar a mistura, as ações que saíram são paradas. Repetir o estado solicitado não reinicia ação nem fade. Os três clipes se repetem até outro comando: `setCharacterState('idle')` encerra a resposta; o fim do clipe não dispara retorno automático.

Movimento reduzido congela corpo e transição. Comandos recebidos durante essa pausa guardam somente o último pedido; ao retomar, a mistura parte da pose congelada. Comandos anteriores à carga do GLB também são preservados pela cena.

O controlador clona os clipes, impede animação do transform global e remove translações de `Root`/`J_Bip_C_Hips`, definidos no manifesto. O GLB atual já é in-place; o teste injeta deslocamentos nesses canais para exercitar a proteção. Essa regra é específica do rig validado, não um retargeter genérico. Clipes corporais com morph targets são rejeitados; olhos e boca permanecem independentes. Descarte para ações, remove bindings do mixer e libera o asset uma vez.

## Critérios e evidências

| Critério | Evidência executada |
| --- | --- |
| Três estados por comando | Sequência gravada com cena/GLB reais; [vídeo](transicoes.webm), [linha do tempo](gravacao.json). Painel de inspeção existente em desenvolvimento continua oferecendo os três estados. |
| Transições sem salto indevido | [21 checks](checks-animacao.json): pose instantânea preservada nos comandos, pesos normalizados, interrupções e trocas rápidas. Posição, escala, orientação e nós de root motion estáveis. Reprodução do WebM e inspeção visual no navegador complementam as amostras numéricas. |
| Comandos repetidos não reiniciam | Repetições em idle e durante uma transição, verificando avanço do tempo do clipe e conclusão da mistura. |
| Retorno ao repouso | Comando idle após os outros estados; conclusão da mistura e ação idle com peso 1. Último trecho do vídeo retorna ao repouso. |
| Independência de chat | Inspeção de `CharacterController.ts`: somente contratos tipados e módulos da cena, sem ChatView/MockChatProvider ou interpretação de texto. |
| Loop único e descarte | Inspeção de código: único `requestAnimationFrame` da aplicação em SceneController; CharacterController recebe delta. [24 checks da cena](checks-cena.json), além de descarte idempotente e comandos tardios nos checks da personagem/transições. A gravação agenda comandos com `registerUpdater` no loop existente. |

## Checks executados

- [npm run typecheck](typecheck.txt): código 0.
- [npm run build](build.txt): código 0, incluindo nova checagem de tipos.
- `/tests/animation.html`: **21/21**, [resultados](checks-animacao.json).
- `/tests/character.html`: **26/26**, [resultados](checks-personagem.json). A página anterior foi adaptada ao controlador e à conclusão da mistura, preservando os testes de asset, face, loops, cancelamento e falhas.
- `/tests/scene.html`: **24/24**, [resultados](checks-cena.json).
- `/tests/environment.html`: **14/14**, [resultados](checks-ambiente.json).
- **85/85 no total.** Falhas HTTP/abort e pontos de root motion são injetados de forma controlada; GLB, rig, mixer e renderer são reais. Os dez checks de iluminação da fase 05 não foram reexecutados nesta fase.
- Preview do build na porta 4173: Vita carregada, um canvas, zero inspetores e zero erros/avisos capturados na aba. [DOM/console](preview-navegador.json), [captura](preview.jpg). Os servidores locais existentes foram reutilizados.

O teste de trocas rápidas fez 120 avanços a 1/60 s, trocando comando a cada cinco avanços. O maior passo angular amostrado na cabeça/braço esquerdo foi 0,00760013 rad (limite do teste: 0,08 rad). Isso não cobre todos os ossos ou vértices. Nos comandos sem avanço do tempo, a igualdade dos componentes dos quaternions é exata; não se usa `angleTo` para provar identidade de quaternions com pequeno erro de normalização.

## Vídeo e ambiente

[transicoes.webm](transicoes.webm): VP9/WebM, **569.652 bytes**, **795×440**, duração reportada pelo elemento de vídeo **7,95822 s**. Gravado do canvas via `captureStream(30)` e MediaRecorder, sem áudio. O agendador da cena percorreu 8,0003 s em 828 atualizações; esse número é de callbacks do loop, não de quadros codificados nem medição de FPS. A [linha do tempo](gravacao.json) registra os instantes efetivos: sequência normal e trocas a cada 0,1 s entre 5 e 5,4 s, terminando em idle a partir de 6,7 s. O arquivo salvo foi reaberto e reproduzido no navegador integrado.

Windows, Node 24.15.0, npm 12.0.2, Chromium integrado com WebGL 2. Testes/gravação em página 1280×720, canvas 795×440; preview na largura padrão **425×570**, canvas **368×300**, DPR 1. Nenhum override de viewport foi aplicado nesta fase. Não houve medição nova de GPU/draw calls ou benchmark sustentado.

## Limitações

- Sem celular físico, matriz de navegadores/GPUs ou prova de continuidade de todos os ossos/vértices. Gestos são discretos, conforme os clipes existentes, sem física ou retargeting.
- Visibilidade da aba continua com a cobertura controlada da fase 02; não se declara validação nova de ocultação nativa.
- Chat, integração automática com a conversa e piscar automático ainda pertencem às fases seguintes. O retorno ao repouso é acionado por comando; o MVP completo continua pendente.
- Build registra JS de **652,86 kB / 166,99 kB gzip**, com o aviso de chunk acima de 500 kB mantido para a fase 12.
- Ferramentas de demonstração e gravação existem apenas no desenvolvimento. A produção usa o controlador, mas não inclui a página de testes ou o inspetor.

Próxima fase pendente: 07 — piscar e controles faciais, quando solicitada.
