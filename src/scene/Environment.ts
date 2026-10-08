import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry, TorusGeometry } from 'three';
import type { BufferGeometry } from 'three';
import { environmentConfig } from './scene.config';
import type { EnvironmentConfig } from './scene.config';

/** Recursos exclusivos do ambiente, compartilhados entre suas peças e liberados uma única vez. */
export class Environment {
  readonly root = new Group();
  private readonly geometries = new Set<BufferGeometry>();
  private readonly materials = new Set<MeshStandardMaterial>();
  private disposed = false;

  constructor(config: EnvironmentConfig = environmentConfig) {
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
    const metal = material(colors.metal), screen = material(colors.screen), ceramic = material(colors.ceramic);
    const green = material(colors.leaf), coffee = material(colors.coffee);
    const group = (name: string): Group => { const value = new Group(); value.name = name; this.root.add(value); return value; };
    const piece = (parent: Group, name: string, shape: BufferGeometry, surface: MeshStandardMaterial,
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

    const desk = group('desk'); desk.position.set(...config.desk.position);
    const [dw, dh, dd] = config.desk.size;
    piece(desk, 'desk-top', box, wood, [dw, dh, dd], [0, 0, 0]);
    const legHeight = config.desk.position[1] - dh / 2, lw = config.desk.legWidth;
    for (const x of [-1, 1]) for (const z of [-1, 1]) {
      piece(desk, `desk-leg-${x}-${z}`, box, metal, [lw, legHeight, lw],
        [x * (dw / 2 - 0.13), -dh / 2 - legHeight / 2, z * (dd / 2 - 0.1)]);
    }

    config.monitors.forEach((spec, index) => {
      const monitor = group(`monitor-${index + 1}`); monitor.position.set(...spec.position); monitor.rotation.y = spec.rotationY;
      const [mw, mh, md] = spec.size;
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
    piece(lamp, 'lamp-shade', shade, ceramic, [1, 1, 1], [0, lh - 0.075, 0]);

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
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.root.removeFromParent();
    this.root.clear();
    this.geometries.forEach(value => value.dispose());
    this.materials.forEach(value => value.dispose());
    this.geometries.clear(); this.materials.clear();
  }
}
