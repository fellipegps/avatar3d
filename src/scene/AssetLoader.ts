import { Box3, BufferGeometry, Material, Mesh, SkinnedMesh, Skeleton, Texture, Vector3 } from 'three';
import type { Object3D } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import type { CharacterManifest } from './character.manifest';
import { resolveFaceBindings } from './FaceController';

export interface AssetReport {
  name: string;
  bytes: number;
  triangles: number;
  bones: string[];
  meshes: { name: string; skinned: boolean; morphTargets: string[] }[];
  materials: string[];
  textures: { width: number; height: number }[];
  clips: { name: string; duration: number; tracks: string[] }[];
  bounds: { min: number[]; max: number[]; size: number[] };
}

export interface LoadedCharacter {
  gltf: GLTF;
  report: AssetReport;
  dispose(): void;
}

/** Each resource is owned by one loaded GLB, even if several primitives share it. */
export function disposeObject(root: Object3D): void {
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  const textures = new Set<Texture>();
  const skeletons = new Set<Skeleton>();
  const images = new Set<ImageBitmap>();
  root.traverse(object => {
    if (object instanceof Mesh) {
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
    }
    if (object instanceof SkinnedMesh) skeletons.add(object.skeleton);
  });
  for (const material of materials) {
    for (const value of Object.values(material)) if (value instanceof Texture) textures.add(value);
  }
  for (const texture of textures) {
    if (typeof ImageBitmap !== 'undefined' && texture.source.data instanceof ImageBitmap) images.add(texture.source.data);
    texture.dispose();
  }
  for (const image of images) image.close();
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  for (const skeleton of skeletons) skeleton.dispose();
  root.removeFromParent();
  root.clear();
}

export function inspectCharacter(gltf: GLTF, manifest: CharacterManifest, bytes: number): AssetReport {
  const meshes: AssetReport['meshes'] = [];
  const bones = new Set<string>();
  const materials = new Set<string>();
  const textures = new Set<Texture>();
  let triangles = 0;
  gltf.scene.traverse(object => {
    if (!(object instanceof Mesh)) return;
    triangles += (object.geometry.index?.count ?? object.geometry.getAttribute('position').count) / 3;
    meshes.push({ name: object.name, skinned: object instanceof SkinnedMesh, morphTargets: Object.keys(object.morphTargetDictionary ?? {}) });
    if (object instanceof SkinnedMesh) for (const bone of object.skeleton.bones) bones.add(bone.name);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material.name);
      for (const value of Object.values(material)) if (value instanceof Texture) textures.add(value);
    }
  });
  if (!meshes.length || !bones.size) throw new Error('O modelo não contém meshes com rig.');
  for (const bone of manifest.requiredBones) {
    if (!bones.has(bone)) throw new Error(`Osso obrigatório ausente: ${bone}`);
  }
  for (const name of Object.values(manifest.clips)) {
    const clip = gltf.animations.find(clip => clip.name === name);
    if (!clip || clip.duration <= 0 || !clip.tracks.length) throw new Error(`Clipe obrigatório ausente ou vazio: ${name}`);
    if (clip.tracks.some(track => track.name.includes('morphTargetInfluences'))) {
      throw new Error(`O clipe corporal ${name} sobrescreve controles faciais.`);
    }
  }
  resolveFaceBindings(gltf.scene, manifest.face);
  gltf.scene.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(gltf.scene, true);
  const size = bounds.getSize(new Vector3());
  if (bounds.isEmpty() || ![...bounds.min, ...bounds.max].every(Number.isFinite)) throw new Error('Limites inválidos no modelo.');
  return { name: manifest.name, bytes, triangles, bones: [...bones], meshes, materials: [...materials],
    textures: [...textures].map(t => {
      const image = t.image as { width: number; height: number };
      return { width: image.width, height: image.height };
    }),
    clips: gltf.animations.map(clip => ({ name: clip.name, duration: clip.duration, tracks: clip.tracks.map(t => t.name) })),
    bounds: { min: bounds.min.toArray(), max: bounds.max.toArray(), size: size.toArray() } };
}

export async function loadCharacter(manifest: CharacterManifest, signal: AbortSignal): Promise<LoadedCharacter> {
  signal.throwIfAborted();
  const url = new URL(`${import.meta.env.BASE_URL}${manifest.path}`, window.location.href);
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Não foi possível carregar o modelo (HTTP ${response.status}).`);
  const data = await response.arrayBuffer();
  signal.throwIfAborted();
  // The selected GLB is self-contained. Parse may finish after abort; release its resources in that case.
  if (data.byteLength < 20 || new DataView(data).getUint32(0, true) !== 0x46546c67) throw new Error('O arquivo recebido não é um GLB válido.');
  const gltf = await new GLTFLoader().parseAsync(data, new URL('.', url).href);
  let disposed = false;
  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    disposeObject(gltf.scene);
  };
  try {
    signal.throwIfAborted();
    gltf.scene.scale.setScalar(manifest.transform.scale);
    gltf.scene.position.fromArray(manifest.transform.position);
    gltf.scene.rotation.y = manifest.transform.rotationY;
    const report = inspectCharacter(gltf, manifest, data.byteLength);
    return { gltf, report, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}
