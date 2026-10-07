# Avatar 3D — MVP

Base web em Vite vanilla-ts, TypeScript estrito e HTML/CSS no DOM. As fases 01–03 entregam a estrutura, os contratos, o ciclo de vida WebGL 2 e a personagem Vita em GLB com rig, três clipes e controles faciais validados. Sala e chat continuam nas fases seguintes.

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
npm run build
npm run preview
```

O build executa a checagem de tipos antes do empacotamento e gera `dist/`. Preview serve esse build localmente (normalmente `http://localhost:4173`); refazer o build após alterar fontes. Não é um comando de publicação.

## Estrutura e dependências

- `index.html`: documento em português e único script de entrada, `src/main.ts`.
- `src/main.ts`: inicialização única e contêineres semânticos da aplicação, cena e interface.
- `src/app/AppController.ts`: coordenação da disponibilidade do 3D e da preferência de movimento reduzido.
- `src/app/contracts.ts`: fronteiras tipadas da especificação 00, sem implementações antecipadas.
- `src/scene/SceneController.ts`: renderer, câmera, ResizeObserver, loop, inscrição de atualizações e descarte idempotente.
- `src/scene/scene.config.ts`: parâmetros de enquadramento, pixel ratio e delta máximo.
- `src/styles/base.css`: aparência inicial e empilhamento em telas estreitas.
- `src/scene/AssetLoader.ts`: carregamento cancelável do GLB, inspeção, validação do manifesto e liberação dos recursos.
- `src/scene/character.manifest.ts`: clipes, meshes, controles faciais e transformações reais de Vita.
- `src/scene/CharacterPreview.ts`: reprodução simples para a fase 03, com mixer no loop existente.
- `public/models/character.glb`: modelo local autossuficiente; [créditos e preparação](assets/credits.md).
- `three`: renderer, GLTFLoader e animação, importados somente pela camada da cena na aplicação.
- `@types/three`: tipos da biblioteca para TypeScript.
- `vite` e `typescript`: servidor, empacotamento e checagem estática. Versões diretas exatas e árvore fixada em `package-lock.json`.

Não foi necessário criar `vite.config.ts`: os padrões atendem à fase 01. Planejamento e evidências estão em [specs/README.md](specs/README.md) e [specs/progresso.md](specs/progresso.md).

## Cena e verificação

O navegador precisa suportar WebGL 2. Falhas de renderer/modelo são apresentadas na área 3D e mantêm a área de interface disponível. A aplicação exibe Vita com materiais PBR; o cubo é usado apenas pela verificação isolada da fase 02. A câmera é fixa; não há controles de órbita.

O controlador mantém um loop de `requestAnimationFrame`, atualiza o mixer da personagem e permite registrar módulos com `registerUpdater(deltaSeconds)`, que retorna uma função de remoção. O primeiro delta é zero e os demais são limitados a 0,05 s. Uma aba oculta ou um contêiner sem área pausa o loop. O perfil normal limita pixel ratio a 1,5; o econômico a 1. A preferência de movimento reduzido suspende a animação corporal.

`dispose()` cancela carga/frame, desconecta o observador, remove listeners, libera mixer/geometrias/materiais/texturas/skeletons/renderer e perde o contexto descartado. Recursos compartilhados do GLB são liberados uma única vez por asset; um parse terminado após cancelamento é descartado. HMR e saída da página descartam o controlador; restauração pelo bfcache recarrega a aplicação.

Para repetir as verificações, execute `npm run dev` e abra `/tests/scene.html` no endereço do servidor. Essa página usa WebGL/ResizeObserver reais e instrumenta relógio, visibilidade e DPR para verificar os casos de suspensão e os recursos remanescentes. Também testa a extensão `WEBGL_lose_context`, remontagens e indisponibilidade de WebGL 2. Há botões para conferir visualmente contêiner pequeno, sem área e falha de inicialização. A página de testes não é entrada do build de produção, e sua instrumentação não é importada pela aplicação.

## Personagem e verificação da fase 03

Em desenvolvimento, a página principal oferece um painel para selecionar repouso/pensamento/resposta, aproximar o rosto, variar olhos/boca e congelar o corpo. Esse painel é removido do JavaScript de produção. A mudança de estado é direta nesta fase; transições suaves e piscar automático serão implementados nas fases 06–07.

Abra `/tests/character.html` em desenvolvimento para repetir os 26 checks do GLB, animações, manifesto, cancelamento e erros. A página carrega o modelo real, registra inventário e amostras de limites da geometria deformada, e simula somente os pontos necessários de falha HTTP/aborto de parse. Os 24 checks de ciclo de vida da fase 02 também foram reexecutados com sucesso.

O modelo tem 26.130 triângulos, 155 ossos, 16 meshes e 41 morph targets faciais. O GLB de 8,83 MB já está em `public/models/`; não exige download em tempo de execução de um serviço externo. Consulte [créditos, hashes e preparação reproduzível](assets/credits.md) e [evidências da fase 03](specs/evidencias/fase-03/verificacao.md).

Os caminhos do GLB usam `import.meta.env.BASE_URL`. Também foi verificado build/preview com `--base=/avatar3d/`. Não há benchmark ou teste em celular físico. Duas texturas 2048×2048 e o aviso de chunk JS acima de 500 kB ficam registrados para a fase 12.
