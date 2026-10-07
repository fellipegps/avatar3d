# Fase 01 — Base Vite e TypeScript

Status: concluída em 07/10/2026. Tipo: MVP principal. Evidências em [progresso.md](progresso.md).

## Dependências

Nenhuma fase de implementação anterior. Ler [escopo e contratos](00-escopo-e-contratos.md), [guia de execução](README.md) e o [AGENTS.md](../AGENTS.md).

## Resultado esperado

Ter um projeto executável e tipado, com a estrutura mínima que receberá a interface e a cena.

## Arquivos previstos

- `package.json e lockfile`
- `tsconfig.json e vite.config.ts, quando necessário`
- `index.html e src/main.ts`
- `src/app/contracts.ts e src/styles/base.css`

Os caminhos orientam a implementação. Reutilizar módulos equivalentes de um repositório existente e registrar qualquer adaptação; não criar duplicações só para reproduzir a estrutura sugerida.

## Tarefas

- [x] Inspecionar o repositório e suas regras antes de alterar arquivos; preservar código e configurações existentes que sejam relevantes.
- [x] Criar ou adaptar a aplicação usando Vite vanilla-ts e TypeScript estrito.
- [x] Instalar somente as dependências necessárias para a base e Three.js; registrar versões no lockfile.
- [x] Definir scripts dev, typecheck, build e preview. O build precisa checar os tipos antes de empacotar.
- [x] Criar contêineres semânticos da aplicação, área da cena e área da interface.
- [x] Introduzir os contratos da especificação 00, sem implementar funcionalidades de fases seguintes.
- [x] Documentar os requisitos de ambiente e os comandos de execução no README do projeto.

## Fora do escopo

- Modelagem da sala, importação do GLB e animações.
- Chat funcional, áudio, backend e implantação pública.

## Critérios de aceitação

- [x] A aplicação abre pelo servidor de desenvolvimento com uma estrutura visual mínima.
- [x] TypeScript está em modo estrito e typecheck termina sem erros.
- [x] O build gera dist/ e a versão de produção abre com preview.
- [x] Existe um único ponto de inicialização da aplicação.
- [x] Nenhuma dependência sem finalidade definida foi adicionada.

## Verificação

1. Executar typecheck e build.
2. Abrir a página em desenvolvimento e em preview; registrar resultado dos comandos e captura inicial.

## Casos especiais e decisões

- Se houver um projeto existente, adaptar a base sem sobrescrever trabalho não relacionado.
- Não fixar uma versão de Node por memória: seguir o requisito da versão de Vite instalada.

## Evidências e atualização do progresso

Ao concluir, atualizar a linha desta fase em [progresso.md](progresso.md): status, arquivos alterados, checks executados, evidências e limitações. Não marcar concluída com critérios essenciais pendentes. O relatório deve distinguir o que foi verificado do que ficou sem cobertura.


