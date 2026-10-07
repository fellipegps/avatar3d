# Fase 03 — Validação do modelo da personagem

Status inicial: pendente. Tipo: MVP principal.

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

- [ ] Verificar se existe um GLB fornecido; se não houver, avaliar um modelo gratuito ou próprio com origem e licença claras.
- [ ] Registrar autor, origem, licença e modificações; uma captura de tela não fornece o asset da personagem.
- [ ] Carregar o modelo com GLTFLoader dentro do SceneController já existente.
- [ ] Inspecionar meshes, rig, materiais, clipes e morph targets; criar controles de inspeção somente para desenvolvimento.
- [ ] Medir escala, altura, chão e orientação frontal; registrar transformações no manifesto.
- [ ] Mapear clipes reais para idle, thinking e responding; testar deformações e retorno à posição.
- [ ] Selecionar um mecanismo facial: morph targets preferencialmente, ou atlas apenas quando UV/material estiverem preparados.
- [ ] Demonstrar manualmente piscar e abertura da boca; registrar nomes reais dos controles no manifesto.
- [ ] Se o asset não atender, reparar ou substituir. Retargeting de outro rig exige validação específica antes de ser considerado resolvido.

## Fora do escopo

- Modelagem artística completa prometida apenas por código.
- Reutilização não autorizada do asset da Kady.
- Produção de sala e chat para ocultar um asset incompleto.

## Critérios de aceitação

- [ ] Origem e condições de uso do modelo estão registradas.
- [ ] O GLB abre no navegador e os materiais têm aparência utilizável.
- [ ] Os três estados lógicos têm um clipe/pose animada funcional e mapeamento documentado.
- [ ] Piscar e abertura da boca foram demonstrados no modelo real.
- [ ] Escala, orientação e transformações estão registradas.
- [ ] O manifesto identifica controles existentes, não nomes presumidos.

## Verificação

1. Reproduzir cada clipe e variar os controles faciais no navegador.
2. Registrar captura ou vídeo curto, tamanho do arquivo e eventuais limitações visuais.
3. Executar typecheck e build após integrar o loader.

## Casos especiais e decisões

- Placeholder pode ajudar na inspeção, mas não satisfaz os critérios desta fase.
- Se não houver asset viável sem compra ou trabalho artístico adicional, marcar bloqueio com evidência e alternativas concretas. Avançar apenas em tarefas independentes de UI/estado que preservem os contratos; não declarar o núcleo concluído.

## Evidências e atualização do progresso

Ao concluir, atualizar a linha desta fase em [progresso.md](progresso.md): status, arquivos alterados, checks executados, evidências e limitações. Não marcar concluída com critérios essenciais pendentes. O relatório deve distinguir o que foi verificado do que ficou sem cobertura.

