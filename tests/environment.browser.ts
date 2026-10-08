import '../src/styles/base.css';
import { Box3, Mesh, Raycaster, Vector3 } from 'three';
import type { BufferGeometry, Material } from 'three';
import { Environment } from '../src/scene/Environment';
import { SceneController } from '../src/scene/SceneController';
import { environmentConfig } from '../src/scene/scene.config';

if (!import.meta.env.DEV) throw new Error('Esta verificação requer desenvolvimento.');
const fixture = document.querySelector<HTMLElement>('#fixture');
const summary = document.querySelector<HTMLElement>('#summary');
const output = document.querySelector<HTMLElement>('#results');
if (!fixture || !summary || !output) throw new Error('Página de teste incompleta.');
const results: { name: string; passed: boolean; details: unknown }[] = [];
function check(name: string, passed: boolean, details: unknown = null): void { results.push({ name, passed, details }); }

async function run(): Promise<void> {
  const controller = new SceneController(fixture!);
  try {
    await controller.loadCharacter();
    controller.setReducedMotion(true);
    // ResizeObserver e GPU reais; permitir que o primeiro quadro seja desenhado.
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    controller.scene.updateMatrixWorld(true);
    const office = controller.scene.getObjectByName('office');
    if (!office) throw new Error('Ambiente ausente.');
    check('Um canvas: personagem e ambiente pertencem à mesma cena', fixture!.querySelectorAll('canvas').length === 1
      && !!controller.scene.getObjectByName('J_Bip_C_Head') && office.parent === controller.scene);
    check('Sala e todos os objetos essenciais são meshes 3D', ['floor', 'back-wall', 'left-wall', 'desk-top',
      'monitor-screen', 'lamp-shade', 'plant-pot', 'mug-body'].every(name => office.getObjectByName(name) instanceof Mesh)
      && !!office.getObjectByName('monitor-2'));
    check('Nenhuma geometria de teste permanece na raiz da cena', !controller.scene.children.some(child => child instanceof Mesh));
    const desk = office.getObjectByName('desk-top');
    if (!desk) throw new Error('Mesa ausente.');
    const bounds = new Box3().setFromObject(desk);
    check('Mesa à frente do corpo e tampo na altura configurada', bounds.min.z > 0.15 && Math.abs(bounds.max.y - 0.82) < 1e-8, {
      min: bounds.min.toArray(), max: bounds.max.toArray() });
    const ray = new Raycaster();
    const firstObstruction = (point: Vector3) => {
      const direction = point.clone().sub(controller.camera.position);
      ray.set(controller.camera.position, direction.clone().normalize());
      ray.far = direction.length();
      return ray.intersectObject(office, true)[0]?.object.name ?? null;
    };
    const bodyObstruction = firstObstruction(new Vector3(0, 0.65, 0));
    check('Profundidade: tampo intercepta a linha de visão para o corpo atrás da mesa',
      bodyObstruction === 'desk-top', { bodyPoint: [0, 0.65, 0], firstSurface: bodyObstruction });
    const facePoints: Vector3[] = [];
    for (const x of [-0.13, 0, 0.13]) for (const y of [1.43, 1.57, 1.72]) facePoints.push(new Vector3(x, y, 0.10));
    for (const state of ['idle', 'thinking', 'responding'] as const) {
      controller.setCharacterState(state);
      check(`Frontal ${state}: região do rosto dentro da câmera e sem objetos à frente`, facePoints.every(point => {
        const projected = point.clone().project(controller.camera);
        return Math.abs(projected.x) < 0.95 && Math.abs(projected.y) < 0.95 && projected.z > -1 && projected.z < 1
          && firstObstruction(point) === null;
      }));
    }
    controller.setCharacterView('side');
    check('Vista lateral temporária usa a mesma câmera e mantém rosto livre', office.visible
      && controller.camera.position.x > 2 && firstObstruction(new Vector3(0, 1.57, 0.10)) === null,
      { position: controller.camera.position.toArray() });
    controller.setCharacterView('face');
    check('Inspeção isolada oculta ambiente e retorno restaura composição', !office.visible);
    controller.setCharacterView('room');
    check('Retorno à sala restaura geometria e câmera frontal', office.visible && controller.camera.position.x === 0);

    const alternate = new Environment({ ...environmentConfig,
      desk: { ...environmentConfig.desk, size: [3, 0.1, 1.1], position: [0.2, 0.85, 0.8] } });
    const alternateDesk = alternate.root.getObjectByName('desk-top');
    alternate.root.updateMatrixWorld(true);
    const alternateBounds = new Box3().setFromObject(alternateDesk!);
    check('Configuração altera medidas e posição sem editar a geometria', Math.abs(alternateBounds.getSize(new Vector3()).x - 3) < 1e-8
      && Math.abs(alternateBounds.getCenter(new Vector3()).y - 0.85) < 1e-8);
    alternate.dispose(); alternate.dispose();

    const geometries = new Map<BufferGeometry, number>(), materials = new Map<Material, number>();
    let meshes = 0, triangles = 0;
    office.traverse(object => {
      if (!(object instanceof Mesh)) return;
      meshes++;
      triangles += (object.geometry.index?.count ?? object.geometry.attributes.position?.count ?? 0) / 3;
      geometries.set(object.geometry, 0);
      for (const surface of Array.isArray(object.material) ? object.material : [object.material]) materials.set(surface, 0);
    });
    geometries.forEach((_, value) => value.addEventListener('dispose', () => geometries.set(value, (geometries.get(value) ?? 0) + 1)));
    materials.forEach((_, value) => value.addEventListener('dispose', () => materials.set(value, (materials.get(value) ?? 0) + 1)));
    check('Peças compartilham materiais e geometrias', geometries.size < meshes && materials.size < meshes,
      { meshes, triangles, geometries: geometries.size, materials: materials.size });
    controller.dispose(); controller.dispose();
    check('Descarte duplo libera cada recurso compartilhado exatamente uma vez', [...geometries.values(), ...materials.values()].every(n => n === 1)
      && office.parent === null && office.children.length === 0 && fixture!.querySelectorAll('canvas').length === 0,
      { geometries: [...geometries.values()], materials: [...materials.values()] });
  } catch (error) { check('Execução sem exceções', false, String(error)); }
  finally { controller.dispose(); }
  output!.textContent = JSON.stringify(results, null, 2);
  summary!.textContent = `${results.filter(result => result.passed).length}/${results.length} checks passaram`;
}
void run();
