# 00 — Escopo, arquitetura e contratos

Versão da especificação: 1.0. Data: 5 de outubro de 2026. Este arquivo define a base comum das fases; não é uma fase de implementação.

## Fontes e pressupostos

A arquitetura se baseia no e-mail de Marlon fornecido por Fellipe e na captura do site Kady. O e-mail informa JavaScript modular com Vite, UI no DOM, Three.js, modelos do Blender em GLB, animação esquelética, atlas facial e abertura de boca pela amplitude do áudio. O funcionamento do site ao vivo e seu código não foram verificados.

Assumimos uma personagem estilizada atrás de uma mesa, sala escura com monitores, luminária, planta e caneca, acentos luminosos e chat lateral. Não existe um GLB fornecido nesta documentação. A aparência final depende do asset escolhido; selecionar modelo próprio ou licenciado e registrar a origem.

## Resultado do núcleo

- Personagem 3D com rig e clipes para repouso, pensamento e resposta.
- Piscar e controle de abertura da boca compatíveis com o modelo.
- Sala e objetos em geometria 3D, compartilhando iluminação, profundidade e canvas com a personagem.
- Chat local com respostas pré-definidas, latência simulada, indicador de espera e reinício.
- Interface responsiva, controles funcionais, movimento reduzido e qualidade econômica.
- Carregamento e falhas tratados, build estático e instruções de execução.

Fases 01–12 entregam o núcleo sem áudio. Fases 13–14 acrescentam reprodução de arquivos estáticos e boca guiada pela energia do sinal.

## Fora do escopo do núcleo

IA real, backend, autenticação, banco, persistência de histórico, upload, microfone, reconhecimento de fala, cotações reais, TTS de servidor, visemas, física e câmera livre de produção. O histórico vive em memória durante a sessão. Dados decorativos são fictícios e identificados como DEMO.

## Stack

| Item | Escolha |
| --- | --- |
| Projeto | Vite vanilla-ts e TypeScript estrito |
| UI | HTML semântico, CSS e módulos de DOM |
| Cena | Three.js direto e WebGLRenderer |
| Assets | GLB, GLTFLoader e manifesto tipado |
| Animações | AnimationMixer/AnimationAction |
| Painéis | CanvasTexture em superfícies 3D |
| Estado | Store pequeno com inscrições |
| Chat | Provider local com Promise e AbortSignal |
| Áudio opcional | Web Audio API e arquivos estáticos |
| Distribuição | dist/ servido por HTTPS quando houver pedido de publicação |

Não introduzir React, React Three Fiber, NestJS, ORM, Redis ou bibliotecas de estado/consulta sem uma mudança de requisito que as justifique. Fixar versões no lockfile. Checagem de tipos deve fazer parte do build, pois a transpilação do Vite não a substitui.

## Contratos públicos

Estes contratos definem a fronteira mínima. Podem ser ampliados de forma consistente quando uma fase exigir, registrando o motivo e atualizando consumidores.

```ts
type ConversationPhase = 'idle' | 'waiting' | 'revealing' | 'error';
type CharacterState = 'idle' | 'thinking' | 'responding';
type QualityProfile = 'normal' | 'economy';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface ChatReply {
  id: string;
  text: string;
  audioUrl?: string; // usado apenas na extensão
}

interface ChatProvider {
  reply(text: string, signal: AbortSignal): Promise<ChatReply>;
}

interface ScenePort {
  setCharacterState(state: CharacterState): void;
  setMouthOpen(value: number): void;
  setReducedMotion(enabled: boolean): void;
  setQuality(profile: QualityProfile): void;
  dispose(): void;
}
```

Nomes lógicos dos estados não equivalem aos nomes reais dos clipes. O manifesto resolve clipes, meshes, controles faciais e transformações. O controlador da cena pode implementar capacidades progressivamente, mas cada método usado deve ter comportamento definido antes da integração correspondente; não deixar métodos vazios na entrega final.

## Responsabilidades

| Módulo | Cuida de |
| --- | --- |
| AppController | Inicialização, conversa ativa, cancelamento e comandos para UI/cena |
| ChatView/ControlsView | DOM, eventos, foco, rolagem e apresentação de texto |
| ConversationStore | Histórico e fase da conversa |
| MockChatProvider | Catálogo, intenção simples e latência cancelável |
| SceneController | Renderer, câmera, resize, loop e disponibilidade |
| Environment | Sala, objetos, materiais e painéis |
| CharacterController | GLB, mixer, transições e face |
| AssetLoader | Carregamento, erro e validação |
| AudioController | Extensão de reprodução e análise |

Nenhuma atualização por frame da personagem passa pelo store. Nenhum texto do chat é interpretado dentro da cena. A UI recebe a mensagem completa do domínio; a apresentação gradual é uma atividade cancelável da UI, sem gravar uma nova versão no store a cada letra.

## Ciclo da conversa

| Evento | Fase | Personagem |
| --- | --- | --- |
| Pronto | idle | idle |
| Envio válido | waiting | thinking |
| Resposta atual recebida | revealing | responding |
| Apresentação concluída | idle | idle |
| Falha da resposta | error | idle |
| Reinício | idle | idle |

Uma solicitação ativa por vez. O usuário pode continuar digitando enquanto aguarda, mas não enviar novamente. Reinício aborta provider e apresentação, invalida a geração ativa e impede efeitos de respostas antigas. Falha do renderer não impede envio ou resposta do chat.

## Regras do asset e do rosto

Validar o GLB cedo, antes da sala detalhada. O modelo precisa ter esqueleto e animações coerentes, orientação/escala documentadas, piscar e boca. Preferir morph targets existentes. Usar atlas somente se o rosto tiver UV/material preparados; implementar apenas o mecanismo selecionado. Os canais faciais não podem ser sobrescritos continuamente pelo mixer corporal.

Imagens, capturas e ilustrações geradas não equivalem a modelo GLB com rig. Placeholder não conclui a fase da personagem. Animações vindas de outro rig exigem retargeting validado. Registrar direitos de uso em assets/credits.md.

## Ciclo de vida e qualidade

Um canvas e um loop; delta em segundos com limite após suspensão; ResizeObserver baseado no contêiner; pausa de renderização em aba oculta. dispose deve cancelar solicitações, timers, áudio, loops e observadores e liberar recursos criados, evitando dupla liberação dos compartilhados. Caminhos de assets devem respeitar a base do Vite.

A implementação deve suportar fallback estático quando WebGL 2 estiver indisponível e recuperação controlada de perda de contexto. Fallback não substitui a entrega 3D principal.

| Medida | Referência inicial |
| --- | --- |
| Personagem | Até aproximadamente 60 mil triângulos |
| Ambiente | Até aproximadamente 40 mil triângulos |
| Draw calls | Cerca de 80 ou menos no frame comum |
| Transferência essencial | Cerca de 15 MB para app e primeira cena |
| Texturas | Preferir 1024 px para personagem e 512–1024 px para objetos |
| Pixel ratio | Limite 1,5 no perfil normal e 1 no econômico |
| FPS | Buscar 60 no computador e ao menos 30 no celular de referência |

Metas são referências de projeto, não promessas para qualquer hardware. Medir equipamentos disponíveis e registrar modelo/perfil/resolução. Se não houver acesso a celular real, registrar falta dessa cobertura. Otimizar assets, sombras e pixel ratio antes de adicionar efeitos ou compressão.

## Mudanças e verificação

Inspecionar visualmente GLB, clipes, rosto, enquadramento e luzes. Automatizar os caminhos de estado/cancelamento que têm risco real de corrida. Rodar build e tipos, além dos testes existentes afetados. Não escrever testes que apenas reproduzem detalhes triviais da implementação.

Se um contrato mudar, atualizar este arquivo e as fases afetadas. O registro deve explicar o motivo, o impacto e o que foi verificado. Este pacote detalha o planejamento de arquitetura entregue anteriormente; 01–12 representam sua sequência principal mais granular.
