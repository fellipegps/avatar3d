# Fase 07 — Verificação real

Data: 08/10/2026. Status: concluída. Dependência 06 concluída antes da implementação. GLB, dependências e lockfile preservados.

## Implementação e política

`FaceController` utiliza somente morph targets. A função `resolveFaceBindings`, compartilhada com `AssetLoader.inspectCharacter`, valida os nove meshes do manifesto, presença de arrays/índices finitos, inteiros e dentro da faixa, e canais distintos. Nomes ausentes ou incompatíveis geram erro de carregamento; não há fallback facial silencioso. O controlador guarda referências aos arrays e índices uma vez.

`setMouthOpen(value)` aplica clamp 0–1; NaN e infinitos viram zero. O máximo é o morph real `Face.M_F00_000_00_Fcl_MTH_A` com peso 1. Olhos usam `Face.M_F00_000_00_Fcl_EYE_Close`. Boca e olhos são escritos em canais independentes após o mixer de `CharacterController`, antes do render de `SceneController`. Clipes corporais com morph targets continuam rejeitados. Nenhum timer ou segundo RAF foi acrescentado à aplicação.

Piscar automático começa habilitado. Espera aleatória configurável entre **2,5 e 5,5 s**, contada novamente após cada ciclo. Fechamento **0,06 s**, pausa fechada **0,04 s**, abertura **0,1 s**, com smoothstep nas duas rampas. Usa delta do loop e consome a sobra entre fases. Deltas acima de 0,25 s reiniciam a espera; a cena já limita o delta a 0,05 s após suspensão. O processamento por chamada tem limite de oito transições para evitar trabalho ilimitado com configurações extremas.

Movimento reduzido cancela uma piscada automática em andamento, abre os olhos e suspende a repetição. Ajustes manuais estáticos e boca permanecem disponíveis; a retomada começa com uma nova espera. `setBlink` desativa o automático para manter o ajuste manual. `setAutoBlink(true)` libera esse ajuste. `resetFace()` neutraliza boca/olhos imediatamente e preserva a preferência de automático. O botão de restauração do inspetor da aplicação reativa o automático explicitamente. Descarte neutraliza os dois canais, libera as referências e ignora comandos tardios.

A boca fica no valor solicitado até outro comando/reset. As demonstrações são identificadas como manuais e sem áudio; não há sincronização de fala. `ScenePort` mínimo permanece igual; métodos adicionais de reset/inspeção estão em CharacterController/SceneController.

## Critérios de aceitação e evidências

| Critério | Verificação executada |
| --- | --- |
| Boca 0 fechada; 1 máximo do asset | Valores conferidos nos nove meshes; inspeção visual de [reset/zero](reset-neutro.jpg), [0,5](boca-intermediaria.jpg) e [1](boca-maxima.jpg). Amostra de vértice realmente deformada, descrita abaixo. |
| Fora da faixa sem deformação indevida | Testados -5, 4, NaN, Infinity e -Infinity em ambos os canais, com clamp/zero em todos os meshes. |
| Piscar em idle/thinking/responding | Nove combinações de estado × boca (0, 0,5, 1), corpo ativo, fechamento máximo e reabertura. Quadros reais do automático: [idle/boca 0](piscar-idle.png), [thinking/boca 0,5](piscar-thinking.png), [responding/boca 1](piscar-responding.png). |
| Boca e olhos independentes | Boca constante durante cada ciclo e troca corporal; ajustes manuais simultâneos também verificados. Imagens mostram os três valores de boca com olhos fechados automaticamente. |
| Reset neutro | FaceController e CharacterController testados; botão da página de demonstração acionado depois de boca/olhos em 1, inclusive com movimento reduzido. [Captura após reset](reset-neutro.jpg). |
| Nomes reais validados | Rejeição de mesh, olhos e boca inexistentes, lista vazia, canais sobrepostos e índice fora do array. Loader e controlador usam o mesmo resolvedor. |

## Checks e comandos

- [npm run typecheck](typecheck.txt): código 0.
- [npm run build](build.txt): código 0; inclui outra checagem de tipos.
- `/tests/face.html`: **41/41** [checks faciais](checks-face.json).
- `/tests/animation.html`: **21/21** [regressões corporais](checks-animacao.json).
- `/tests/character.html`: **26/26** [regressões do GLB/loader/cancelamento](checks-personagem.json).
- `/tests/scene.html`: **24/24** [regressões de ciclo de vida](checks-cena.json).
- **112/112 no total.** Não foram reexecutados os testes de geometria do ambiente/iluminação, cujos módulos não mudaram.

Os checks faciais carregam o GLB real e exercitam rig, mixer e morph targets. Para testar limites de intervalo, a fonte aleatória do FaceController é controlada; na cena de demonstração, usa Math.random normal. Casos de mapeamento inválido modificam cópias do manifesto ou restauram o índice corrompido após a rejeição. As falhas HTTP/abort antigas continuam controladas pelas respectivas páginas de teste.

No vértice 231 de VitaFace, selecionado pela maior variação do morph de boca, a diferença entre pesos 0 e 1 foi **0,0128362596 em coordenadas locais**. A posição em 0,5 ficou a **5,42×10⁻²⁰** da interpolação entre extremos. Isso confirma uma amostra de deformação real; não representa prova sobre todos os vértices.

Após o mesmo tempo simulado de 4,133333 s, o fechamento dos olhos foi **0,7407407407408** a 30 atualizações/s e **0,7407407407408948** a 120 atualizações/s. A instrumentação foi corrigida para arredondar a contagem inteira de quadros: o primeiro teste ampliado avançava um quadro extra por comparação com um limite fracionário. O teste final compara tempos iguais; essas frequências são simuladas, não benchmarks de renderização.

## Demonstração visual e produção

As três imagens PNG de piscar foram capturadas do canvas efetivamente renderizado, com fechamento 1 e modo automático, sem intervenção manual nos olhos. Metadados associados:

- [idle](piscar-idle.json): boca 0, blink 1, automático true, manual false, ação idle com peso 1.
- [thinking](piscar-thinking.json): boca 0,5, blink 1, automático true, manual false, ação thinking com peso 1.
- [responding](piscar-responding.json): boca 1, blink 1, automático true, manual false, ação responding com peso 1.

O botão de captura da página de teste observa o fechamento pelo updater existente e usa uma microtask depois do render, antes de o compositor limpar o drawing buffer. A primeira tentativa de ler o canvas antes do render produziu uma imagem vazia; a instrumentação foi corrigida e a captura substituída por um quadro inspecionado. Não houve segundo render/RAF nem alteração de `preserveDrawingBuffer` na aplicação. As imagens finais foram abertas e inspecionadas.

[Demonstração/console](demonstracao-navegador.json): 41/41 e zero erros/avisos capturados na página. [Preview de produção](preview.jpg) na porta 4173: modelo carregado, fase 07, um canvas, zero inspetores e zero erros/avisos capturados. [DOM/console](preview-navegador.json). Servidores locais existentes foram reutilizados; a tentativa de iniciar outro dev confirmou a porta 5173 ocupada.

Windows, Node 24.15.0, npm 12.0.2, Chromium integrado com WebGL 2. Demonstração: viewport 1280×720, canvas 440×440, DPR 1. Preview: viewport 425×570, canvas 368×300, DPR 1. Nenhum override de viewport aplicado.

## Limitações

- Sem celular físico, matriz de GPUs/navegadores ou benchmark sustentado. Frequências de atualização simuladas não equivalem a FPS medido.
- As evidências visuais são quadros estáticos dos três estados e ajustes manuais; o ciclo completo e a reabertura também foram verificados por avanço de delta, sem uma nova gravação de vídeo nesta fase.
- O máximo de abertura vem do morph existente; não há visemas, emoção por IA ou sincronização fonética. Outros morph targets do modelo não são controlados por esta fase.
- Visibilidade nativa mantém a limitação da fase 02. O teste de suspensão facial usa delta controlado.
- Build mantém aviso do chunk JS: **655,64 kB / 167,74 kB gzip**, a revisar na fase 12.
- Chat e sua integração continuam nas fases 08–10. O núcleo completo permanece pendente.

Próxima fase pendente: 08 — interface do chat e controles, quando solicitada.
