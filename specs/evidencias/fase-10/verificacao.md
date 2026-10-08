# Verificação da fase 10 — 08/10/2026

## Resultado e escopo

Integração concluída na aplicação principal: AppController monta UI/store/provider/cena, coordena espera, apresentação e repouso, cancela trabalho antigo e mantém a conversa disponível sem 3D. Sem dependências novas, serviços externos, áudio ou alterações nos módulos da cena. `ScenePort.resetFace()` explicita a capacidade existente de neutralizar a face.

## Critérios e evidências

| Critério | Verificação executada |
| --- | --- |
| Saudação: idle → thinking → responding → idle | Check 5 da integração e [vídeo real](fluxo-integrado.webm), com [tempos registrados](video.json). |
| Digitar durante espera, sem segundo envio | Check 1; [preview.json](preview.json) registra rascunho durante waiting e depois da resposta, envio novamente habilitado. |
| Reset antes/durante apresentação sem resposta atrasada | Checks 7–10, provider que ignora abort e relógio controlado; conferidos timer removido, sinal abortado e histórico novo preservado. |
| Resposta antiga não altera solicitação nova | Resolução, rejeição e finally antigos exercitados nos checks 7–10 e 13. |
| Erro retorna ao repouso e permite recuperação | Checks 11–12; falha DEV na demonstração real e nova ajuda concluída em [demonstracao.json](demonstracao.json). |
| Chat funciona com cena indisponível | Check 16 com falha de construção; demonstração com perda real de contexto via WEBGL_lose_context, resposta completa e posterior restauração, em [demonstracao.json](demonstracao.json). |
| Fechar não perde histórico nem duplica aplicação | Check 4 confere identidade dos nós e única criação de cena; preview fechado/reaberto preservou rascunho/histórico, com um canvas em [preview.json](preview.json). |
| Texto completo no domínio, parcial somente na UI | Checks 2–3 conferem texto integral, início vazio, avanço parcial sem publicação adicional do store, rascunho e foco preservados. |
| Qualidade e movimento reduzido funcionais | Check 6 verifica comandos da cena sem recriação; checks 14–15 verificam texto imediato, inclusive ao ativar durante apresentação. Perfil econômico selecionado no preview real. |
| Cancelamento e descarte | Checks 17–18 verificam abort na espera/apresentação, ausência de timer, descarte único e resultado tardio ignorado. |

## Testes e comandos executados

- `npm test`: **29/29**, saída 0 — [log](testes-dominio.log).
- `npm run typecheck`: saída 0 — [log](typecheck.log).
- `npm run build`: saída 0 — [log](build.log).
- `/tests/app-controller.html`: **18/18** — [resultados](checks-integracao.json).
- `/tests/chat.html`: **31/31**, regressão da UI — [resultados](checks-interface.json).
- `/tests/scene.html`: **24/24**, regressão de ciclo de vida — [resultados](checks-ciclo-de-vida.json).

Total: 102 checks/testes aprovados nas quatro suítes executadas. Os 18 checks novos usam DOM, AppController, ChatView, ControlsView e store reais; provider, tempo e ScenePort são controlados para tornar as corridas reproduzíveis. Esses checks não medem animação visual; a demonstração separada usa SceneController, GLB, provider e tempo reais.

## Inspeção visual e vídeo

- [Preview de produção](preview.jpg): saudação completa, Vita/escritório, perfil econômico, rascunho “Meu próximo assunto”, envio disponível e um canvas. Aberto em `http://127.0.0.1:4173/` após build.
- [Vídeo integrado](fluxo-integrado.webm): WebM/VP9, 403.317 bytes. Gravação de aproximadamente 5,56 s de tempo de parede; duração do vídeo lida no navegador: 5,39 s. Metadados registram 332 atualizações do compositor, não uma medição de FPS nem contagem de quadros codificados.
- O vídeo usa composição 2D de verificação (1100×560): copia o canvas WebGL real depois de renderizar e inclui texto efetivamente visível no DOM e estados correntes. Não é captura da página inteira. Usa o updater da cena existente, sem outro RAF. A reprodução foi aberta no navegador e um [quadro inspecionado](quadro-video.jpg).
- Durante a gravação: idle em 0,009 s; waiting/thinking em 0,604 s; revealing/responding em 1,4215 s; idle em 3,0239 s. A etiqueta da personagem representa o estado solicitado; o mixer mantém sua transição gradual.
- Falha de resposta, ajuda com contexto gráfico perdido e restauração confirmadas em [registro da demonstração](demonstracao.json). Capturas auxiliares: [erro](erro.jpg), [sem 3D](sem-3d.jpg).
- [Console](console.json): nenhum aviso/erro capturado nas abas de produção, integração e UI, com filtro warn/error. A perda deliberada de contexto não apareceu nesse filtro.

## Reprodução

1. Executar `npm test`, `npm run typecheck`, `npm run build` e `npm run preview`.
2. No preview, enviar “Olá!”, preparar outro rascunho, fechar/reabrir e conferir resposta, rascunho e controles. Reiniciar limpa conversa e restaura repouso.
3. Com `npm run dev`, abrir `/tests/app-controller.html` e conferir 18/18. A demonstração abaixo dos resultados permite falha de resposta e perda/restauração do 3D.
4. Clicar **Gravar fluxo integrado** após carregar Vita. O vídeo e os metadados aparecem abaixo. Executar também `/tests/chat.html` e `/tests/scene.html` para as regressões registradas.

## Decisões e limites

- Apresentação usa 55 pontos de código/s e timer de 32 ms calculado por tempo decorrido, sem depender dos frames da cena nem alterar o store por letra. Movimento reduzido entrega texto imediatamente. Escolha manual prevalece sobre futuras mudanças do sistema durante a sessão.
- AbortController, identidade da solicitação e ID do store protegem resolução/rejeição/finally. Reset invalida antes de abortar. Erro do 3D fica isolado dos handlers da conversa.
- Ambiente Windows e Chromium integrado; viewport padrão 1280×720, captura de página completa. Dev existente na porta 5173 reutilizado após tentativa informar porta ocupada. Preview na 4173 iniciado para este build.
- Não houve novo teste de ocultação nativa, celular físico, leitor de tela, matriz de navegadores/GPU ou benchmark. Relógio controlado cobre apresentação independente de frames; a suíte da cena verifica suspensão por visibilidade simulada.
- Não foram reexecutadas as suítes completas de asset/ambiente/face/animação, cujos módulos não mudaram. A inspeção integrada demonstrou a personagem real.
- Build: JS 672,15 kB (172,51 kB gzip), CSS 6,38 kB (1,98 kB gzip). Aviso de chunk acima de 500 kB preservado para fase 12. Responsividade/acessibilidade completa permanece na fase 11. Núcleo ainda não declarado concluído.
