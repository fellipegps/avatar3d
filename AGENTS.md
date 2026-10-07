# Orientações para o Codex — MVP 3D

## Objetivo

Construir uma aplicação web com personagem GLB animada, sala 3D e chat local. Usar o Spec-Driven Development deste pacote como sequência de trabalho. A presente entrega é documentação de planejamento; a implementação começa quando solicitada.

## Leitura e ordem

- Ler `specs/README.md`, `specs/00-escopo-e-contratos.md` e `specs/progresso.md` antes de implementar.
- Inspecionar código, scripts e instruções existentes no repositório.
- Executar a primeira fase pendente com dependências resolvidas; concluir e verificar antes de avançar no trabalho dependente.
- Atualizar o progresso com evidências reais. Não marcar concluída uma fase apenas porque o código compila.
- Fases 13 e 14 são opcionais. Não incluir áudio como requisito de conclusão do núcleo.
- Ao integrar este arquivo em outro repositório, preservar orientações existentes e resolver conflitos explicitamente; não sobrescrever regras locais.

## Stack e fronteiras

- Vite vanilla-ts, TypeScript estrito, HTML/CSS no DOM e Three.js direto.
- Personagem e sala compartilham uma cena, uma câmera e um canvas WebGL.
- UI e provider não importam Three.js. A cena não lê texto nem estado interno do chat.
- AppController coordena módulos por contratos tipados.
- Um loop da cena atualiza animações e renderização. O store muda apenas com eventos da conversa/configuração.
- Preferir dependências e abstrações pequenas. Não adicionar backend, framework de UI, banco ou serviços de IA ao núcleo.

## Modelo 3D

- Selecionar e validar asset com origem, licença, rig, clipes e controles faciais.
- Mapear nomes reais em manifesto; não presumir que todo GLB tenha idle ou mouthOpen.
- Não declarar o MVP concluído usando um placeholder como personagem final.
- Não copiar assets proprietários da referência. Se o asset viável depender de compra ou trabalho artístico indisponível, registrar um bloqueio concreto e alternativas.

## Execução e qualidade

- Implementar o escopo de cada fase com critérios observáveis e tratamento dos casos especiais.
- Preservar trabalho do usuário e evitar alterações não relacionadas.
- Não pedir confirmação para decisões rotineiras já cobertas pelo escopo; registrar decisões relevantes.
- Não declarar testes, dispositivos, métricas ou validações que não foram realmente executados.
- Usar os comandos reais do projeto para tipo, build e testes significativos.
- Verificar UI e 3D em navegador. Testes unitários não substituem inspeção de aparência e animação.
- Cancelar respostas antigas e liberar recursos no descarte. Tratar falha do 3D mantendo o chat disponível.
- Não publicar/deployar, comprar assets ou adicionar integrações externas como parte implícita deste pacote.

## Relatório por fase

Informar o resultado, os arquivos alterados, a verificação feita e as limitações. Registrar em `specs/progresso.md` o status correspondente e links relativos para evidências disponíveis. Se uma fase estiver bloqueada, registrar o requisito ausente e o próximo passo concreto; continuar apenas em tarefas independentes que respeitem os contratos.

