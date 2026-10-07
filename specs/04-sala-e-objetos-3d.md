# Fase 04 — Sala e objetos 3D

Status inicial: pendente. Tipo: MVP principal.

## Dependências

Concluir [03 — Validação do modelo da personagem](03-validacao-asset-personagem.md). Ler [escopo e contratos](00-escopo-e-contratos.md), [guia de execução](README.md) e o [AGENTS.md](../AGENTS.md).

## Resultado esperado

Construir a composição geométrica do escritório usando a personagem validada como referência de escala.

## Arquivos previstos

- `src/scene/Environment.ts`
- `src/scene/scene.config.ts`
- `src/scene/SceneController.ts`

Os caminhos orientam a implementação. Reutilizar módulos equivalentes de um repositório existente e registrar qualquer adaptação; não criar duplicações só para reproduzir a estrutura sugerida.

## Tarefas

- [ ] Definir medidas e posições de paredes, piso e mesa em configuração.
- [ ] Criar geometrias simples para mesa, monitores, luminária, planta e caneca.
- [ ] Usar materiais provisórios compartilhados quando fizer sentido.
- [ ] Posicionar a personagem atrás da mesa com o transform do manifesto.
- [ ] Escolher câmera e alvo para manter rosto e gestos visíveis em desktop.
- [ ] Garantir profundidade e oclusão entre corpo, mesa e objetos na mesma cena.
- [ ] Remover geometrias de teste e acrescentar descarte dos recursos do ambiente.

## Fora do escopo

- Textos definitivos dos painéis, iluminação final e chat.
- Movimentação livre pelo ambiente, colisões e física.

## Critérios de aceitação

- [ ] A sala contém todos os objetos essenciais em geometria 3D.
- [ ] Personagem e ambiente compartilham renderer, cena e câmera.
- [ ] A mesa oculta partes do corpo de forma espacialmente coerente.
- [ ] O rosto não é cortado pela câmera ou encoberto por objetos.
- [ ] O layout do ambiente pode ser ajustado por configuração.
- [ ] O ambiente pode ser descartado sem liberar duas vezes recursos compartilhados.

## Verificação

1. Inspecionar a cena em vista frontal e, em desenvolvimento, em uma vista lateral temporária.
2. Registrar captura de composição; executar typecheck e build.

## Casos especiais e decisões

- Uma imagem de fundo não substitui a sala 3D.
- A referência orienta composição e cores; não exige o mesmo asset proprietário ou reprodução exata da aparência.

## Evidências e atualização do progresso

Ao concluir, atualizar a linha desta fase em [progresso.md](progresso.md): status, arquivos alterados, checks executados, evidências e limitações. Não marcar concluída com critérios essenciais pendentes. O relatório deve distinguir o que foi verificado do que ficou sem cobertura.

