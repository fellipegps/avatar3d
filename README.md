# Avatar 3D — MVP

Base web em Vite vanilla-ts, TypeScript estrito e HTML/CSS no DOM. As fases 01 e 02 preparam a estrutura visual, os contratos e uma cena WebGL 2 de referência. Personagem, sala e chat serão implementados nas fases seguintes.

## Ambiente

- Node.js `^20.19.0 || >=22.12.0`, conforme `engines` do Vite 8.3.3 instalado. Ambiente verificado: Node 22.20.0 e npm 11.7.0.
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
- `three`: renderer e geometria de referência, importados somente pela camada da cena na aplicação.
- `@types/three`: tipos da biblioteca para TypeScript.
- `vite` e `typescript`: servidor, empacotamento e checagem estática. Versões diretas exatas e árvore fixada em `package-lock.json`.

Não foi necessário criar `vite.config.ts`: os padrões atendem à fase 01. Planejamento e evidências estão em [specs/README.md](specs/README.md) e [specs/progresso.md](specs/progresso.md).

## Cena e verificação da fase 02

O navegador precisa suportar WebGL 2. Falhas são apresentadas na área 3D e mantêm a área de interface disponível. O cubo com material normal é uma referência temporária, não a personagem final. A câmera é fixa; não há controles de órbita.

O controlador mantém um loop de `requestAnimationFrame` e permite registrar módulos com `registerUpdater(deltaSeconds)`, que retorna uma função de remoção. O primeiro delta é zero e os demais são limitados a 0,05 s. Uma aba oculta ou um contêiner sem área pausa o loop. O perfil normal limita pixel ratio a 1,5; o econômico a 1. A preferência de movimento reduzido suspende a rotação da referência.

`dispose()` cancela o frame, desconecta o observador, remove listeners, libera geometria/material/renderer e perde o contexto descartado. Os recursos da referência pertencem ao controlador; futuros módulos devem descartar seus próprios recursos antes da desmontagem da cena. HMR e saída da página descartam o controlador; restauração pelo bfcache recarrega a aplicação.

Para repetir as verificações, execute `npm run dev` e abra `/tests/scene.html` no endereço do servidor. Essa página usa WebGL/ResizeObserver reais e instrumenta relógio, visibilidade e DPR para verificar os casos de suspensão e os recursos remanescentes. Também testa a extensão `WEBGL_lose_context`, remontagens e indisponibilidade de WebGL 2. Há botões para conferir visualmente contêiner pequeno, sem área e falha de inicialização. A página de testes não é entrada do build de produção, e sua instrumentação não é importada pela aplicação.
