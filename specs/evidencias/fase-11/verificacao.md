# Verificação da fase 11 — 09/10/2026

## Resultado

Fluxo local utilizável em desktop e telas estreitas, com reenquadramento frontal estático, alvos de 44 px, foco nativo visível, acesso ao fim do histórico e publicação acessível da resposta completa. Contratos de domínio/provider/ScenePort preservados; sem dependências novas. Cobertura móvel por emulação, conforme previsto na especificação.

## Critérios de aceitação

| Critério | Evidência executada |
| --- | --- |
| Sem overflow em 360, 390, 768 e 1440 px | Preview de produção nos quatro tamanhos. `scrollWidth <= clientWidth` em [tamanhos.json](tamanhos.json). [360](mobile-360.jpg), [390](mobile-390.jpg), [768](tablet-768.jpg), [1440](desktop-1440.jpg). |
| Rosto visível e chat utilizável | Inspeção das quatro capturas com GLB/cena reais e conversa concluída. Checks automatizados projetam cabeça/mãos dos três estados em quatro proporções de contêiner, usando câmera, mixer e ResizeObserver reais. |
| Campo/envio alcançáveis com teclado virtual | Emulação de espaço disponível: 390×360, histórico reduzido a 120 px, campo e botão Enviar visíveis após Tab; botão habilitado e foco de 3 px. [Registro](teclado-altura-reduzida.json), [captura da viewport](teclado-altura-reduzida.jpg). Sem teclado virtual físico. |
| Ações principais por teclado | Tab até qualidade, ArrowDown selecionando Econômica, Tab/Espaço ativando movimento reduzido, Enter fechando/abrindo, Enter enviando, Shift+Enter criando linha e Tab/Enter reiniciando. [Registro](teclado.json). Home no histórico longo e Enter em “Ver mensagens recentes”: [registro](historico-longo.json). |
| Movimento reduzido sem gestos/câmera repetitivos/letras | Preferência inicial e mudança do sistema controladas por MediaQueryList de teste; escolha manual prevalece. Cena real mantém tempos dos clipes e câmera imóveis; apresentação imediata já coberta pela integração. Câmera só muda no resize, sem tween. |
| Resposta completa anunciada uma vez | MutationObserver e DOM/ARIA reais: região visual `aria-live=off`, região completa polite/atômica; zero publicações parciais e uma ao concluir. Repetição de ID não publica de novo; IDs diferentes com texto igual publicam individualmente. Abort/reset não anunciam texto cancelado. Fechar esvazia anúncio antigo; resposta terminada fechada aguarda reabertura. **Não houve escuta com leitor de tela real.** |
| Orientação conserva cena/conversa | Preview 390×844 → 844×390 → 390×844 manteve um canvas, duas mensagens e rascunho “Rascunho preservado”. [Registro](orientacao.json), [paisagem](paisagem.jpg). Testes automatizados comparam identidade do canvas e câmera após quatro resizes, sem recriação. |

As coordenadas verticais negativas dos registros móveis refletem a página rolada até o campo, não um corte do rosto pelo enquadramento. Capturas de página completa mostram cena e chat no fluxo vertical. `clientWidth` pode ser 15 px menor que `innerWidth` por causa da barra vertical do Chromium; a comparação de overflow usa a largura útil real.

Após o último build, o [preview final](preview.jpg) foi reaberto na viewport padrão 1280×720, com perfil normal e movimento reduzido desativado. Saudação concluída, Vita carregada e um canvas confirmados em [preview-final.json](preview-final.json), sem avisos/erros capturados nessa aba.

## Comandos e checks executados

| Suíte/comando | Resultado | Evidência |
| --- | --- | --- |
| `npm test` | 29/29; saída 0 | [Log](testes-dominio.log) |
| `npm run typecheck` | Saída 0 | [Log](typecheck.log) |
| `npm run build` | Saída 0 | [Log](build.log) |
| `/tests/accessibility.html` | 28/28 novos | [Resultados](checks-acessibilidade.json) |
| `/tests/chat.html` | 31/31 | [Interface](checks-interface.json) |
| `/tests/app-controller.html` | 18/18 | [Integração](checks-integracao.json) |
| `/tests/scene.html` | 24/24 | [Ciclo de vida](checks-ciclo-de-vida.json) |
| `/tests/environment.html` | 14/14 | [Ambiente/enquadramento](checks-ambiente.json) |
| `/tests/animation.html` | 21/21 | [Corpo](checks-animacao.json) |
| `/tests/face.html` | 41/41 | [Face](checks-face.json) |

**206 checks/testes aprovados**: 177 no navegador e 29 de domínio. Após o ajuste final de limpeza do anúncio ao fechar, foram reexecutados os 28 checks novos, 31 de interface, 18 de integração, tipos e build. As demais regressões verificaram a versão final dos módulos 3D/CSS, que não mudaram depois.

## Como reproduzir

1. Executar `npm test`, `npm run typecheck`, `npm run build` e `npm run preview`.
2. No preview, testar larguras 360/390/768/1440, enviar “Olá!”, guardar rascunho, alternar retrato/paisagem e conferir um canvas/histórico preservado. Reduzir altura para 360 px, focar campo e navegar com Tab até Enviar.
3. Usar Tab/Shift+Tab, Enter e Espaço nos controles e ações. Com movimento reduzido, resposta chega inteira; sem ele, a UI revela texto gradualmente.
4. Executar `npm run dev` e abrir `/tests/accessibility.html` para 28/28 e a demonstração com histórico longo. Abrir as demais páginas da tabela para as regressões.
5. Para complementar a cobertura, repetir o fluxo em celular físico com teclado virtual e em leitor de tela, verificando a fala efetiva da região acessível.

## Decisões e limites

- Desktop: painel `clamp(340px, 28vw, 400px)` e cena predominante. Até 880 px, empilhamento com formulário no fluxo normal, sem painel fixo sobre o teclado. Cena entre 220–340 px e histórico entre 120–280 px, com `dvh` e fallback `vh`.
- Câmera frontal interpola configuração compacta/completa entre aspectos 1 e 1,7; vistas de inspeção continuam independentes. Cabeça e mãos foram amostradas depois de 30 frames em cada estado/proporção; isso não é prova de cada vértice em cada instante do clipe.
- Anúncio completo ocorre ao terminar `presentMessages`, uma vez por ID; reset limpa memória/pedido pendente. Reabrir não reexpõe texto antigo na região live. Não há gravação por letra no domínio nem ligação de texto a ossos/materiais.
- Ambiente Windows, Node 24.15.0/npm 12.0.2 e Chromium integrado. Viewports emulados: 1440×900, 360×800, 390×844, 768×1024, 844×390 e 390×360. Capturas de página completa, exceto teclado de altura reduzida. Overrides temporários removidos ao terminar.
- O primeiro servidor iniciado dentro do isolamento não ficou acessível ao navegador. Ele foi encerrado e o servidor local reiniciado com acesso adequado; dev na 5173 e preview na 4173. Não houve publicação.
- [Console](console.json): produção final e suíte nova sem warn/error capturados; a aba usada para regressões registrou um erro esperado de criação de WebGL durante o caso de falha deliberada da suíte da cena. Corpo/face sem warn/error capturados.
- Sem celular físico, teclado virtual nativo, leitor de tela real, Firefox/Safari, matriz de GPUs, ocultação nativa nova ou benchmark. Não se afirma conformidade integral com WCAG nem fala idêntica em todos os leitores. Não foi reexecutada a suíte completa do loader/iluminação, cujos módulos não mudaram.
- Build final: JS 673,59 kB / 172,87 kB gzip; CSS 6,98 kB / 2,19 kB gzip. Aviso de chunk acima de 500 kB permanece para fase 12. O núcleo ainda depende da fase 12.
