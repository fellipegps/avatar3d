# Fase 14 — Boca pela amplitude — extensão opcional

Status inicial: pendente. Tipo: extensão opcional.

## Dependências

Concluir [13 — Áudio gravado — extensão opcional](13-audio-gravado-opcional.md). Ler [escopo e contratos](00-escopo-e-contratos.md), [guia de execução](README.md) e o [AGENTS.md](../AGENTS.md).

## Resultado esperado

Dirigir a abertura da boca pela energia do áudio reproduzido, com suavização e fechamento correto.

## Arquivos previstos

- `src/audio/AudioController.ts`
- `src/audio/MouthAmplitude.ts, se necessário`
- `src/scene/CharacterController.ts`
- `src/app/AppController.ts`

Os caminhos orientam a implementação. Reutilizar módulos equivalentes de um repositório existente e registrar qualquer adaptação; não criar duplicações só para reproduzir a estrutura sugerida.

## Tarefas

- [ ] Conectar o sinal a AnalyserNode antes do controle de volume.
- [ ] Reutilizar buffer de amostras no domínio do tempo para calcular RMS.
- [ ] Adicionar limiar de silêncio e ganho configuráveis, normalizando a saída para 0–1.
- [ ] Suavizar abertura e fechamento com delta em segundos; não depender apenas de smoothingTimeConstant.
- [ ] Enviar somente valores normalizados ao controle facial; respeitar o mecanismo escolhido no manifesto.
- [ ] No silêncio, fim, erro, reinício ou cancelamento, retornar a boca a zero.
- [ ] Manter texto como alternativa e preservar a regra de um único loop de cena.
- [ ] Documentar que a técnica acompanha energia, sem identificar fonemas.

## Fora do escopo

- Alinhamento fonema a fonema, visemas e blend shapes específicos de vogais.
- Substituição do asset para obter um rosto completamente diferente.

## Critérios de aceitação

- [ ] Boca abre durante trechos de fala e fecha em pausas reconhecíveis.
- [ ] Valores ficam na faixa 0–1 e a suavização não depende do FPS.
- [ ] Não há alocação de um novo buffer de áudio a cada frame.
- [ ] Piscar e animação corporal continuam funcionando.
- [ ] Encerrar ou interromper áudio fecha a boca imediatamente ou com fechamento breve definido.
- [ ] Modo sem áudio funciona e não simula precisão fonética.

## Verificação

1. Usar um áudio com fala e pausas claras, testando também volume e cancelamento.
2. Registrar vídeo curto com som e reexecutar checks existentes.

## Casos especiais e decisões

- Analisar o sinal antes do ganho evita que ajustar volume mude artificialmente a abertura.
- A análise por amplitude não produz visemas; essa evolução exigiria novo escopo e asset compatível.

## Evidências e atualização do progresso

Ao concluir, atualizar a linha desta fase em [progresso.md](progresso.md): status, arquivos alterados, checks executados, evidências e limitações. Não marcar concluída com critérios essenciais pendentes. O relatório deve distinguir o que foi verificado do que ficou sem cobertura.

