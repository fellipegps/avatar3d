# Avatar 3D — MVP

Base web em Vite vanilla-ts, TypeScript estrito e HTML/CSS no DOM. As fases 01–09 entregam a estrutura, os contratos, o ciclo de vida WebGL 2 e Vita em um escritório escuro, com iluminação, painéis decorativos locais, transições corporais suaves, piscar automático, interface DOM do chat e domínio/provider local independente. A integração de produção com a personagem entra na fase 10.

## Ambiente

- Node.js `^20.19.0 || >=22.12.0`, conforme `engines` do Vite 8.3.3 instalado. Ambiente verificado na fase 03: Node 24.15.0 e npm 12.0.2.
- npm e navegador moderno. O requisito do Node deve ser conferido novamente ao atualizar o Vite: `node -p "JSON.stringify(require('./node_modules/vite/package.json').engines)"`.

## Execução local

```sh
npm ci
npm run dev
```

Abrir o endereço informado pelo Vite (normalmente `http://localhost:5173`).

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

O build executa a checagem de tipos antes do empacotamento e gera `dist/`. Preview serve esse build localmente (normalmente `http://localhost:4173`); refazer o build após alterar fontes. Não é um comando de publicação.

## Estrutura e dependências

- `index.html`: documento em português e único script de entrada, `src/main.ts`.
- `src/main.ts`: inicialização única e contêineres semânticos da aplicação, cena e interface.
- `src/app/AppController.ts`: coordenação da disponibilidade do 3D e da preferência de movimento reduzido.
- `src/app/contracts.ts`: fronteiras tipadas da especificação 00, sem implementações antecipadas.
- `src/app/ConversationStore.ts`: histórico em memória, snapshots imutáveis, inscrição e transições protegidas pelo ID da solicitação ativa.
- `src/chat/MockChatProvider.ts` e `responses.ts`: catálogo local, normalização e Promise com latência cancelável de 800 ms por padrão.
- `src/scene/SceneController.ts`: renderer, câmera, ResizeObserver, loop, inscrição de atualizações e descarte idempotente.
- `src/scene/scene.config.ts`: parâmetros de enquadramento, pixel ratio e delta máximo.
- `src/scene/Environment.ts`: piso, paredes, mesa, dois monitores, luminária, planta e caneca, com recursos compartilhados e descarte próprio.
- `src/scene/PanelTexture.ts`: conteúdo fictício DEMO desenhado em CanvasTexture, com atualização apenas quando muda.
- `src/styles/base.css`: aparência inicial e empilhamento em telas estreitas.
- `src/ui/ChatView.ts` e `ControlsView.ts`: mensagens seguras, estados visuais, rascunho, foco, rolagem e eventos tipados, sem importação de Three.js.
- `src/styles/layout.css` e `chat.css`: painel lateral, empilhamento, controles e foco visível.
- `src/dev/ChatDemo.ts`: fixture de interface e registro de eventos, somente em desenvolvimento.
- `src/scene/AssetLoader.ts`: carregamento cancelável do GLB, inspeção, validação do manifesto e liberação dos recursos.
- `src/scene/character.manifest.ts`: clipes, meshes, controles faciais e transformações reais de Vita.
- `src/scene/CharacterController.ts`: mixer, transições corporais, canais faciais independentes e descarte, no loop existente.
- `src/scene/FaceController.ts`: índices faciais validados e resolvidos uma vez, boca normalizada, piscar por delta, reset e movimento reduzido.
- `public/models/character.glb`: modelo local autossuficiente; [créditos e preparação](assets/credits.md).
- `three`: renderer, GLTFLoader e animação, importados somente pela camada da cena na aplicação.
- `@types/three`: tipos da biblioteca para TypeScript.
- `vite` e `typescript`: servidor, empacotamento e checagem estática. Versões diretas exatas e árvore fixada em `package-lock.json`.

Não foi necessário criar `vite.config.ts`: os padrões atendem à fase 01. Planejamento e evidências estão em [specs/README.md](specs/README.md) e [specs/progresso.md](specs/progresso.md).

## Cena e verificação

### Interface da conversa — fase 08

Em desenvolvimento, a página principal mostra duas mensagens de exemplo e o seletor **Estado visual**. Enter emite o texto completo; Shift+Enter insere uma linha. O limite é de 2.000 unidades UTF-16 (`maxlength`). Envio adiciona apenas a mensagem do usuário à fixture e mostra espera; selecione Pronto para continuar. Reiniciar restaura os exemplos. Abra **Eventos da demonstração** para conferir envio, reinício, abrir/fechar e preferências. Qualidade/movimento nessa fixture apenas registram eventos; ainda não comandam a cena.

Em produção, envio, reinício e preferências ficam desabilitados com avisos de preparação. Abrir/fechar preserva o rascunho. Provider/store já existem independentemente; sua integração à aplicação principal será feita na fase 10.

`ChatView` expõe `renderMessages`, `setState`, `setAvailable`, `getDraft`, `setDraft`, `setOpen`, `focusInput` e `dispose`; recebe callbacks de envio, reinício e fechamento. `ControlsView` emite abertura, qualidade e movimento reduzido, com `setEnabled`, `setOpen`, `focusToggle` e `dispose`. A coordenação decide quando limpar o campo. Mensagens usam `textContent` e IDs estáveis. Atualizações preservam o campo e a leitura do histórico; não passam pelo loop 3D.

Abra `/tests/chat.html` em desenvolvimento para os 31 checks de interface e uma fixture interativa sem canvas. [Evidências da fase 08](specs/evidencias/fase-08/verificacao.md): tipos/build, teclado real, desktop/tela estreita e 24 checks de regressão do ciclo de vida.

### Domínio e provider local — fase 09

`npm test` compila somente os módulos de domínio em `.tmp/domain-tests/` e executa 29 testes com o runner nativo do Node, sem DOM, Three.js, rede ou timers reais. O diretório de saída é ignorado pelo Git. [Evidências](specs/evidencias/fase-09/verificacao.md).

`ConversationStore` oferece `getSnapshot`, `subscribe` (entrega inicial imediata e função de remoção), `begin(text)`, `receive(id, reply)`, `complete(id)`, `fail(id, error?)`, `cancel(id)`, `reset` e `dispose`. `begin` retorna ID ou `null`; operações de solicitação retornam se foram aceitas. Texto original fica no histórico. Só uma solicitação pode permanecer ativa em waiting/revealing; respostas e finalizações antigas são ignoradas após reset/cancelamento. Snapshots, arrays e mensagens são congelados. Assinantes devem tratar suas próprias exceções.

`MockChatProvider` implementa `ChatProvider.reply(text, signal)`. Há saudação, apresentação, cenário, ajuda e resposta padrão. Seleção ignora caixa, acentos e pontuação; usa palavras/frases inteiras com prioridade ajuda → apresentação → cenário → saudação. Latência padrão fixa de 800 ms, configurável por `latencyMs`; `schedule` pode ser injetado para verificação. Cancelar rejeita `AbortError` e limpa timer/listener. IDs identificam cada instância/resposta; não há persistência ou chamadas externas.

Em desenvolvimento, abra `/tests/conversation.html`. Envie “OLÁ!”, “quem é você?”, “cenário”, “ajuda” ou assunto desconhecido. Resposta chega completa e fica em revealing até **Concluir apresentação**. **Cancelar resposta** conserva histórico; **Reiniciar conversa** aborta e limpa. **Simular falha na próxima resposta** usa um provider DEV separado e permite conferir recuperação. A página não monta renderer nem modifica a aplicação principal; animação e apresentação gradual entram na fase 10.

### Renderer e ciclo de vida

O navegador precisa suportar WebGL 2. Falhas de renderer/modelo são apresentadas na área 3D e mantêm a área de interface disponível. Vita e escritório compartilham uma cena, uma câmera e um canvas. O cubo de teste foi removido. A câmera de produção é fixa; não há controles de órbita.

O controlador mantém um loop de `requestAnimationFrame`, atualiza o mixer da personagem e permite registrar módulos com `registerUpdater(deltaSeconds)`, que retorna uma função de remoção. O primeiro delta é zero e os demais são limitados a 0,05 s. Uma aba oculta ou um contêiner sem área pausa o loop. O perfil normal limita pixel ratio a 1,5; o econômico a 1. A preferência de movimento reduzido suspende a animação corporal.

`dispose()` cancela carga/frame, desconecta o observador, remove listeners, libera mixer/geometrias/materiais/texturas/skeletons/renderer e perde o contexto descartado. Recursos compartilhados do GLB são liberados uma única vez por asset; um parse terminado após cancelamento é descartado. HMR e saída da página descartam o controlador; restauração pelo bfcache recarrega a aplicação.

Para repetir as verificações, execute `npm run dev` e abra `/tests/scene.html` no endereço do servidor. Essa página usa WebGL/ResizeObserver reais e instrumenta relógio, visibilidade e DPR para verificar os casos de suspensão e os recursos remanescentes. Também testa a extensão `WEBGL_lose_context`, remontagens e indisponibilidade de WebGL 2. Há botões para conferir visualmente contêiner pequeno, sem área e falha de inicialização. A página de testes não é entrada do build de produção, e sua instrumentação não é importada pela aplicação.

## Personagem e verificação da fase 03

Em desenvolvimento, a página principal oferece um painel para selecionar repouso/pensamento/resposta, inspecionar a sala frontalmente ou pela lateral, isolar o corpo/rosto, variar olhos/boca, ativar piscar automático e congelar o corpo. Esse painel é removido do JavaScript de produção. Mudanças corporais usam a mistura gradual da fase 06; o controle facial da fase 07 está descrito abaixo.

Abra `/tests/character.html` em desenvolvimento para repetir os 26 checks do GLB, animações, manifesto, cancelamento e erros. A página carrega o modelo real, registra inventário e amostras de limites da geometria deformada, e simula somente os pontos necessários de falha HTTP/aborto de parse. Os 24 checks de ciclo de vida da fase 02 também foram reexecutados com sucesso.

O modelo tem 26.130 triângulos, 155 ossos, 16 meshes e 41 morph targets faciais. O GLB de 8,83 MB já está em `public/models/`; não exige download em tempo de execução de um serviço externo. Consulte [créditos, hashes e preparação reproduzível](assets/credits.md) e [evidências da fase 03](specs/evidencias/fase-03/verificacao.md).

Os caminhos do GLB usam `import.meta.env.BASE_URL`. Também foi verificado build/preview com `--base=/avatar3d/`. Não há benchmark ou teste em celular físico. Duas texturas 2048×2048 e o aviso de chunk JS acima de 500 kB ficam registrados para a fase 12.

## Sala e verificação da fase 04

`environmentConfig`, em `src/scene/scene.config.ts`, concentra medidas em metros, posições e cores dos materiais. A sala mede 4 × 2,7 × 3,6 m e usa um corte com frente e lateral direita abertas. O tampo de 2,5 × 0,9 m fica a 0,82 m do chão, à frente da personagem, sem modificar o transform do manifesto. A câmera e seu alvo ficam em `sceneConfig.composition`.

Abra `/tests/environment.html` em desenvolvimento para repetir os 14 checks de integração, oclusão por raycast, enquadramento, configuração alternativa e descarte único de recursos compartilhados. As regressões da cena (24 checks) e do GLB (26 checks) passaram com o ambiente integrado. As verificações e capturas estão em [evidências da fase 04](specs/evidencias/fase-04/verificacao.md).

Na entrega da fase 04, o ambiente tinha 31 meshes e 1.528 triângulos, com materiais e iluminação provisórios. A fase 05 acrescentou o acabamento descrito abaixo.

## Materiais, luzes e painéis — fase 05

`visualConfig` define os acentos azul/verde/roxo, exposição, luz ambiente, luz do rosto, luz de contorno e luz explícita da luminária. Renderer com saída sRGB e tone mapping ACES. Faixas e monitores têm materiais emissivos; somente as luzes explícitas iluminam os objetos próximos. Sem bloom, pós-processamento ou mapas de sombra.

Sombras de contato são manchas radiais em cinco planos no piso, compartilhando uma textura local de 128×128. Não acompanham contornos do corpo ou projeções de luz; pressupõem a personagem e a mesa nas posições atuais. Os monitores usam CanvasTexture 768×384, com gráficos e números fixos identificados como DEMO / DADOS FICTÍCIOS. Não há consultas externas nem texto do chat nos painéis. `PanelTexture.update()` compara conteúdo antes de redesenhar e marcar upload; não é chamado pelo loop.

Abra `/tests/lighting.html` em desenvolvimento para repetir os dez checks de custo, texturas, ausência de uploads durante 45 quadros e descarte/falha parcial. A página mostra snapshots de `renderer.info`. Na Intel Iris Xe disponível, canvas 795×440 / DPR 1: 59 draw calls e 28.664 triângulos desenhados por frame, contra 51 / 28.618 antes. Sem sombras de contato, 54 / 28.654. Essas contagens não são benchmark de FPS. O ambiente atual tem 39 meshes, 1.574 triângulos únicos, oito geometrias, 14 materiais e três texturas locais.

Tipos, build, preview e 74 checks passaram; veja [evidências da fase 05](specs/evidencias/fase-05/verificacao.md). O aviso do chunk JS acima de 500 kB permanece registrado para a fase 12. Não houve medição sustentada de FPS nem teste em celular físico.

## Animações corporais — fase 06

`CharacterController` substitui a reprodução de inspeção, usando os mesmos três clipes reais do manifesto e o mixer atualizado exclusivamente por `SceneController`. A duração da mistura é ajustável em `characterManifest.animation.transitionSeconds` (0,3 s). Pesos normalizados com interpolação suave preservam a contribuição corrente ao interromper uma troca. Repetir o estado solicitado mantém o tempo do clipe e da transição.

Os clipes ficam em loop até o próximo comando. `setCharacterState('idle')` encerra a resposta; não há retorno automático pelo fim do clipe. Movimento reduzido congela corpo e mistura, guarda o último estado solicitado e retoma da pose congelada. O transform global não é animado; translações dos nós `Root` e `J_Bip_C_Hips` são removidas de cópias dos clipes para impedir root motion incompatível. Canais de morph targets são rejeitados nos clipes corporais, preservando boca e olhos manuais.

Abra `/tests/animation.html` em desenvolvimento para executar 21 checks e gravar uma sequência de aproximadamente oito segundos, incluindo trocas rápidas e retorno ao repouso. A gravação usa `MediaRecorder` sobre o canvas, sem áudio, e os comandos são agendados pelo loop já existente da cena. Essas ferramentas não integram o build de produção. Tipos/build e 85 checks passaram (21 novos, 26 da personagem, 24 da cena e 14 do ambiente). Veja [verificação e limites](specs/evidencias/fase-06/verificacao.md) e [vídeo](specs/evidencias/fase-06/transicoes.webm).

## Piscar e controles faciais — fase 07

`FaceController` usa somente os morph targets de Vita definidos no manifesto, com índices resolvidos e validados para os nove meshes faciais. `setMouthOpen` limita valores finitos a 0–1; valores não finitos viram zero. Zero fecha a boca, 0,5 é intermediário e 1 usa o máximo do morph `Face.M_F00_000_00_Fcl_MTH_A`. `resetFace()` na personagem/cena neutraliza olhos e boca imediatamente, preservando a preferência de piscar automático.

`characterManifest.face.blinkTiming` configura espera aleatória entre 2,5 e 5,5 s, fechamento de 0,06 s, pausa fechada de 0,04 s e abertura de 0,1 s. A espera começa novamente após cada piscada. O rosto é atualizado depois do mixer, no mesmo loop da cena, sem timers ou outro RAF. Movimento reduzido interrompe o piscar automático e deixa os olhos abertos; ajustes manuais estáticos continuam permitidos. A retomada espera um novo intervalo. `setBlink` desativa o automático para inspeção até `setAutoBlink(true)`; o botão de restauração do inspetor também o reativa. Deltas acima de 0,25 s reiniciam a espera, evitando acumular piscadas após suspensão.

A boca permanece no valor solicitado até novo comando/reset, inclusive durante piscar e transições corporais. Não há sincronização de fala ou movimento sintético automático da boca nesta fase.

Abra `/tests/face.html` em desenvolvimento para os 41 checks faciais e controles de demonstração. O botão de captura registra um quadro efetivamente renderizado durante o fechamento automático. Tipos/build, 41 checks novos e 71 regressões passaram: **112/112**. Veja [verificação, imagens e limites](specs/evidencias/fase-07/verificacao.md).
