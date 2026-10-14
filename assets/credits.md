# Origem e licença da personagem

## Modelo selecionado: Vita (β Ver AvatarSample_3)

- Autor: **pixiv Inc. / VRoid Project**.
- Licença do modelo original: **CC0 1.0**. A página oficial identifica especificamente Vita como CC0; não se generaliza essa licença a outros modelos do VRoid.
- Fonte primária de autoria/licença: [Vita / β Ver AvatarSample_3](https://vroid.pixiv.help/hc/ja/articles/360014900113). [Condições dos modelos de exemplo](https://vroid.pixiv.help/hc/en-us/articles/4402614652569-Do-VRoid-Studio-s-sample-models-come-with-conditions-of-use) distingue os antigos modelos CC0 dos presets com outras condições.
- Licença: [Creative Commons CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).
- Distribuição consultada: [madjin/vrm-samples](https://github.com/madjin/vrm-samples/blob/e16eb187100149a315ad92c3c9968f1d5baa6c7d/vroid/beta/Vita.vrm), revisão `e16eb187100149a315ad92c3c9968f1d5baa6c7d`.
- Download usado: [Vita.vrm da revisão fixada](https://raw.githubusercontent.com/madjin/vrm-samples/e16eb187100149a315ad92c3c9968f1d5baa6c7d/vroid/beta/Vita.vrm).
- Consulta/download: 07/10/2026. Não exige compra. A distribuição do modelo e adaptações é permitida pelo CC0; os créditos são mantidos por rastreabilidade, sem sugerir endosso do autor.
- Original: 14.359.044 bytes; SHA-256 `f2bf78f28a24e2f75f5ca0b6c3b646654c394e4b03592dfaa0d0633ef0972b4d`.
- GLB incorporado: [public/models/character.glb](../public/models/character.glb), 8.834.484 bytes; SHA-256 `fa9f18268325da1044a9b83136131371c07bea66a3bf38a1859841fa5947df87`.
- Metadados extraídos do original: [origem-modelo.json](../specs/evidencias/fase-03/origem-modelo.json), com título Vita, licença CC0 e permissão comercial. Os campos de autor do binário estavam vazios; a atribuição vem da página oficial.

## Adaptações feitas neste projeto

O original é um contêiner glTF binário com extensão VRM 0, rig, texturas e controles faciais, mas **sem clipes corporais**. O script [prepare-character.mjs](../scripts/prepare-character.mjs) gera um GLB glTF 2.0 autossuficiente carregável por GLTFLoader:

1. Preserva geometria, pesos, ossos, UVs, texturas de cor e os 41 morph targets. Promove os nomes originais dos targets para `mesh.extras.targetNames`, reconhecido pelo GLTFLoader.
2. Agrupa primitivas que já compartilham material e atributos (82 → 16), sem alterar os 26.130 triângulos. Nomeia o mesh facial `VitaFace` para identificação estável.
3. Usa os materiais PBR padrão com as cores/texturas originais; remove a extensão VRM, shaders unlit, normal maps e mapas emissivos. Não inclui MToon, contornos nem física secundária de cabelo/roupa. A aparência resultante foi inspecionada no navegador.
4. Remove dados não usados, incluindo thumbnail e texturas dos shaders retirados. Preserva duas texturas 2048×2048 do corpo/roupa; as demais têm dimensões de até 1024. Na fase 12, as texturas foram mantidas: transferência e benchmark desktop ficaram dentro das referências; celular físico permanece sem medição. Ver [relatório](../specs/evidencias/fase-12/verificacao.md).
5. Acrescenta os clipes originais deste projeto `Vita_Idle` (4 s), `Vita_Thinking` (3,2 s) e `Vita_Responding` (2,4 s), feitos diretamente para os ossos `J_Bip_*`. São poses animadas discretas de respiração/cabeça/braços, sem captura de movimento ou retargeting. Não animam morph targets nem translação da raiz.

O modelo é a personagem selecionada para o MVP; o cubo da fase 02 foi removido da experiência principal. A composição final da sala, refinamento/transições corporais e piscar automático pertencem às fases 04–07.

## Reprodução da preparação

O GLB final está versionado e não requer ferramentas de preparação para executar/buildar o app. Para reproduzi-lo, baixe o original do endereço fixado acima para `assets/source/Vita.vrm` (diretório ignorado pelo Git), instale as dependências do projeto e execute:

```sh
node scripts/prepare-character.mjs
```

O script verifica o SHA-256 de entrada e informa tamanho/hash de saída. Usa apenas Node e a dependência Three.js já existente. Nenhuma dependência de VRM, serviço externo ou conversor é necessária na aplicação.

## Alternativas avaliadas

- [RobotExpressive, por Tomás Laulhé, adaptado por Don McCurdy](https://github.com/mrdoob/three.js/blob/dev/examples/models/gltf/RobotExpressive/README.md): CC0 com animações corporais, mas o conjunto documentado de três expressões não comprova os controles independentes de piscar e boca exigidos. Não incorporado.
- [Michelle.glb nos exemplos do Three.js](https://github.com/mrdoob/three.js/blob/dev/examples/models/gltf/Michelle.glb): não foi adotado porque a seleção exigia comprovação específica de direitos e controles faciais, já disponível para Vita. Não se presume que a licença do código Three.js cubra qualquer modelo externo.

Nenhum asset da referência Kady foi copiado. A licença do modelo não altera a licença do código do projeto.

## Ambiente geométrico — fase 04

Piso, paredes, mesa, monitores, luminária, planta e caneca foram construídos localmente em `src/scene/Environment.ts`, usando primitivas do Three.js e configuração em metros. Não usam modelos, imagens ou texturas de terceiros. Na fase 04, os materiais eram provisórios. A fase 05 acrescentou acabamento, faixas emissivas e três texturas procedurais locais: dois painéis DEMO e uma sombra radial compartilhada. Textos, números fictícios e gráficos são definidos no próprio projeto, sem fontes externas ou fontes tipográficas baixadas. A origem e a licença de Vita acima permanecem aplicáveis à personagem.

## Fallback estático — fase 12

`public/images/scene-fallback.svg` é uma ilustração vetorial do escritório criada localmente para esta aplicação, sem imagens ou modelos de terceiros. Serve aos caminhos de falha do 3D; Vita real continua sendo a personagem final.
