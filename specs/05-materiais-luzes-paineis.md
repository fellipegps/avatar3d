# Fase 05 — Materiais, iluminação e painéis

Status inicial: pendente. Tipo: MVP principal.

## Dependências

Concluir [04 — Sala e objetos 3D](04-sala-e-objetos-3d.md). Ler [escopo e contratos](00-escopo-e-contratos.md), [guia de execução](README.md) e o [AGENTS.md](../AGENTS.md).

## Resultado esperado

Dar identidade visual à sala e legibilidade à personagem, com custo de renderização controlado.

## Arquivos previstos

- `src/scene/Environment.ts`
- `src/scene/scene.config.ts`
- `src/scene/PanelTexture.ts, se necessário`
- `public/textures/, somente quando necessário`

Os caminhos orientam a implementação. Reutilizar módulos equivalentes de um repositório existente e registrar qualquer adaptação; não criar duplicações só para reproduzir a estrutura sugerida.

## Tarefas

- [ ] Definir paleta escura e acentos azul, verde e roxo em configuração.
- [ ] Adicionar luz ambiente, luz principal do rosto e luz de contorno.
- [ ] Aplicar materiais emissivos às faixas e painéis; usar luz explícita quando for necessário iluminar outros objetos.
- [ ] Escolher sombra simples de contato ou uma única luz com sombras, conforme medição.
- [ ] Desenhar conteúdo decorativo em canvas 2D e aplicar CanvasTexture aos monitores/painéis 3D.
- [ ] Identificar números decorativos como DEMO e manter o conteúdo inteiramente local.
- [ ] Atualizar texturas somente quando seu conteúdo mudar, evitando uploads a cada frame.
- [ ] Registrar contagem inicial de triângulos e draw calls para detectar crescimento.

## Fora do escopo

- Bloom, reflexos caros e pipelines de pós-processamento.
- Cotações reais, integrações externas e painéis financeiros funcionais.

## Critérios de aceitação

- [ ] Olhos e rosto são legíveis sem perder a composição escura.
- [ ] As luzes separam personagem e fundo visualmente.
- [ ] Monitores e painéis permanecem superfícies da cena 3D.
- [ ] Texturas de painel não são redesenhadas continuamente.
- [ ] Conteúdo fictício está identificado.
- [ ] Materiais/texturas criados têm descarte definido.

## Verificação

1. Comparar capturas antes/depois da iluminação.
2. Inspecionar renderer.info e observar atualização de texturas.
3. Executar typecheck e build.

## Casos especiais e decisões

- A aparência emissiva de um material não significa que ele ilumine objetos próximos.
- Evitar resolver falhas de composição adicionando efeitos antes de ajustar câmera e luzes.

## Evidências e atualização do progresso

Ao concluir, atualizar a linha desta fase em [progresso.md](progresso.md): status, arquivos alterados, checks executados, evidências e limitações. Não marcar concluída com critérios essenciais pendentes. O relatório deve distinguir o que foi verificado do que ficou sem cobertura.

