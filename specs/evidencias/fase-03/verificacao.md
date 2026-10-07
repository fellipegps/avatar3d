# Verificação da fase 03 — 07/10/2026

## Fluxo e resultado

Página inicial → AppController → SceneController → fetch do GLB local → GLTFLoader → validação do manifesto → AnimationMixer no loop existente → canvas WebGL 2. Falhas de renderer e asset retornam para a interface sem remover sua área. **Fase concluída com os seis critérios de aceitação demonstrados.** Sala, chat, transições suaves e piscar automático não fazem parte desta entrega.

| Critério | Evidência real |
| --- | --- |
| Origem e condições de uso | [Créditos](../../../assets/credits.md) com autor pixiv / VRoid Project, fonte oficial específica de Vita/CC0, mirror fixado por revisão, SHA-256 de origem/final e adaptações. [Metadados extraídos do original](origem-modelo.json). |
| GLB no navegador e materiais utilizáveis | Corpo, rosto, roupa e cabelo inspecionados com materiais PBR e luzes de inspeção. [Desenvolvimento](corpo-idle.jpg), [preview final](preview.jpg). Console do preview final sem erros/avisos e somente um canvas: [DOM/logs](preview-navegador.json). |
| Três estados animados | Clipes `Vita_Idle` (4 s), `Vita_Thinking` (3,2 s), `Vita_Responding` (2,4 s) embutidos no GLB e mapeados no [manifesto](../../../src/scene/character.manifest.ts). Seleção/reprodução manual de [repouso](corpo-idle.jpg), [pensamento](corpo-thinking.jpg) e [resposta](corpo-responding.jpg). Testes amostraram cada ciclo, movimento da cabeça, limites da geometria deformada, retorno da pose e chão sem drift. |
| Piscar e boca demonstrados | Sliders operados no navegador, com corpo congelado para comparação: [neutro](rosto-neutro.jpg) e [olhos fechados/boca aberta](piscar-boca.jpg). Após restaurar, olhos reabertos/boca fechada observados nos estados corporais. Valores intermediários, clamp e independência do mixer verificados nos testes. |
| Escala/orientação/transformações | Unidade adotada: metro; escala 1. Altura em bind pose 1,71307699; chão original -0,000114792019 corrigido por posição Y +0,000114792019. Frente original -Z e vertical +Y; rotação Y π aponta a frente para +Z/câmera. Limites medidos no [inventário](inventario.json); valores no manifesto. |
| Controles existentes | GLTFLoader confirmou nove meshes `VitaFace`, `VitaFace_1`…`VitaFace_8`, todos com 41 targets. Olhos: `Face.M_F00_000_00_Fcl_EYE_Close` (índice 12). Boca: `Face.M_F00_000_00_Fcl_MTH_A` (índice 29). Aplicação resolve os nomes, sem depender dos índices. Manifestos com clipe/morph ausente foram rejeitados. |

## Checks executados

- **26/26** na página `/tests/character.html`: [JSON completo](testes-browser.json), [captura](testes.jpg), [fonte reexecutável](../../../tests/character.browser.ts).
- **24/24** da fase 02 reexecutados após integração: [regressão](regressao-fase-02.json). A limitação de visibilidade nativa documentada naquela fase continua válida.
- GLB/parser/rig/recursos reais. A página de testes usa HTTP 404 e resposta HTML simulados, além de abortar deliberadamente ao final de um parse real para testar liberação tardia. Abort de download, descarte duplo, disponibilidade da interface e retorno entre clipes também passaram. Contagem de descarte automatizada cobre geometrias; não representa medição de memória de GPU.
- `npm run typecheck`: código 0, [log](typecheck.txt).
- `npm run build`: código 0, [log](build.txt). Vite 8.3.3, 17 módulos, JS 639,16 kB / gzip 161,84 kB. Aviso >500 kB preservado.
- `npm run build -- --base=/avatar3d/`: código 0, [log](build-base.txt). Servido com preview na porta 4174 e mesma base: [DOM](preview-base.json), [captura](preview-base.jpg). GLB carregado e controles de desenvolvimento ausentes. Depois foi restaurado o build com base padrão e inspecionado na porta 4173.
- Busca no JS de produção não encontrou os textos do painel de inspeção. Inspeção de DOM confirmou zero painéis de inspeção e um canvas.
- O npm da máquina precisou de execução com acesso permitido fora do isolamento, conforme diagnóstico da sessão anterior; não foi alterada a instalação global nem introduzida dependência no projeto.

## Inventário e adaptação

GLB final: **8.834.484 bytes**, **26.130 triângulos**, **155 ossos**, **16 meshes/16 materiais**, **16 texturas**, três clipes. [Inventário completo](inventario.json) inclui nomes, dimensões das texturas, tracks, limites da bind pose e quatro amostras por ciclo.

O original Vita não trazia animações. Foram feitas três poses animadas diretamente no rig existente; não houve transferência de clipes entre esqueletos. Nenhum canal corporal anima os morph targets ou a translação da raiz. As 82 primitivas originais foram agrupadas em 16 sem remover triângulos; isso é contagem estrutural, não benchmark de draw calls. O script reproduzível preserva as texturas de cor e produz materiais PBR padrão a partir do original VRM. [Detalhes e hashes](../../../assets/credits.md).

## Ambiente, observações visuais e limites

- Windows; Node 24.15.0; npm 12.0.2; navegador Chromium integrado. Perfil normal. Desenvolvimento observado em painel estreito; leitura de DOM registrada em **420×572**. Preview final em **1280×720**. [Desenvolvimento](desenvolvimento-navegador.json) e [produção](preview-navegador.json), ambos sem overflow horizontal e sem erros/avisos no console das páginas principais consultadas.
- A personagem aparece de frente, com pés dentro do enquadramento, textura facial legível na aproximação e controles de olhos/boca visíveis. Nos estados corporais observados não houve deformação abrupta, deslocamento dos pés ou corte do modelo. Pensamento inclina/gira discretamente a cabeça; resposta movimenta cabeça e braço. Essas poses não pretendem ser animações de atuação final.
- MToon, contornos e física secundária de cabelo/roupa do ecossistema VRM não foram incorporados. Cabelo e roupa seguem o rig. Os materiais PBR respondem às luzes da mesma cena que receberá o ambiente.
- Duas texturas de corpo/roupa permanecem em 2048×2048, acima da preferência inicial de 1024, e há 41 morph targets compartilhados pela face. A transferência do modelo fica abaixo da referência de 15 MB; não houve benchmark de carregamento, FPS ou memória. Otimização adicional e medição ficam para fase 12.
- Sem celular físico, matriz de navegadores, teste artístico em Blender ou medição de desempenho. A validação de deformação combina inspeção no navegador e amostras numéricas; não afirma ausência de qualquer possível interpenetração em poses futuras.
- O modelo foi selecionado como personagem real do MVP. A entrega não conclui sala, chat ou núcleo. Nenhum deploy, compra de asset ou serviço de IA foi feito.
