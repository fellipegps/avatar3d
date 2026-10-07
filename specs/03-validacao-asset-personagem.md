# Fase 03 — Validação do modelo da personagem

Status: concluída em 07/10/2026. Tipo: MVP principal. [Evidências e limites](evidencias/fase-03/verificacao.md).

## Dependências

Concluir [02 — Renderer, câmera e ciclo de vida](02-renderer-camera-ciclo-de-vida.md). Ler [escopo e contratos](00-escopo-e-contratos.md), [guia de execução](README.md) e o [AGENTS.md](../AGENTS.md).

## Resultado esperado

Escolher e provar no navegador um GLB que atenda ao corpo e ao rosto antes de investir na cena completa.

## Arquivos previstos

- `public/models/character.glb, após seleção`
- `src/scene/AssetLoader.ts`
- `src/scene/character.manifest.ts`
- `assets/credits.md`
- `specs/progresso.md`

Os caminhos orientam a implementação. Reutilizar módulos equivalentes de um repositório existente e registrar qualquer adaptação; não criar duplicações só para reproduzir a estrutura sugerida.

## Tarefas

- [x] Verificar se existe um GLB fornecido; se não houver, avaliar um modelo gratuito ou próprio com origem e licença claras.
- [x] Registrar autor, origem, licença e modificações; uma captura de tela não fornece o asset da personagem.
- [x] Carregar o modelo com GLTFLoader dentro do SceneController já existente.
- [x] Inspecionar meshes, rig, materiais, clipes e morph targets; criar controles de inspeção somente para desenvolvimento.
- [x] Medir escala, altura, chão e orientação frontal; registrar transformações no manifesto.
- [x] Mapear clipes reais para idle, thinking e responding; testar deformações e retorno à posição.
- [x] Selecionar um mecanismo facial: morph targets preferencialmente, ou atlas apenas quando UV/material estiverem preparados.
- [x] Demonstrar manualmente piscar e abertura da boca; registrar nomes reais dos controles no manifesto.
- [x] Se o asset não atender, reparar ou substituir. Vita recebeu três clipes feitos no próprio rig, sem retargeting; adaptação documentada em [créditos](../assets/credits.md).

## Fora do escopo

- Modelagem artística completa prometida apenas por código.
- Reutilização não autorizada do asset da Kady.
- Produção de sala e chat para ocultar um asset incompleto.

## Critérios de aceitação

- [x] Origem e condições de uso do modelo estão registradas.
- [x] O GLB abre no navegador e os materiais têm aparência utilizável.
- [x] Os três estados lógicos têm um clipe/pose animada funcional e mapeamento documentado.
- [x] Piscar e abertura da boca foram demonstrados no modelo real.
- [x] Escala, orientação e transformações estão registradas.
- [x] O manifesto identifica controles existentes, não nomes presumidos.

## Verificação

1. Reproduzir cada clipe e variar os controles faciais no navegador.
2. Registrar captura ou vídeo curto, tamanho do arquivo e eventuais limitações visuais.
3. Executar typecheck e build após integrar o loader.

## Casos especiais e decisões

- Placeholder pode ajudar na inspeção, mas não satisfaz os critérios desta fase.
- Se não houver asset viável sem compra ou trabalho artístico adicional, marcar bloqueio com evidência e alternativas concretas. Avançar apenas em tarefas independentes de UI/estado que preservem os contratos; não declarar o núcleo concluído.

## Evidências e atualização do progresso

Ao concluir, atualizar a linha desta fase em [progresso.md](progresso.md): status, arquivos alterados, checks executados, evidências e limitações. Não marcar concluída com critérios essenciais pendentes. O relatório deve distinguir o que foi verificado do que ficou sem cobertura.

