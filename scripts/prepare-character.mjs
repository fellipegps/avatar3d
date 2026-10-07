// Offline, deterministic adaptation of the CC0 Vita model. See assets/credits.md.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Euler, Quaternion } from 'three';

const source = readFileSync(new URL('../assets/source/Vita.vrm', import.meta.url));
const sourceHash = createHash('sha256').update(source).digest('hex');
if (sourceHash !== 'f2bf78f28a24e2f75f5ca0b6c3b646654c394e4b03592dfaa0d0633ef0972b4d') {
  throw new Error('Unexpected source. Download the pinned Vita.vrm documented in assets/credits.md.');
}
const jsonLength = source.readUInt32LE(12);
const gltf = JSON.parse(source.toString('utf8', 20, 20 + jsonLength));
const binary = source.subarray(28 + jsonLength);
const originalMeta = gltf.extensions.VRM.meta;
const chunks = [];
let byteLength = 0;
const oldViews = gltf.bufferViews;
gltf.bufferViews = [];
function append(bytes, target) {
  const padded = Buffer.alloc(Math.ceil(bytes.length / 4) * 4);
  bytes.copy(padded);
  const index = gltf.bufferViews.length;
  gltf.bufferViews.push({ buffer: 0, byteOffset: byteLength, byteLength: bytes.length, ...(target ? { target } : {}) });
  chunks.push(padded);
  byteLength += padded.length;
  return index;
}
const views = new Map();
function copyView(index) {
  if (!views.has(index)) {
    const v = oldViews[index];
    const next = append(binary.subarray(v.byteOffset ?? 0, (v.byteOffset ?? 0) + v.byteLength), v.target);
    if (v.byteStride) gltf.bufferViews[next].byteStride = v.byteStride;
    views.set(index, next);
  }
  return views.get(index);
}
const oldAccessors = gltf.accessors;
gltf.accessors = [];
const accessors = new Map();
function copyAccessor(index) {
  if (!accessors.has(index)) {
    const a = structuredClone(oldAccessors[index]);
    if (a.sparse) throw new Error('Unexpected sparse source accessor');
    a.bufferView = copyView(a.bufferView);
    accessors.set(index, gltf.accessors.length);
    gltf.accessors.push(a);
  }
  return accessors.get(index);
}
function addAccessor(values, type, componentType = 5126, target) {
  const sizes = { SCALAR: 1, VEC4: 4 };
  const data = componentType === 5123 ? new Uint16Array(values) : new Float32Array(values);
  const index = gltf.accessors.length;
  gltf.accessors.push({ bufferView: append(Buffer.from(data.buffer), target), componentType,
    count: values.length / sizes[type], type,
    ...(type === 'SCALAR' ? { min: [Math.min(...values)], max: [Math.max(...values)] } : {}) });
  return index;
}
function sourceIndices(index) {
  const a = oldAccessors[index];
  if (![5123, 5125].includes(a.componentType)) throw new Error('Unexpected index type');
  const start = (oldViews[a.bufferView].byteOffset ?? 0) + (a.byteOffset ?? 0);
  return Array.from({ length: a.count }, (_, i) => a.componentType === 5123
    ? binary.readUInt16LE(start + i * 2) : binary.readUInt32LE(start + i * 4));
}

// Merge primitives sharing the same vertex data/material (65 hair draws -> 3).
for (const mesh of gltf.meshes) {
  const groups = new Map();
  const names = mesh.primitives[0].extras?.targetNames;
  if (names) mesh.extras = { targetNames: names };
  for (const primitive of mesh.primitives) {
    const key = JSON.stringify([primitive.material, primitive.attributes, primitive.targets]);
    if (!groups.has(key)) groups.set(key, { ...primitive, indexValues: [] });
    groups.get(key).indexValues.push(...sourceIndices(primitive.indices));
  }
  mesh.primitives = [...groups.values()].map(p => {
    p.indices = addAccessor(p.indexValues, 'SCALAR', 5123, 34963);
    delete p.indexValues;
    delete p.extras;
    p.attributes = Object.fromEntries(Object.entries(p.attributes).map(([k, v]) => [k, copyAccessor(v)]));
    if (p.targets) p.targets = p.targets.map(t => Object.fromEntries(Object.entries(t).map(([k, v]) => [k, copyAccessor(v)])));
    return p;
  });
}
for (const skin of gltf.skins) skin.inverseBindMatrices = copyAccessor(skin.inverseBindMatrices);
gltf.meshes[0].name = 'VitaFace';

// Standard PBR materials react to the shared scene lights. VRM shaders/physics aren't required.
const oldTextures = gltf.textures;
const oldImages = gltf.images;
const textures = new Map();
const images = new Map();
gltf.textures = [];
gltf.images = [];
for (const material of gltf.materials) {
  delete material.extensions;
  delete material.normalTexture;
  delete material.emissiveTexture;
  delete material.emissiveFactor;
  const texture = material.pbrMetallicRoughness.baseColorTexture;
  if (!textures.has(texture.index)) {
    const old = oldTextures[texture.index];
    if (!images.has(old.source)) {
      const img = oldImages[old.source];
      images.set(old.source, gltf.images.length);
      gltf.images.push({ ...img, bufferView: copyView(img.bufferView) });
    }
    textures.set(texture.index, gltf.textures.length);
    gltf.textures.push({ ...old, source: images.get(old.source) });
  }
  texture.index = textures.get(texture.index);
}
delete gltf.extensions;
delete gltf.extensionsUsed;
delete gltf.extensionsRequired;

// Original poses authored directly for the inspected J_Bip skeleton; no retargeting.
const joints = ['J_Bip_L_UpperArm', 'J_Bip_R_UpperArm', 'J_Bip_L_LowerArm',
  'J_Bip_R_LowerArm', 'J_Bip_C_Chest', 'J_Bip_C_Neck', 'J_Bip_C_Head'];
function pose(state, phase) {
  const wave = Math.sin(phase * Math.PI * 2);
  const pulse = (1 - Math.cos(phase * Math.PI * 2)) / 2;
  const rotations = [[0, 0, 1.18], [0, 0, -1.18], [0, -0.10, 0.10],
    [0, 0.10, -0.10], [0.015 * wave, 0, 0], [0, 0, 0], [0, 0.025 * wave, 0]];
  if (state === 'thinking') {
    rotations[5] = [-0.045, 0.10 + 0.035 * wave, 0.055];
    rotations[6] = [-0.04 + 0.015 * wave, 0.08, 0.035];
    rotations[3] = [0, 0.30 + 0.08 * pulse, -0.05];
  }
  if (state === 'responding') {
    rotations[1] = [0, 0.10, -1.05 + 0.06 * pulse];
    rotations[3] = [0, 0.40 + 0.24 * pulse, 0.08];
    rotations[6] = [0.045 * wave, -0.04 + 0.025 * wave, 0];
  }
  return rotations;
}
gltf.animations = [ ['idle', 'Vita_Idle', 4], ['thinking', 'Vita_Thinking', 3.2],
  ['responding', 'Vita_Responding', 2.4] ].map(([state, name, duration]) => {
  const times = Array.from({ length: 33 }, (_, i) => i * duration / 32);
  const input = addAccessor(times, 'SCALAR');
  const samplers = [];
  const channels = joints.map((joint, jointIndex) => {
    const node = gltf.nodes.findIndex(n => n.name === joint);
    if (node < 0) throw new Error(`Missing source joint: ${joint}`);
    const values = times.flatMap((_, i) => new Quaternion().setFromEuler(new Euler(...pose(state, i / 32)[jointIndex])).toArray());
    samplers.push({ input, output: addAccessor(values, 'VEC4'), interpolation: 'LINEAR' });
    return { sampler: jointIndex, target: { node, path: 'rotation' } };
  });
  return { name, samplers, channels };
});
gltf.asset.generator = 'avatar3d scripts/prepare-character.mjs; source UniGLTF-1.24';
gltf.asset.copyright = 'Vita by pixiv Inc. / VRoid Project, CC0 1.0. Adaptation and original clips: avatar3d.';
gltf.asset.extras = { sourceSHA256: sourceHash, sourceTitle: originalMeta.title, license: originalMeta.licenseName };
gltf.buffers = [{ byteLength }];
const json = Buffer.from(JSON.stringify(gltf));
const paddedJSON = Buffer.alloc(Math.ceil(json.length / 4) * 4, 0x20);
json.copy(paddedJSON);
const header = Buffer.alloc(20);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(28 + paddedJSON.length + byteLength, 8);
header.writeUInt32LE(paddedJSON.length, 12);
header.writeUInt32LE(0x4e4f534a, 16);
const binHeader = Buffer.alloc(8);
binHeader.writeUInt32LE(byteLength, 0);
binHeader.writeUInt32LE(0x004e4942, 4);
const output = Buffer.concat([header, paddedJSON, binHeader, ...chunks]);
mkdirSync(new URL('../public/models/', import.meta.url), { recursive: true });
writeFileSync(new URL('../public/models/character.glb', import.meta.url), output);
console.log(JSON.stringify({ sourceHash, outputSHA256: createHash('sha256').update(output).digest('hex'),
  bytes: output.length, triangles: gltf.meshes.reduce((s, m) => s + m.primitives.reduce((s, p) => s + gltf.accessors[p.indices].count / 3, 0), 0),
  primitives: gltf.meshes.map(m => ({ name: m.name, count: m.primitives.length })), clips: gltf.animations.map(a => a.name),
  images: gltf.images.length }, null, 2));
