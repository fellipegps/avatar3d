import '../src/styles/base.css';
import { SceneController } from '../src/scene/SceneController';
import { CanvasTexture, Mesh, MeshStandardMaterial, SRGBColorSpace } from 'three';
import type { BufferGeometry, Material, Texture } from 'three';
import { demoPanels, PanelTexture } from '../src/scene/PanelTexture';
import { Environment } from '../src/scene/Environment';

if (!import.meta.env.DEV) throw new Error('Esta verificação requer desenvolvimento.');
const fixture = document.querySelector<HTMLElement>('#fixture')!;
const controller = new SceneController(fixture);
const results: { name: string; passed: boolean; details: unknown }[] = [];
const check = (name: string, passed: boolean, details: unknown = null): void => { results.push({ name, passed, details }); };
const frames = async (count: number): Promise<void> => {
  for (let i = 0; i < count; i++) await new Promise<number>(resolve => requestAnimationFrame(resolve));
};
async function run(): Promise<void> {
  let probe: PanelTexture | null = null;
  try {
  await controller.loadCharacter();
  controller.setReducedMotion(true);
  await frames(3);
  const normal = controller.getRenderStats();
  const office = controller.scene.getObjectByName('office')!;
  const shadows = office.getObjectByName('contact-shadows')!;
  shadows.visible = false;
  await frames(2);
  const noContactShadows = controller.getRenderStats();
  shadows.visible = true;
  controller.setQuality('economy');
  await frames(2);
  const economy = controller.getRenderStats();
  controller.setQuality('normal');
  await frames(2);
  const gl = fixture.querySelector('canvas')!.getContext('webgl2')!;
  const debug = gl.getExtension('WEBGL_debug_renderer_info');
  document.querySelector('#metrics')!.textContent = JSON.stringify({ normal, noContactShadows, economy,
    gpu: { version: gl.getParameter(gl.VERSION), renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : 'Indisponível' },
  }, null, 2);
  check('Custo do frame comum dentro da referência de 80 calls, sem shadow map', !!normal && normal.calls <= 80 && normal.triangles > 26000 && !normal.shadowMap, normal);
  check('Contato adiciona cinco desenhos simples e dez triângulos, sem passes de sombras', !!normal && !!noContactShadows
    && normal.calls - noContactShadows.calls === 5 && normal.triangles - noContactShadows.triangles === 10);
  check('Ambiente, rosto, contorno e luminária usam luzes explícitas', ['ambient-light', 'face-light', 'rim-light', 'desk-lamp-light']
    .every(name => !!controller.scene.getObjectByName(name)));

  const screens: Mesh[] = [];
  office.traverse(object => { if (object instanceof Mesh && object.name === 'monitor-screen') screens.push(object); });
  const maps = screens.map(screen => (screen.material as MeshStandardMaterial).map!);
  check('Dois painéis CanvasTexture sRGB nos meshes 3D, com mapa emissivo', screens.length === 2 && maps.every((map, index) =>
    map instanceof CanvasTexture && map.colorSpace === SRGBColorSpace && map.image.width === 768 && map.image.height === 384
    && (screens[index]!.material as MeshStandardMaterial).emissiveMap === map));
  const versions = maps.map(map => map.version);
  let uploads = 0, updates = 0;
  maps.forEach(map => { map.onUpdate = () => { uploads++; }; });
  const unsubscribe = controller.registerUpdater(() => { updates++; });
  await frames(45);
  unsubscribe();
  maps.forEach(map => { map.onUpdate = null; });
  check('45 quadros reais sem invalidar ou reenviar os painéis estáticos', updates >= 45 && uploads === 0
    && maps.every((map, index) => map.version === versions[index]), { updates, uploads, before: versions, after: maps.map(map => map.version) });

  const content = { ...demoPanels[0]!, samples: [...demoPanels[0]!.samples] };
  probe = new PanelTexture(content);
  const initialVersion = probe.texture.version;
  check('Conteúdo idêntico não redesenha nem marca upload', !probe.update({ ...content, samples: [...content.samples] })
    && probe.drawCount === 1 && probe.texture.version === initialVersion);
  content.samples[0] = 0.9;
  check('Mudança no conteúdo redesenha exatamente uma vez', probe.update(content) && probe.drawCount === 2
    && probe.texture.version === initialVersion + 1 && !probe.update(content));
  let probeDisposals = 0;
  probe.texture.addEventListener('dispose', () => { probeDisposals++; });
  probe.dispose(); probe.dispose();
  check('Painel descartado uma vez, sem atualizações tardias e com bitmap liberado', probeDisposals === 1 && !probe.update({ ...content, value: '99' })
    && probe.texture.image.width === 1 && probe.drawCount === 2);

  // Instância separada verifica propriedade/compartilhamento sem desmontar a composição da captura.
  const disposable = new Environment();
  const geometries = new Map<BufferGeometry, number>(), materials = new Map<Material, number>(), textures = new Map<Texture, number>();
  disposable.root.traverse(object => {
    if (!(object instanceof Mesh)) return;
    geometries.set(object.geometry, 0);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.set(material, 0);
      const mapped = material as MeshStandardMaterial;
      for (const texture of [mapped.map, mapped.emissiveMap]) if (texture) textures.set(texture, 0);
    }
  });
  geometries.forEach((_, geometry) => geometry.addEventListener('dispose', () => geometries.set(geometry, geometries.get(geometry)! + 1)));
  materials.forEach((_, material) => material.addEventListener('dispose', () => materials.set(material, materials.get(material)! + 1)));
  textures.forEach((_, texture) => texture.addEventListener('dispose', () => textures.set(texture, textures.get(texture)! + 1)));
  disposable.dispose(); disposable.dispose();
  check('Ambiente libera materiais, geometrias e três texturas compartilhadas uma única vez', textures.size === 3
    && [...geometries.values(), ...materials.values(), ...textures.values()].every(count => count === 1),
    { geometries: geometries.size, materials: materials.size, textures: textures.size, textureDisposals: [...textures.values()] });

  const nativeGetContext = HTMLCanvasElement.prototype.getContext;
  const nativeDispose = CanvasTexture.prototype.dispose;
  let failedTextureDisposals = 0, canvasCount = 0;
  CanvasTexture.prototype.dispose = function () { failedTextureDisposals++; nativeDispose.call(this); };
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: Parameters<typeof nativeGetContext>) {
    // Interromper o segundo painel depois de o primeiro alocar textura/material.
    if (args[0] === '2d' && ++canvasCount === 2) return null;
    return nativeGetContext.apply(this, args);
  } as typeof nativeGetContext;
  try {
    try { new Environment(); check('Falha parcial é propagada', false); }
    catch (error) { check('Falha parcial de canvas 2D libera a textura já criada', failedTextureDisposals === 1 && String(error).includes('painéis locais')); }
  } finally { HTMLCanvasElement.prototype.getContext = nativeGetContext; CanvasTexture.prototype.dispose = nativeDispose; }
  } catch (error) { check('Execução sem exceções inesperadas', false, String(error)); }
  finally { probe?.dispose(); }
  document.querySelector('#results')!.textContent = JSON.stringify(results, null, 2);
  document.querySelector('#summary')!.textContent = `${results.filter(result => result.passed).length}/${results.length} checks passaram`;
}
window.addEventListener('pagehide', () => controller.dispose(), { once: true });
void run();
