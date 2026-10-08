import { CanvasTexture, SRGBColorSpace } from 'three';
import { visualConfig } from './scene.config';

export interface PanelContent {
  title: string;
  label: string;
  value: string;
  samples: readonly number[];
}

/** Dados decorativos fixos e locais. Nunca representam consultas ou cotações reais. */
export const demoPanels: readonly PanelContent[] = [
  { title: 'ATELIÊ / 01', label: 'IDEIAS EM MOVIMENTO', value: '72', samples: [0.25, 0.39, 0.3, 0.51, 0.44, 0.68, 0.59, 0.8] },
  { title: 'ESTÚDIO / 02', label: 'RITMO CRIATIVO', value: '84', samples: [0.44, 0.32, 0.55, 0.48, 0.7, 0.64, 0.87, 0.76] },
];

/** Só desenha e marca upload quando o conteúdo visível muda; nenhum timer ou atualização por frame. */
export class PanelTexture {
  readonly texture: CanvasTexture;
  private readonly context: CanvasRenderingContext2D;
  private signature = '';
  private draws = 0;
  private disposed = false;

  constructor(content: PanelContent, private readonly accent: string = visualConfig.panels.accent[0]) {
    const canvas = document.createElement('canvas');
    canvas.width = visualConfig.panels.width; canvas.height = visualConfig.panels.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Não foi possível desenhar os painéis locais.');
    this.context = context;
    this.texture = new CanvasTexture(canvas);
    this.texture.name = 'demo-panel';
    this.texture.colorSpace = SRGBColorSpace;
    this.update(content);
  }

  get drawCount(): number { return this.draws; }

  update(content: PanelContent): boolean {
    if (this.disposed) return false;
    const signature = JSON.stringify([content.title, content.label, content.value, content.samples]);
    if (signature === this.signature) return false;
    const ctx = this.context, palette = visualConfig.panels;
    ctx.fillStyle = palette.background; ctx.fillRect(0, 0, palette.width, palette.height);
    ctx.fillStyle = this.accent; ctx.fillRect(24, 28, 5, 30);
    ctx.font = 'bold 26px sans-serif'; ctx.fillText(content.title, 44, 53);
    ctx.fillStyle = palette.foreground; ctx.font = 'bold 48px sans-serif'; ctx.fillText('DEMO', 590, 60);
    ctx.fillStyle = palette.muted; ctx.font = '20px sans-serif'; ctx.fillText(content.label, 28, 102);
    ctx.fillStyle = palette.foreground; ctx.font = 'bold 76px sans-serif'; ctx.fillText(content.value, 28, 187);
    ctx.fillStyle = palette.muted; ctx.font = '18px sans-serif'; ctx.fillText('DADOS FICTÍCIOS · LOCAL', 28, 354);
    ctx.strokeStyle = palette.grid; ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const y = 207 + i * 36; ctx.beginPath(); ctx.moveTo(28, y); ctx.lineTo(740, y); ctx.stroke();
    }
    ctx.strokeStyle = this.accent; ctx.lineWidth = 5; ctx.beginPath();
    content.samples.forEach((sample, i) => {
      const x = 28 + i * 712 / Math.max(1, content.samples.length - 1);
      const y = 314 - Math.max(0, Math.min(1, Number.isFinite(sample) ? sample : 0)) * 100;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    this.signature = signature;
    this.draws++;
    this.texture.needsUpdate = true;
    return true;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.texture.dispose();
    // O renderer já foi informado; liberar também o bitmap do canvas local.
    this.context.canvas.width = 1; this.context.canvas.height = 1;
  }
}
