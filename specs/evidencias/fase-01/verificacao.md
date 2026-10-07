# Verificação da fase 01

Data: 07/10/2026. Ambiente Windows, Node 22.20.0 e npm 11.7.0.

## Critérios de aceitação

| Critério | Evidência real |
| --- | --- |
| Desenvolvimento abre com estrutura mínima | `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`; Vite pronto em 1812 ms. Página aberta e inspecionada visualmente: [captura](desenvolvimento.jpg). |
| TypeScript estrito e tipos sem erros | `strict: true` em [tsconfig](../../../tsconfig.json); `npm run typecheck`, código 0: [log](typecheck.txt). |
| Build gera dist e preview abre | `npm run build`, código 0: [log](build.txt). `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort`; página de produção aberta: [captura completa](preview.jpg). |
| Inicialização única | index.html referencia somente src/main.ts. DOM de produção contém um script de módulo `/assets/index-DtnI24Iu.js`, uma raiz, um contêiner de cena e um de interface: [inspeção](navegador.json). Em dev, o Vite injeta também `/@vite/client`, além da entrada da aplicação. |
| Dependências com finalidade definida | Three.js 0.186.1 (cena futura); @types/three 0.186.0 (tipagem); TypeScript 7.0.2 (typecheck); Vite 8.3.3 (dev/build/preview). Lockfile gerado pela instalação. |

O requisito `engines.node` do pacote Vite instalado foi consultado: `^20.19.0 || >=22.12.0`; o Node 22.20.0 disponível atende. A [documentação oficial do Vite](https://vite.dev/guide/) também foi consultada.

## Inspeção visual e limites

- Desenvolvimento em 1280×720: painéis lado a lado, textos legíveis e nenhum overflow horizontal observado.
- Produção: DOM e console inspecionados em 1280×720; nenhum aviso/erro registrado nas categorias consultadas. Após exibir o navegador, viewport 664×484; captura de página completa mostra os painéis empilhados e sem corte horizontal. A captura inicial com navegador oculto não foi utilizável e foi substituída pela captura visível.
- Nenhum canvas, renderer ou chat funcional foi criado nesta fase. O símbolo decorativo é apenas o aviso de área reservada.
- Não foram executados testes de WebGL, animação, dispositivos móveis reais, desempenho ou acessibilidade completa. Nenhum teste unitário foi acrescentado para esta base estática.
- A primeira tentativa de consulta ao npm falhou por restrição de rede/cache; a instalação pelo registro npm com execução autorizada terminou com sucesso, sem vulnerabilidades informadas pelo npm naquele momento.
- Nenhum deploy realizado. As fases posteriores não foram implementadas.
