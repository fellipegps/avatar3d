import { BoxGeometry, CanvasTexture, CylinderGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, SphereGeometry, TorusGeometry } from 'three';
import type { BufferGeometry, Material } from 'three';
import { environmentConfig, visualConfig } from './scene.config';
import type { EnvironmentConfig } from './scene.config';
import { demoPanels, PanelTexture } from './PanelTexture';

/** Recursos exclusivos do ambiente, compartilhados entre suas peças e liberados uma única vez. */
export class Environment {
  readonly root = new Group();
  private readonly geometries = new Set<BufferGeometry>();
  private readonly materials = new Set<Material>();
  private readonly panels: PanelTexture[] = [];
  private contactTexture: CanvasTexture | null = null;
  private disposed = false;

  constructor(config: EnvironmentConfig = environmentConfig) {
    try { this.build(config); }
    catch (error) { this.dispose(); throw error; }
  }

  private build(config: EnvironmentConfig): void {
    this.root.name = 'office';
    const geometry = <T extends BufferGeometry>(value: T): T => { this.geometries.add(value); return value; };
    const box = geometry(new BoxGeometry(1, 1, 1));
    const cylinder = geometry(new CylinderGeometry(1, 1, 1, 16));
    const leaf = geometry(new SphereGeometry(1, 8, 6));
    const material = (color: number): MeshStandardMaterial => {
      const value = new MeshStandardMaterial({ color, roughness: 0.85 });
      this.materials.add(value);
      return value;
    };
    const colors = config.colors;
    const wall = material(colors.wall), floor = material(colors.floor), wood = material(colors.wood);
    const metal = material(colors.metal), ceramic = material(colors.ceramic);
    metal.roughness = 0.4; metal.metalness = 0.6;
    ceramic.roughness = 0.35;
    const blue = material(visualConfig.accents.blue), greenStrip = material(visualConfig.accents.green), purple = material(visualConfig.accents.purple);
    for (const strip of [blue, greenStrip, purple]) {
      strip.emissive.copy(strip.color); strip.emissiveIntensity = visualConfig.emissiveIntensity.strip;
    }
    const shadeMaterial = material(0xe8cfab);
    shadeMaterial.emissive.setHex(0xffcf85); shadeMaterial.emissiveIntensity = visualConfig.emissiveIntensity.lamp;
    const green = material(colors.leaf), coffee = material(colors.coffee);
    const group = (name: string): Group => { const value = new Group(); value.name = name; this.root.add(value); return value; };
    const piece = (parent: Group, name: string, shape: BufferGeometry, surface: Material,
      size: readonly [number, number, number], position: readonly [number, number, number]): Mesh => {
      const value = new Mesh(shape, surface);
      value.name = name; value.scale.set(...size); value.position.set(...position); parent.add(value);
      return value;
    };

    const room = group('room');
    const [width, height, depth] = config.room.size;
    const t = config.room.thickness, back = config.room.backZ;
    piece(room, 'floor', box, floor, [width, t, depth], [0, -t / 2, back + depth / 2]);
    piece(room, 'back-wall', box, wall, [width, height, t], [0, height / 2, back - t / 2]);
    // Escritório em corte: frente e lateral direita abertas para inspeção e enquadramento.
    piece(room, 'left-wall', box, wall, [t, height, depth], [-width / 2 - t / 2, height / 2, back + depth / 2]);
    piece(room, 'blue-wall-strip', box, blue, [0.025, height * 0.62, 0.015], [-width * 0.38, height * 0.51, back + 0.01]);
    piece(room, 'purple-wall-strip', box, purple, [0.025, height * 0.62, 0.015], [width * 0.38, height * 0.51, back + 0.01]);

    const desk = group('desk'); desk.position.set(...config.desk.position);
    const [dw, dh, dd] = config.desk.size;
    piece(desk, 'desk-top', box, wood, [dw, dh, dd], [0, 0, 0]);
    piece(desk, 'green-desk-strip', box, greenStrip, [dw - 0.12, 0.012, 0.008], [0, 0, dd / 2 + 0.005]);
    const legHeight = config.desk.position[1] - dh / 2, lw = config.desk.legWidth;
    for (const x of [-1, 1]) for (const z of [-1, 1]) {
      piece(desk, `desk-leg-${x}-${z}`, box, metal, [lw, legHeight, lw],
        [x * (dw / 2 - 0.13), -dh / 2 - legHeight / 2, z * (dd / 2 - 0.1)]);
    }

    config.monitors.forEach((spec, index) => {
      const monitor = group(`monitor-${index + 1}`); monitor.position.set(...spec.position); monitor.rotation.y = spec.rotationY;
      const [mw, mh, md] = spec.size;
      const content = demoPanels[index % demoPanels.length]!;
      const panel = new PanelTexture(content, visualConfig.panels.accent[index % visualConfig.panels.accent.length]);
      this.panels.push(panel);
      const screen = material(colors.screen);
      screen.map = panel.texture; screen.emissiveMap = panel.texture;
      screen.emissive.setHex(0xffffff); screen.emissiveIntensity = visualConfig.emissiveIntensity.screen;
      screen.toneMapped = false;
      piece(monitor, 'monitor-base', box, metal, [mw * 0.48, 0.025, 0.19], [0, 0.0125, 0]);
      piece(monitor, 'monitor-stand', box, metal, [0.04, 0.16, 0.04], [0, 0.09, -0.015]);
      piece(monitor, 'monitor-frame', box, metal, [mw, mh, md], [0, 0.14 + mh / 2, 0]);
      piece(monitor, 'monitor-screen', box, screen, [mw - 0.035, mh - 0.035, 0.005], [0, 0.14 + mh / 2, md / 2 + 0.003]);
    });

    const lamp = group('lamp'); lamp.position.set(...config.lamp.position);
    const lh = config.lamp.height;
    piece(lamp, 'lamp-base', cylinder, metal, [0.1, 0.025, 0.1], [0, 0.0125, 0]);
    piece(lamp, 'lamp-stem', cylinder, metal, [0.012, lh - 0.1, 0.012], [0, (lh - 0.1) / 2, 0]);
    const shade = geometry(new CylinderGeometry(0.065, 0.15, 0.15, 16));
    piece(lamp, 'lamp-shade', shade, shadeMaterial, [1, 1, 1], [0, lh - 0.075, 0]);

    const plant = group('plant'); plant.position.set(...config.plant.position);
    piece(plant, 'plant-pot', cylinder, ceramic, [0.085, 0.15, 0.085], [0, 0.075, 0]);
    piece(plant, 'plant-stem', cylinder, green, [0.012, config.plant.height - 0.12, 0.012], [0, (config.plant.height + 0.12) / 2, 0]);
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI * 2 / 3, y = 0.21 + i * (config.plant.height - 0.25) / 6;
      const mesh = piece(plant, `leaf-${i}`, leaf, green, [0.065, 0.13, 0.035], [Math.cos(angle) * 0.065, y, Math.sin(angle) * 0.065]);
      mesh.rotation.set(0, -angle, -0.5);
    }

    const mug = group('mug'); mug.position.set(...config.mug.position);
    const { radius: r, height: h } = config.mug;
    const cup = geometry(new CylinderGeometry(r, r, h, 20, 1, true));
    piece(mug, 'mug-body', cup, ceramic, [1, 1, 1], [0, h / 2, 0]);
    const rim = geometry(new TorusGeometry(r, 0.005, 6, 20));
    piece(mug, 'mug-rim', rim, ceramic, [1, 1, 1], [0, h, 0]).rotation.x = Math.PI / 2;
    piece(mug, 'coffee', cylinder, coffee, [r - 0.005, 0.004, r - 0.005], [0, h - 0.012, 0]);
    const handle = geometry(new TorusGeometry(h * 0.28, 0.009, 6, 16));
    piece(mug, 'mug-handle', handle, ceramic, [1, 1, 1], [r, h / 2, 0]);

    // Mancha de contato local compartilhada; não adiciona passes de shadow map.
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = visualConfig.contactShadow.textureSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Não foi possível desenhar a sombra de contato.');
    const half = canvas.width / 2;
    const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
    gradient.addColorStop(0, 'rgba(0,0,0,0.8)'); gradient.addColorStop(0.4, 'rgba(0,0,0,0.5)'); gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.contactTexture = new CanvasTexture(canvas); this.contactTexture.name = 'contact-shadow';
    const contact = new MeshBasicMaterial({ map: this.contactTexture, transparent: true, opacity: visualConfig.contactShadow.opacity,
      depthWrite: false, toneMapped: false });
    this.materials.add(contact);
    const plane = geometry(new PlaneGeometry(1, 1));
    const shadows = group('contact-shadows');
    piece(shadows, 'character-contact', plane, contact, [0.65, 0.5, 1], [0, 0.003, 0]).rotation.x = -Math.PI / 2;
    for (const x of [-1, 1]) for (const z of [-1, 1]) {
      piece(shadows, `desk-contact-${x}-${z}`, plane, contact, [0.25, 0.25, 1],
        [config.desk.position[0] + x * (dw / 2 - 0.13), 0.003, config.desk.position[2] + z * (dd / 2 - 0.1)]).rotation.x = -Math.PI / 2;
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.root.removeFromParent();
    this.root.clear();
    this.panels.forEach(panel => panel.dispose()); this.panels.length = 0;
    this.contactTexture?.dispose();
    if (this.contactTexture) {
      const canvas = this.contactTexture.image as HTMLCanvasElement;
      canvas.width = 1; canvas.height = 1;
    }
    this.contactTexture = null;
    this.geometries.forEach(value => value.dispose());
    this.materials.forEach(value => value.dispose());
    this.geometries.clear(); this.materials.clear();
  }
}
