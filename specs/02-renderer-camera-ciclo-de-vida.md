# Fase 02 — Renderer, câmera e ciclo de vida

Status: concluída em 07/10/2026. Tipo: MVP principal. Evidências e limites em [progresso.md](progresso.md) e [verificação](evidencias/fase-02/verificacao.md).

## Dependências

Concluir [01 — Base Vite e TypeScript](01-base-vite-typescript.md). Ler [escopo e contratos](00-escopo-e-contratos.md), [guia de execução](README.md) e o [AGENTS.md](../AGENTS.md).

## Resultado esperado

Ter uma cena Three.js mínima e reutilizável, com um único canvas e loop, resize e descarte definidos.

## Arquivos previstos

- `src/scene/SceneController.ts`
- `src/scene/scene.config.ts`
- `src/main.ts`

Os caminhos orientam a implementação. Reutilizar módulos equivalentes de um repositório existente e registrar qualquer adaptação; não criar duplicações só para reproduzir a estrutura sugerida.

## Tarefas

- [x] Criar renderer WebGL 2, cena e câmera de perspectiva dentro do contêiner da cena.
- [x] Usar uma geometria simples de referência para validar o enquadramento; removê-la antes da cena final.
- [x] Implementar um único loop que mede delta em segundos, atualiza módulos registrados e renderiza.
- [x] Limitar pixel ratio e delta após retomada da aba; pausar o loop quando a página estiver oculta.
- [x] Usar ResizeObserver com as dimensões do contêiner, atualizando renderer, aspect e matriz de projeção.
- [x] Implementar dispose idempotente para loop, observadores, listeners e recursos criados nesta fase.
- [x] Expor disponibilidade/erro da cena para a aplicação, sem depender de qualquer componente de chat.
- [x] Tratar falha de inicialização com aviso legível; o fallback ilustrado será concluído na fase 12.

## Fora do escopo

- Controles de órbita na experiência final, sala e personagem.
- Pós-processamento, física e otimização avançada.

## Critérios de aceitação

- [x] Há somente um canvas WebGL e um loop ativo.
- [x] A geometria de referência mantém proporção correta após resize.
- [x] Redimensionar para um contêiner pequeno ou momentaneamente sem área não provoca exceção.
- [x] Ocultar e reabrir a aba não causa avanço brusco de animação — validado por visibilidade simulada; ocultação nativa sem cobertura neste navegador.
- [x] Desmontar e remontar não duplica canvas, listeners ou loops.
- [x] Uma falha do renderer aparece como erro controlado.

## Verificação

1. Abrir, redimensionar, ocultar e retomar a página.
2. Desmontar/remontar em desenvolvimento e inspecionar quantidade de canvas e ausência de erros.
3. Executar typecheck e build.

## Casos especiais e decisões

- Não acessar DOM do chat neste módulo.
- Se o renderizador falhar, emitir disponibilidade negativa; a inicialização futura do chat não deve depender dessa disponibilidade.

## Evidências e atualização do progresso

Ao concluir, atualizar a linha desta fase em [progresso.md](progresso.md): status, arquivos alterados, checks executados, evidências e limitações. Não marcar concluída com critérios essenciais pendentes. O relatório deve distinguir o que foi verificado do que ficou sem cobertura.


