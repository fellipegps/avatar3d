# Verificação da fase 05 — 07/10/2026

## Resultado e critérios

| Critério | Evidência executada |
| --- | --- |
| Olhos/rosto legíveis e sala escura | Comparação da mesma composição [antes](antes.jpg) / [depois](depois.jpg), além do [rosto aproximado](rosto.jpg) e [preview desktop](preview.jpg). Inspeção visual confirma olhos, boca e cabelo legíveis. |
| Luzes separam personagem e fundo | Luz principal quente à frente, contorno roxo atrás, ambiente reduzido e luz explícita na luminária. [Vista lateral](lateral.jpg) e captura do rosto mostram contorno no cabelo/ombros. Emissivos das faixas/monitores não substituem luzes. |
| Painéis são superfícies da cena | Dois meshes monitor-screen com mapas CanvasTexture sRGB e emissiveMap; [teste](testes-paineis.json) e vista lateral verificam profundidade/perspectiva. |
| Sem redesenho/upload contínuo | Após carga e upload inicial, 45 quadros reais mantiveram versões `[2, 2]` e zero callbacks de novos uploads. Conteúdo idêntico não redesenha; mudança de amostra redesenha uma vez; chamadas após dispose são ignoradas. [Resultados](testes-paineis.json). |
| Conteúdo fictício identificado | DEMO no canto dos dois monitores, DADOS FICTÍCIOS · LOCAL no rodapé da textura e legenda DOM em produção. Gráficos/números declarados localmente em PanelTexture.ts; sem consulta externa. |
| Descarte de materiais/texturas | Oito geometrias, 14 materiais e três texturas emitiram dispose exatamente uma vez após descarte duplo do ambiente. Mapa de cor/emissivo compartilha a mesma textura sem dupla liberação. Canvas reduzido a 1×1 no descarte. Falha controlada no segundo canvas 2D libera a textura já criada do primeiro painel. |

## Métricas observadas, sem benchmark de FPS

Snapshots reais de `renderer.info`, no mesmo canvas 795×440 e DPR 1, câmera frontal, corpo pausado. Windows / Chromium integrado / ANGLE Intel Iris Xe (Direct3D11), conforme renderer informado pelo navegador. [Antes](metricas-antes.json) e [depois/GPU](metricas-depois.json).

| Medida | Fase 04 antes | Fase 05 | Fase 05 sem manchas de contato |
| --- | ---: | ---: | ---: |
| Draw calls por quadro | 51 | 59 | 54 |
| Triângulos desenhados por quadro | 28.618 | 28.664 | 28.654 |
| Geometrias na memória do renderer | 23 | 24 | 24 |
| Texturas na memória do renderer | 29 | 32 | 32 |
| Programas compilados | 8 | 10 | 10 |
| Shadow map habilitado | não | não | não |

Escolha: cinco manchas de contato radiais compartilham um material e uma textura 128×128. Custam cinco calls/dez triângulos, sem passes de shadow maps; cena completa fica abaixo da referência de cerca de 80 calls. Não foi implementada nem medida uma alternativa com sombras projetadas. São manchas estáticas no piso, sem reprodução da silhueta ou projeção de sombras de objetos sobre a mesa.

Perfil econômico também observado: 59 calls / 28.664 triângulos. Com DPR físico 1, normal e econômico possuem o mesmo buffer nessa máquina. A limitação de DPR 1,5/1 continua coberta por DPR controlado na regressão da fase 02.

O ambiente possui 39 meshes, 1.574 triângulos únicos, oito geometrias, 14 materiais e três texturas geradas localmente (duas 768×384, uma 128×128). `renderer.info` conta desenhos, inclusive passes de materiais; não equivale à soma de triângulos únicos do GLB/ambiente. Contagens não provam FPS nem uso de memória em bytes.

## Verificações

- [npm run typecheck](typecheck.txt), código 0.
- [npm run build](build.txt), código 0, com aviso de chunk acima de 500 kB: JS 650,64 kB / 166,37 kB gzip. Aviso preservado para a fase 12.
- `/tests/lighting.html`: [10/10](testes-paineis.json), com renderer e texturas reais; falha do segundo canvas controlada pelo teste.
- `/tests/environment.html`: [14/14](regressao-ambiente.json), oclusão, enquadramento, configuração e descarte.
- `/tests/scene.html`: [24/24](regressao-cena.json), resize, loop, perda/restauração real de contexto, remontagem e falhas. Relógio, visibilidade e DPR controlados pela página.
- `/tests/character.html`: [26/26](regressao-personagem.json), asset real, rig, face, clipes, abort e falhas. Falhas HTTP/parse controladas. **74/74 no total.**
- Build final em `http://127.0.0.1:4173/`: [preview](preview.jpg), [DOM/console](preview-navegador.json): modelo carregado, um canvas, zero inspetores de desenvolvimento, zero erros/avisos da página. O aviso de empacotamento acima pertence ao build, não ao console da página.
- Produção em 1280×720, canvas 795×440; [viewport estreito](preview-estreito.jpg) em [425×570](viewport-estreito.json), sem corte do rosto. Override de viewport desktop removido ao terminar.

## Fluxo local verificado e limites

Entrada em main.ts → AppController → SceneController/Environment e carregamento do GLB local → materiais/luzes/CanvasTexture → único canvas WebGL. Não existem API, backend, credenciais ou fontes remotas nesta fase. O servidor de desenvolvimento existente foi reutilizado, e o build final foi servido pelo preview local existente.

Nenhuma dependência, arquivo externo de textura ou alteração no GLB. Sem bloom, pós-processamento, câmera livre ou implementação de fases 06+. As manchas de contato pressupõem posições atuais; se a personagem passar a se deslocar, deverão ser reposicionadas. Painéis são decorativos; textos pequenos não foram tratados como informação essencial da UI. Não foram testados celular real, outras GPUs/navegadores nem FPS sustentado. Não houve deploy. Esses limites não deixam critérios essenciais da fase 05 pendentes.

## Repetir

Execute `npm run dev` e abra `/tests/lighting.html` para métricas/resultados, além das três páginas anteriores em `/tests/`. Na página principal, use Enquadramento → Rosto / Sala · Frontal / Sala · Lateral para conferir iluminação e perspectiva. Para produção, execute `npm run build` e `npm run preview`. O snapshot `SceneController.getRenderStats()` é usado pela inspeção, sem leituras ou uploads extras no loop da aplicação.
