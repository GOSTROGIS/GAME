import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SEGMENTS = 16;
const add3 = (a, b) => a.map((v, i) => v + b[i]);
const sub3 = (a, b) => a.map((v, i) => v - b[i]);
const mul3 = (a, s) => a.map((v) => v * s);
const dot3 = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm3 = (a) => {
  const length = Math.hypot(...a);
  if (length < 1e-9) throw new Error("degenerate axis");
  return mul3(a, 1 / length);
};

function basis(axis) {
  const n = norm3(axis);
  const reference = Math.abs(dot3(n, [0, 1, 0])) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u = norm3(cross3(n, reference));
  return { n, u, v: cross3(n, u) };
}

function pushVertex(positions, point) {
  positions.push(point[0], point[1], point[2]);
  return positions.length / 3 - 1;
}

function cylinder(positions, indices, start, end, radius, segments = SEGMENTS) {
  const { n, u, v } = basis(sub3(end, start));
  const bottom = [], top = [];
  for (let i = 0; i < segments; i += 1) {
    const angle = i / segments * Math.PI * 2;
    const radial = add3(mul3(u, Math.cos(angle) * radius), mul3(v, Math.sin(angle) * radius));
    bottom.push(pushVertex(positions, add3(start, radial)));
    top.push(pushVertex(positions, add3(end, radial)));
  }
  const bc = pushVertex(positions, start), tc = pushVertex(positions, end);
  for (let i = 0; i < segments; i += 1) {
    const j = (i + 1) % segments;
    indices.push(bottom[i], bottom[j], top[j], bottom[i], top[j], top[i]);
    indices.push(bc, bottom[j], bottom[i], tc, top[i], top[j]);
  }
  return n;
}

function cuboid(positions, indices, min, max) {
  const base = positions.length / 3;
  for (const point of [[min[0], min[1], min[2]], [max[0], min[1], min[2]], [max[0], max[1], min[2]], [min[0], max[1], min[2]], [min[0], min[1], max[2]], [max[0], min[1], max[2]], [max[0], max[1], max[2]], [min[0], max[1], max[2]]]) pushVertex(positions, point);
  for (const index of [0,2,1,0,3,2,4,5,6,4,6,7,0,1,5,0,5,4,1,2,6,1,6,5,2,3,7,2,7,6,3,0,4,3,4,7]) indices.push(base + index);
}

function polygon(positions, indices, points) {
  const base = positions.length / 3;
  for (const point of points) pushVertex(positions, point);
  for (let index = 1; index < points.length - 1; index += 1) indices.push(base, base + index, base + index + 1);
}

function dome(positions, indices, center, radius, height) {
  const rings = 5, segments = SEGMENTS, rows = [];
  for (let ring = 0; ring <= rings; ring += 1) {
    const t = ring / rings * Math.PI / 2;
    const row = [];
    for (let i = 0; i < segments; i += 1) {
      const angle = i / segments * Math.PI * 2;
      row.push(pushVertex(positions, [center[0] + Math.cos(angle) * radius * Math.cos(t), center[1] + height * Math.sin(t), center[2] + Math.sin(angle) * radius * Math.cos(t)]));
    }
    rows.push(row);
  }
  for (let r = 0; r < rings; r += 1) for (let i = 0; i < segments; i += 1) {
    const j = (i + 1) % segments;
    indices.push(rows[r][i], rows[r][j], rows[r + 1][j], rows[r][i], rows[r + 1][j], rows[r + 1][i]);
  }
}

function torus(positions, indices, center, axis, radius, width) {
  const { u, v } = basis(axis), tubeSegments = 6, rows = [];
  for (let i = 0; i < SEGMENTS; i += 1) {
    const a = i / SEGMENTS * Math.PI * 2;
    const radial = add3(mul3(u, Math.cos(a)), mul3(v, Math.sin(a)));
    const ringCenter = add3(center, mul3(radial, radius));
    const row = [];
    for (let j = 0; j < tubeSegments; j += 1) {
      const b = j / tubeSegments * Math.PI * 2;
      row.push(pushVertex(positions, add3(ringCenter, add3(mul3(radial, Math.cos(b) * width / 2), mul3(norm3(axis), Math.sin(b) * width / 2)))));
    }
    rows.push(row);
  }
  for (let i = 0; i < SEGMENTS; i += 1) for (let j = 0; j < tubeSegments; j += 1) {
    const ni = (i + 1) % SEGMENTS, nj = (j + 1) % tubeSegments;
    indices.push(rows[i][j], rows[ni][j], rows[ni][nj], rows[i][j], rows[ni][nj], rows[i][nj]);
  }
}

function eventGeometry(events) {
  const positions = [], indices = [];
  for (const event of events) {
    if (event.kind === "cuboid") cuboid(positions, indices, event.min, event.max);
    else if (event.kind === "polygon") polygon(positions, indices, event.points);
    else if (event.kind === "tube") cylinder(positions, indices, event.from, event.to, event.radius);
    else if (event.kind === "cylinder") cylinder(positions, indices, event.centerBase, add3(event.centerBase, mul3(event.axis, event.height)), event.radius);
    else if (event.kind === "wheel") cylinder(positions, indices, add3(event.center, mul3(event.axis, -event.width / 2)), add3(event.center, mul3(event.axis, event.width / 2)), event.radius);
    else if (event.kind === "disc") cylinder(positions, indices, event.center, add3(event.center, mul3(event.axis, 0.02)), event.radius);
    else if (event.kind === "ring") torus(positions, indices, event.center, event.axis, event.radius, event.width);
    else if (event.kind === "dome") dome(positions, indices, event.centerBase, event.radius, event.height);
    else if (event.kind === "mound") {
      const tip = [event.centerBase[0], event.centerBase[1] + event.height, event.centerBase[2]];
      const base = positions.length / 3;
      for (let i = 0; i < SEGMENTS; i += 1) pushVertex(positions, [event.centerBase[0] + Math.cos(i / SEGMENTS * Math.PI * 2) * event.radius, event.centerBase[1], event.centerBase[2] + Math.sin(i / SEGMENTS * Math.PI * 2) * event.radius]);
      const top = pushVertex(positions, tip);
      for (let i = 0; i < SEGMENTS; i += 1) indices.push(base + i, base + (i + 1) % SEGMENTS, top);
    } else throw new Error(`GLB writer does not support ${event.kind}`);
  }
  if (!positions.length || !indices.length) throw new Error("scene has no convertible geometry");

  const normals = new Array(positions.length).fill(0);
  for (let offset = 0; offset < indices.length; offset += 3) {
    const ia = indices[offset] * 3, ib = indices[offset + 1] * 3, ic = indices[offset + 2] * 3;
    const a = positions.slice(ia, ia + 3), b = positions.slice(ib, ib + 3), c = positions.slice(ic, ic + 3);
    const normal = cross3(sub3(b, a), sub3(c, a));
    for (const index of [ia, ib, ic]) for (let axis = 0; axis < 3; axis += 1) normals[index + axis] += normal[axis];
  }
  for (let offset = 0; offset < normals.length; offset += 3) {
    const normal = normals.slice(offset, offset + 3);
    const length = Math.hypot(...normal);
    if (length > 1e-9) for (let axis = 0; axis < 3; axis += 1) normals[offset + axis] /= length;
    else normals[offset + 1] = 1;
  }
  return { positions, normals, indices };
}

function groundCenter(materialGeometries) {
  const all = materialGeometries.flatMap(({ positions }) => positions.reduce((points, value, index) => {
    if (index % 3 === 0) points.push([value, positions[index + 1], positions[index + 2]]);
    return points;
  }, []));
  if (!all.length) throw new Error("LOD has no geometry to ground-center");
  const min = [0, 1, 2].map((axis) => Math.min(...all.map((point) => point[axis])));
  const max = [0, 1, 2].map((axis) => Math.max(...all.map((point) => point[axis])));
  const offset = [(min[0] + max[0]) / 2, min[1], (min[2] + max[2]) / 2];
  return materialGeometries.map((geometry) => ({
    ...geometry,
    positions: geometry.positions.map((value, index) => value - offset[index % 3]),
  }));
}

function encodeGlb(meshes, materialInput = {}) {
  const binaryParts = [], bufferViews = [], accessors = [], gltfMeshes = [], nodes = [];
  let byteOffset = 0;
  const append = (buffer, target) => {
    const padding = Buffer.alloc((4 - buffer.length % 4) % 4);
    const index = bufferViews.length;
    bufferViews.push({ buffer: 0, byteOffset, byteLength: buffer.length, target });
    binaryParts.push(buffer, padding);
    byteOffset += buffer.length + padding.length;
    return index;
  };
  for (const [meshIndex, mesh] of meshes.entries()) {
    const primitives = [];
    const materialGeometries = mesh.materialGeometries ?? [{ materialIndex: 0, positions: mesh.positions, normals: mesh.normals, indices: mesh.indices }];
    for (const geometry of materialGeometries) {
      const positions = Buffer.from(new Float32Array(geometry.positions).buffer);
      const normals = Buffer.from(new Float32Array(geometry.normals).buffer);
      const indices = Buffer.from(new Uint32Array(geometry.indices).buffer);
      const positionView = append(positions, 34962), normalView = append(normals, 34962), indexView = append(indices, 34963);
      const xs = geometry.positions.filter((_, index) => index % 3 === 0), ys = geometry.positions.filter((_, index) => index % 3 === 1), zs = geometry.positions.filter((_, index) => index % 3 === 2);
      const positionAccessor = accessors.length;
      accessors.push({ bufferView: positionView, componentType: 5126, count: geometry.positions.length / 3, type: "VEC3", min: [Math.min(...xs), Math.min(...ys), Math.min(...zs)], max: [Math.max(...xs), Math.max(...ys), Math.max(...zs)] });
      const normalAccessor = accessors.length;
      accessors.push({ bufferView: normalView, componentType: 5126, count: geometry.normals.length / 3, type: "VEC3" });
      const indexAccessor = accessors.length;
      accessors.push({ bufferView: indexView, componentType: 5125, count: geometry.indices.length, type: "SCALAR", min: [Math.min(...geometry.indices)], max: [Math.max(...geometry.indices)] });
      primitives.push({ attributes: { POSITION: positionAccessor, NORMAL: normalAccessor }, indices: indexAccessor, material: geometry.materialIndex });
    }
    gltfMeshes.push({ name: mesh.name, primitives });
    nodes.push({ name: mesh.name, mesh: meshIndex });
  }

  const bin = Buffer.concat(binaryParts);
  const materialDefinitions = Array.isArray(materialInput) ? materialInput : [materialInput];
  const materials = materialDefinitions.map((material, index) => ({
    name: material.name ?? `prototype-semantic-${index}`,
    pbrMetallicRoughness: {
      baseColorFactor: material.baseColorFactor ?? [0.19, 0.17, 0.16, 1],
      metallicFactor: material.metallicFactor ?? 0.05,
      roughnessFactor: material.roughnessFactor ?? 0.92,
    },
  }));
  const json = {
    asset: { version: "2.0", generator: "sable-reach-slipcurve-bridge-v1" },
    scene: 0,
    scenes: [{ nodes: nodes.map((_, index) => index) }],
    nodes,
    meshes: gltfMeshes,
    materials,
    accessors,
    bufferViews,
    buffers: [{ byteLength: bin.length }]
  };
  let jsonBuffer = Buffer.from(JSON.stringify(json));
  jsonBuffer = Buffer.concat([jsonBuffer, Buffer.alloc((4 - jsonBuffer.length % 4) % 4, 0x20)]);
  const binPadded = Buffer.concat([bin, Buffer.alloc((4 - bin.length % 4) % 4)]);
  const header = Buffer.alloc(12), jsonHeader = Buffer.alloc(8), binHeader = Buffer.alloc(8);
  header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + jsonBuffer.length + 8 + binPadded.length, 8);
  jsonHeader.writeUInt32LE(jsonBuffer.length, 0); jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  binHeader.writeUInt32LE(binPadded.length, 0); binHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, jsonBuffer, binHeader, binPadded]);
}

export function primitiveSceneToGlb(scene) {
  const { positions, indices } = eventGeometry(scene.events);
  const pos = Buffer.from(new Float32Array(positions).buffer);
  const idx = Buffer.from(new Uint32Array(indices).buffer);
  const bin = Buffer.concat([pos, idx]);
  const xs = positions.filter((_, i) => i % 3 === 0), ys = positions.filter((_, i) => i % 3 === 1), zs = positions.filter((_, i) => i % 3 === 2);
  const json = {
    asset: { version: "2.0", generator: "sable-reach-slipcurve-bridge-v1" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1, material: 0 }] }],
    materials: [{ name: "prototype-neutral", pbrMetallicRoughness: { baseColorFactor: [0.19, 0.17, 0.16, 1], metallicFactor: 0.05, roughnessFactor: 0.92 } }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: positions.length / 3, type: "VEC3", min: [Math.min(...xs), Math.min(...ys), Math.min(...zs)], max: [Math.max(...xs), Math.max(...ys), Math.max(...zs)] },
      { bufferView: 1, componentType: 5125, count: indices.length, type: "SCALAR" },
    ],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: pos.length, target: 34962 }, { buffer: 0, byteOffset: pos.length, byteLength: idx.length, target: 34963 }],
    buffers: [{ byteLength: bin.length }],
  };
  let jsonBuffer = Buffer.from(JSON.stringify(json));
  jsonBuffer = Buffer.concat([jsonBuffer, Buffer.alloc((4 - jsonBuffer.length % 4) % 4, 0x20)]);
  const binPadded = Buffer.concat([bin, Buffer.alloc((4 - bin.length % 4) % 4)]);
  const header = Buffer.alloc(12), jsonHeader = Buffer.alloc(8), binHeader = Buffer.alloc(8);
  header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + jsonBuffer.length + 8 + binPadded.length, 8);
  jsonHeader.writeUInt32LE(jsonBuffer.length, 0); jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  binHeader.writeUInt32LE(binPadded.length, 0); binHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, jsonBuffer, binHeader, binPadded]);
}

/** Encodes three independently authored prototype LODs in one deterministic GLB. */
export function primitiveLodSceneToGlb(scene) {
  if (!Array.isArray(scene.lods) || scene.lods.length !== 3) throw new Error("LOD scene must contain exactly three levels");
  const materials = scene.materials ?? [scene.material ?? {}];
  const meshes = scene.lods.map((lod, index) => {
    const grouped = new Map();
    for (const event of lod.events) {
      const materialIndex = event.materialSlot ?? 0;
      if (!Number.isInteger(materialIndex) || materialIndex < 0 || materialIndex >= materials.length) throw new Error(`LOD${index} event has invalid material slot ${materialIndex}`);
      const events = grouped.get(materialIndex) ?? [];
      events.push(event);
      grouped.set(materialIndex, events);
    }
    const materialGeometries = [...grouped.entries()].sort(([left], [right]) => left - right).map(([materialIndex, events]) => ({ materialIndex, ...eventGeometry(events) }));
    return {
      name: `LOD${index}`,
      materialGeometries: groundCenter(materialGeometries),
    };
  });
  return encodeGlb(meshes, materials);
}

export async function writePrimitiveSceneGlb(scene, outputPath) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  const buffer = primitiveSceneToGlb(scene);
  await writeFile(outputPath, buffer);
  return buffer;
}
