# Verificação da fase 04 — 07/10/2026

## Resultado

Escritório em geometria 3D, com piso, duas paredes, mesa com quatro pernas, dois monitores com suportes, luminária, planta e caneca. Vita mantém o transform validado no manifesto e fica atrás da mesa. Um único SceneController possui renderer, cena, câmera e loop para ambos.

## Critérios e evidências

| Critério | Verificação executada |
| --- | --- |
| Objetos essenciais em 3D | Inspeção [frontal](frontal.jpg) e [lateral](lateral.jpg); meshes reais identificados na página de testes. Sem imagem de fundo. |
| Renderer, cena e câmera compartilhados | [14/14 checks do ambiente](testes-ambiente.json): um canvas, GLB e grupo office na mesma cena; troca de vista reaproveita a câmera. |
| Mesa oculta o corpo com profundidade coerente | Capturas frontal/lateral e raycast entre câmera e ponto do corpo (0; 0,65; 0), interceptado primeiro por desk-top. O tampo ocupa Z de 0,2 a 1,1 m; a personagem permanece em Z=0. Parte das pernas continua visível sob a mesa. |
| Rosto livre e dentro da câmera | Observação frontal nos estados [repouso](frontal.jpg), [pensamento](pensando.jpg) e [resposta](respondendo.jpg); região facial amostrada por nove pontos de projeção/raycast, com corpo pausado nos testes. Inspeção lateral sem corte do rosto. Não é uma prova geométrica de todos os vértices em todos os instantes dos clipes. |
| Layout ajustável por configuração | Medidas/posições em environmentConfig e câmera/alvo em sceneConfig.composition. Teste cria ambiente alternativo com tampo de 3 m e centro a 0,85 m, sem editar construção. |
| Descarte sem dupla liberação | Chamadas duplicadas ao descarte do SceneController: sete geometrias e oito materiais emitem dispose exatamente uma vez cada. Grupo removido e vazio, canvas removido. |

## Checks executados

- [npm run typecheck](typecheck.txt): código 0.
- [npm run build](build.txt): código 0; build inclui typecheck. JS minificado 645,40 kB / 164,42 kB gzip, com o aviso já conhecido de chunk acima de 500 kB.
- `/tests/environment.html`: [14/14 checks](testes-ambiente.json), usando WebGL 2, GLB e geometria reais.
- `/tests/scene.html`: [24/24 checks](regressao-cena.json), incluindo perda/restauração real de contexto, descarte, remontagens e falhas. Relógio, DPR e visibilidade são controlados pela página. Testes antigos foram adaptados ao piso compartilhado e aos eixos da câmera inclinada após remoção do cubo.
- `/tests/character.html`: [26/26 checks](regressao-personagem.json), incluindo rig, animações, face, cancelamento, erros e descarte. HTTP/aborto no parse têm pontos de falha controlados.
- Preview em `http://127.0.0.1:4173/`, build final: [captura desktop](preview.jpg) e [DOM/console](preview-navegador.json). Vita carregada, um canvas, nenhum painel de inspeção e nenhum erro/aviso no console da página.
- [Captura em viewport estreito](preview-estreito.jpg): rosto e composição preservados; não equivale a validação em celular físico.

## Ambiente e limites

Windows, Node 24.15.0, npm 12.0.2, Chromium integrado ao Codex. Desenvolvimento em viewport padrão 1280×720; fixture dos testes do ambiente de 900×440. Produção conferida em 1280×720, canvas 795×440, e viewport estreito de 420×572. Perfil normal, DPR observado 1 no preview desktop. O override temporário do viewport foi removido após as capturas.

Ambiente: 31 meshes, 1.528 triângulos, sete geometrias e oito materiais compartilhados, contados por travessia da geometria. Esses números não são medição de draw calls ou FPS. Sem novos downloads, dependências ou texturas. Geometria procedural de autoria local; licença da personagem preservada.

Materiais simples, telas sem conteúdo e iluminação provisória reutilizada da fase 03. Sem sombras de contato, luz de contorno, painéis CanvasTexture ou acabamento final: fase 05. Não foram testados celular real, outras GPUs/navegadores, desempenho sustentado nem todas as proporções de tela. Nenhum deploy realizado.

## Repetir

Execute `npm run dev`; abra as três páginas em `/tests/`. Na página principal, use Enquadramento → Sala · Frontal / Sala · Lateral para verificar a profundidade; Corpo inteiro e Rosto isolam a personagem. Para produção, execute `npm run build` e `npm run preview`, e confira o endereço informado. Os controles de inspeção são exclusivos do desenvolvimento.
