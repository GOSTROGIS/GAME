import { canonicalJson, quantize, sha256 } from "./canonical.mjs";

const q3 = (value) => quantize(Number(value), 3);
const finite = (...values) => values.every((value) => Number.isFinite(Number(value)));
const near = (a, b, tolerance = 0.001) => Math.abs(Math.abs(a) - Math.abs(b)) <= tolerance;

function sourcePointToGame(point, state) {
  if (!Array.isArray(point) || point.length < 3 || !finite(point[0], point[1], point[2])) throw new Error("invalid_point");
  if (Math.abs(Number(state.yaw ?? 0)) > 1e-9) throw new Error("nonzero_capture_yaw");
  return [q3(point[0] * state.sx), q3(point[2] * state.sz), q3(point[1] * state.sy)];
}

function sortedBounds(points) {
  if (!points.length) throw new Error("empty_geometry");
  const min = [...points[0]], max = [...points[0]];
  for (const point of points.slice(1)) {
    for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis], point[axis]);
      max[axis] = Math.max(max[axis], point[axis]);
    }
  }
  return { min: min.map(q3), max: max.map(q3) };
}

function materialIntent(value, found = new Set()) {
  if (typeof value === "string" && /^#[0-9a-f]{3,8}$/i.test(value)) found.add(value.toLowerCase());
  else if (Array.isArray(value)) for (const item of value) materialIntent(item, found);
  else if (value && typeof value === "object") for (const item of Object.values(value)) materialIntent(item, found);
  return [...found].sort();
}

function axisScale(state, sourceAxis) {
  return Math.abs(sourceAxis === "x" ? state.sx : sourceAxis === "y" ? state.sy : state.sz);
}

function normalizeSupported(event) {
  const { name, args, state } = event;
  const materials = materialIntent(args);
  if (!finite(state.sx, state.sy, state.sz, state.yaw)) throw new Error("invalid_transform");
  if (Math.abs(state.sx) < 1e-9 || Math.abs(state.sy) < 1e-9 || Math.abs(state.sz) < 1e-9) throw new Error("zero_scale");

  if (name === "box") {
    const [x, y, z, w, d, h] = args;
    if (!finite(x, y, z, w, d, h)) throw new Error("invalid_box");
    const a = sourcePointToGame([x, y, z], state);
    const b = sourcePointToGame([x + w, y + d, z + h], state);
    return { kind: "cuboid", min: a.map((v, i) => Math.min(v, b[i])), max: a.map((v, i) => Math.max(v, b[i])), materialIntent: materials };
  }

  if (["poly", "polyO", "polyRaw", "quad"].includes(name)) {
    const points = args[0];
    if (!Array.isArray(points) || points.length < 3) throw new Error("invalid_polygon");
    const converted = points.map((point) => sourcePointToGame(point, state));
    // Swapping source Y/Z changes handedness. Reverse exactly when the full
    // signed fit/flip transform has a negative determinant so outward-facing
    // authoring normals stay outward in the game Y-up coordinate system.
    const determinant = -Number(state.sx) * Number(state.sy) * Number(state.sz);
    return { kind: "polygon", points: determinant < 0 ? converted.reverse() : converted, materialIntent: materials };
  }

  if (name === "cyl") {
    const [cx, cy, z0, radius, height] = args;
    if (!finite(cx, cy, z0, radius, height) || radius <= 0 || height <= 0) throw new Error("invalid_cylinder");
    if (!near(state.sx, state.sy)) throw new Error("nonuniform_radial_fit");
    return { kind: "cylinder", centerBase: sourcePointToGame([cx, cy, z0], state), axis: [0, Math.sign(state.sz), 0], radius: q3(radius * axisScale(state, "x")), height: q3(height * axisScale(state, "z")), materialIntent: materials };
  }

  if (name === "tube") {
    const [from, to, radius] = args;
    if (!Array.isArray(from) || !Array.isArray(to) || !finite(radius) || radius <= 0) throw new Error("invalid_tube");
    if (!(near(state.sx, state.sy) && near(state.sx, state.sz))) throw new Error("nonuniform_radial_fit");
    return { kind: "tube", from: sourcePointToGame(from, state), to: sourcePointToGame(to, state), radius: q3(radius * axisScale(state, "x")), materialIntent: materials };
  }

  if (["wheel", "wheelD", "diskXZ", "ringXZ"].includes(name)) {
    let cx, cy, cz, radius, width;
    if (name === "wheel" || name === "wheelD") [cx, cy, cz, radius, width = 0.42] = args;
    else [cx, cz, cy, radius, , width = 0.18] = args;
    if (!finite(cx, cy, cz, radius, width) || radius <= 0) throw new Error("invalid_wheel");
    if (!near(state.sx, state.sz)) throw new Error("nonuniform_radial_fit");
    return { kind: name.includes("ring") ? "ring" : "wheel", center: sourcePointToGame([cx, cy, cz], state), axis: [0, 0, Math.sign(state.sy)], radius: q3(radius * axisScale(state, "x")), width: q3(Math.max(0.02, Math.abs(width) * axisScale(state, "y"))), materialIntent: materials };
  }

  if (name === "dome" || name === "mound") {
    const [cx, cy, z0OrRadius, radiusOrHeight, maybeHeight] = args;
    const z0 = name === "dome" ? z0OrRadius : 0;
    const radius = name === "dome" ? radiusOrHeight : z0OrRadius;
    const height = name === "dome" ? maybeHeight : radiusOrHeight;
    if (!finite(cx, cy, z0, radius, height) || radius <= 0 || height <= 0) throw new Error(`invalid_${name}`);
    if (!near(state.sx, state.sy)) throw new Error("nonuniform_radial_fit");
    return { kind: name, centerBase: sourcePointToGame([cx, cy, z0], state), radius: q3(radius * axisScale(state, "x")), height: q3(height * axisScale(state, "z")), materialIntent: materials };
  }

  if (name === "disc" || name === "ring") {
    const [cx, cy, zOrRadius, radiusMaybe] = args;
    const z = name === "disc" ? zOrRadius : 0;
    const radius = name === "disc" ? radiusMaybe : zOrRadius;
    if (!finite(cx, cy, z, radius) || radius <= 0) throw new Error(`invalid_${name}`);
    if (!near(state.sx, state.sy)) throw new Error("nonuniform_radial_fit");
    return { kind: name, center: sourcePointToGame([cx, cy, z], state), axis: [0, Math.sign(state.sz), 0], radius: q3(radius * axisScale(state, "x")), width: q3(Math.max(0.02, radius * 0.08 * axisScale(state, "x"))), materialIntent: materials };
  }

  throw new Error(`unsupported_supported_primitive:${name}`);
}

function geometryPoints(event) {
  if (event.kind === "cuboid") return [event.min, event.max];
  if (event.kind === "polygon") return event.points;
  if (event.kind === "tube") return [event.from, event.to].flatMap((point) => [point.map((v) => v - event.radius), point.map((v) => v + event.radius)]);
  const center = event.centerBase ?? event.center;
  if (event.kind === "cylinder") {
    const top = center.map((v, i) => v + event.axis[i] * event.height);
    return [center.map((v) => v - event.radius), center.map((v) => v + event.radius), top.map((v) => v - event.radius), top.map((v) => v + event.radius)];
  }
  if (event.kind === "dome" || event.kind === "mound") return [center.map((v) => v - event.radius), [center[0] + event.radius, center[1] + event.height, center[2] + event.radius]];
  return [center.map((v) => v - event.radius - (event.width ?? 0)), center.map((v) => v + event.radius + (event.width ?? 0))];
}

export function normalizeCapture(rawCapture, identity) {
  const evidence = [...rawCapture.raw.map((item) => ({ code: item.reason, detail: item }))];
  const events = [];
  for (let index = 0; index < rawCapture.events.length; index += 1) {
    const raw = rawCapture.events[index];
    if (raw.disposition !== "supported") {
      evidence.push({ code: raw.disposition, primitive: raw.name, callIndex: index });
      continue;
    }
    try {
      events.push({ order: events.length, sourcePrimitive: raw.name, ...normalizeSupported(raw) });
    } catch (error) {
      evidence.push({ code: String(error.message || error), primitive: raw.name, callIndex: index });
    }
  }
  const points = events.flatMap(geometryPoints);
  const bounds = points.length ? sortedBounds(points) : null;
  const topology = events.map(({ materialIntent: _materialIntent, order: _order, ...event }) => event);
  const scene = {
    schema: "PrimitiveSceneV1",
    identity,
    units: "metres",
    coordinateSpace: "game_y_up",
    sourceToGameAxes: "(x,y,z)->(x,z,y)",
    quantizationMetres: 0.001,
    view: rawCapture.view,
    events,
    bounds,
    unsupportedOutputEvidence: evidence,
    eventHash: sha256(events),
    topologySignature: sha256(topology)
  };
  scene.deterministicHash = sha256(scene);
  return scene;
}

export function viewInvariantHash(scene) {
  return sha256(scene.events.map(({ materialIntent: _materialIntent, order: _order, ...event }) => event));
}

export const serializeScene = (scene) => canonicalJson(scene, 2);
