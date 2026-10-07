# Spec-Driven Development — MVP 3D

Este diretório contém a sequência de implementação de uma personagem 3D em uma sala 3D, com chat simulado. Há 12 fases principais e 2 extensões opcionais, cada uma em seu próprio arquivo Markdown.

## Como usar

1. Copiar o diretório `specs/` para a raiz do projeto.
2. Copiar ou integrar o `AGENTS.md` à raiz. Se já existir um AGENTS.md, preservar suas instruções e acrescentar somente as orientações compatíveis deste pacote.
3. Ler [00 — escopo e contratos](00-escopo-e-contratos.md).
4. Usar [progresso.md](progresso.md) como registro do que realmente foi implementado e verificado.
5. Executar uma fase por vez na ordem abaixo. O fim de uma fase exige critérios de aceitação e evidências, não apenas arquivos criados.
6. Continuar pelas fases principais após validar as dependências. Áudio é opcional e entra somente quando o núcleo estiver concluído e essa extensão fizer parte do pedido de implementação.

As especificações descrevem a sequência de trabalho. As fases 01 e 02 já foram implementadas; consulte [progresso.md](progresso.md) para o status, as evidências reais e as limitações da verificação. O modelo GLB ainda precisa ser selecionado/fornecido e validado.

## Ordem de execução

| Fase | Especificação | Tipo | Depende de |
| --- | --- | --- | --- |
| 01 | [Base Vite e TypeScript](01-base-vite-typescript.md) | Principal | — |
| 02 | [Renderer, câmera e ciclo de vida](02-renderer-camera-ciclo-de-vida.md) | Principal | 01 |
| 03 | [Validação do modelo da personagem](03-validacao-asset-personagem.md) | Principal | 02 |
| 04 | [Sala e objetos 3D](04-sala-e-objetos-3d.md) | Principal | 03 |
| 05 | [Materiais, iluminação e painéis](05-materiais-luzes-paineis.md) | Principal | 04 |
| 06 | [Animações corporais e transições](06-animacoes-corporais.md) | Principal | 05 |
| 07 | [Piscar e controles faciais](07-expressoes-faciais.md) | Principal | 06 |
| 08 | [Interface do chat e controles](08-interface-chat-controles.md) | Principal | 07 |
| 09 | [Estado da conversa e provider local](09-estado-conversa-mock.md) | Principal | 08 |
| 10 | [Integração entre chat e personagem](10-integracao-chat-personagem.md) | Principal | 09 |
| 11 | [Responsividade e acessibilidade](11-responsividade-acessibilidade.md) | Principal | 10 |
| 12 | [Resiliência, desempenho e entrega do núcleo](12-resiliencia-performance-entrega.md) | Principal | 11 |
| 13 | [Áudio gravado — extensão opcional](13-audio-gravado-opcional.md) | Opcional | 12 |
| 14 | [Boca pela amplitude — extensão opcional](14-boca-amplitude-opcional.md) | Opcional | 13 |

A fase 03 valida a dependência artística antes da construção detalhada. Se não existir um modelo viável, registrar o bloqueio e alternativas; tarefas independentes de UI e mock podem avançar preservando contratos, sem declarar pronta a personagem ou o MVP.

## Prompt para iniciar no Codex

```text
Leia AGENTS.md, specs/README.md, specs/00-escopo-e-contratos.md e
specs/progresso.md. Implemente a primeira fase principal pendente cujas
dependências estejam concluídas. Antes de editar, inspecione o repositório.
Siga o escopo da fase, valide seus critérios e atualize specs/progresso.md
com evidências reais. Não implemente fases opcionais neste pedido.
```

## Prompt para seguir a sequência principal

```text
Siga a sequência principal de specs/01 a specs/12. Execute e valide uma
fase por vez, atualizando specs/progresso.md a cada conclusão. Continue
pelas dependências resolvidas sem pedir confirmação para escolhas
rotineiras. Se houver bloqueio concreto, registre evidências e avance
somente em trabalho independente. Preserve as regras do repositório.
```

## Prompt para a extensão de áudio

```text
Confirme no registro que o núcleo está concluído. Implemente specs/13
e depois specs/14, com os critérios e evidências definidos em cada arquivo.
Preserve o funcionamento do chat sem som e atualize specs/progresso.md.
```

## Regra de mudança de escopo

Se uma descoberta técnica exigir alterar um contrato, registrar motivo e impacto em 00 e nas fases afetadas antes da implementação dependente. Escolhas rotineiras de arquivos, estilos ou parâmetros podem ser feitas pelo Codex e registradas no progresso. Expansões de produto não devem ser introduzidas como requisito do MVP.
