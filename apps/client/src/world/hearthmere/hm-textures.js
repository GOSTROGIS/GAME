/* Hearthmere procedural textures.
 *
 * The six hm.surface.* rows and six hm.decal.* rows in
 * packages/content/manifests/hearthmere.assets.json declare
 * generatorId "surface.pbr-prototype" / "decal.projected" with
 * lodTriangles [0,0,0] — they are materials, not meshes. This module is
 * those generators: each surface returns { map, roughnessMap } and each
 * decal returns an alpha texture, drawn to a canvas at the row's declared
 * maxTextureDimension.
 *
 * Every baseColor, roughness and opacity below is the manifest's own value.
 * Textures survive the GLB export (glTF embeds them); they do NOT survive
 * OBJ, which carries per-material colour only.
 */
import * as THREE from 'three';

const TAU = Math.PI * 2;

/* Seeded value noise — one lattice, bilinear, summed over octaves. Enough
   for stone mottle and wood grain, and it costs nothing to ship. */
function noiseField(seed, size) {
  let a = seed >>> 0;
  const rand = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const g = new Float32Array(size * size);
  for (let i = 0; i < g.length; i++) g[i] = rand();
  const at = (x, y) => g[(((y % size) + size) % size) * size + (((x % size) + size) % size)];
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a0 = at(xi, yi) + (at(xi + 1, yi) - at(xi, yi)) * sx;
    const a1 = at(xi, yi + 1) + (at(xi + 1, yi + 1) - at(xi, yi + 1)) * sx;
    return a0 + (a1 - a0) * sy;
  };
}
function fbm(seed, octaves = 4) {
  const layers = [];
  for (let o = 0; o < octaves; o++) layers.push(noiseField(seed + o * 7919, 64));
  return (x, y) => {
    let v = 0, amp = 0.5, f = 4;
    for (let o = 0; o < octaves; o++) {
      v += layers[o](x * f, y * f) * amp;
      amp *= 0.5;
      f *= 2.05;
    }
    return v;
  };
}

const canvas = (n) => {
  const c = document.createElement('canvas');
  c.width = c.height = n;
  return c;
};

const tex = (c, repeat = 1) => {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
};

const linear = (c, repeat = 1) => {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 4;
  return t;
};

/* Shade a base hex by a signed amount, staying in gamut. */
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const cl = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    'rgb(' +
    cl(((n >> 16) & 255) * (1 + amt)) + ',' +
    cl(((n >> 8) & 255) * (1 + amt)) + ',' +
    cl((n & 255) * (1 + amt)) + ')'
  );
}

/* ------------------------------------------------------------- surfaces */

/** hm.surface.slate-cobbles-wet — #30393b, roughness .72, wetness .9.
 *  Irregular cobble cells with wet pooling in the joints. */
function slateCobbles(N, base, seed) {
  const c = canvas(N), x = c.getContext('2d');
  const n = fbm(seed);
  x.fillStyle = shade(base, -0.35);
  x.fillRect(0, 0, N, N);
  const cells = 7, s = N / cells;
  for (let gy = 0; gy < cells; gy++) {
    for (let gx = 0; gx < cells; gx++) {
      const off = (gy % 2) * s * 0.5;
      const cx = gx * s + off + (n(gx * 3, gy * 3) - 0.5) * s * 0.25;
      const cy = gy * s + (n(gx * 5, gy * 5) - 0.5) * s * 0.25;
      const w = s * (0.74 + n(gx, gy) * 0.3), h = s * (0.68 + n(gy, gx) * 0.3);
      x.save();
      x.translate(cx + s / 2, cy + s / 2);
      x.rotate((n(gx * 7, gy * 7) - 0.5) * 0.4);
      x.beginPath();
      // Chamfered quad — cobbles are cut, not rounded.
      const k = Math.min(w, h) * 0.22;
      x.moveTo(-w / 2 + k, -h / 2); x.lineTo(w / 2 - k, -h / 2);
      x.lineTo(w / 2, -h / 2 + k); x.lineTo(w / 2, h / 2 - k);
      x.lineTo(w / 2 - k, h / 2); x.lineTo(-w / 2 + k, h / 2);
      x.lineTo(-w / 2, h / 2 - k); x.lineTo(-w / 2, -h / 2 + k);
      x.closePath();
      x.fillStyle = shade(base, -0.1 + n(gx * 11, gy * 11) * 0.34);
      x.fill();
      x.restore();
    }
  }
  // Wet sheen: the region runs at wetness .9, so light sits in the joints.
  for (let i = 0; i < N * 12; i++) {
    const px = Math.random() * N, py = Math.random() * N;
    x.fillStyle = 'rgba(190,205,208,' + (n(px / 9, py / 9) * 0.05) + ')';
    x.fillRect(px, py, 1, 1);
  }
  return c;
}

/** hm.surface.spring-limestone — #68706b, roughness .66, wetness 1.
 *  Mottled, mineral-crusted, banded where the water has run. */
function limestone(N, base, seed) {
  const c = canvas(N), x = c.getContext('2d');
  const n = fbm(seed, 5);
  const img = x.createImageData(N, N);
  const rgb = [
    parseInt(base.slice(1, 3), 16),
    parseInt(base.slice(3, 5), 16),
    parseInt(base.slice(5, 7), 16),
  ];
  for (let py = 0; py < N; py++) {
    for (let px = 0; px < N; px++) {
      const u = px / N, v = py / N;
      const m = n(u, v);
      // Deposition banding: mineral laid down in horizontal runs.
      const band = Math.sin(v * 26 + n(u * 0.7, v * 0.7) * 7) * 0.06;
      const k = 0.72 + m * 0.5 + band;
      const i = (py * N + px) * 4;
      img.data[i] = Math.min(255, rgb[0] * k);
      img.data[i + 1] = Math.min(255, rgb[1] * k);
      img.data[i + 2] = Math.min(255, rgb[2] * k);
      img.data[i + 3] = 255;
    }
  }
  x.putImageData(img, 0, 0);
  return c;
}

/** hm.surface.oak-planks-dark — #302924, roughness .76, wetness .7.
 *  Board seams, grain, and the odd knot. */
function oakPlanks(N, base, seed) {
  const c = canvas(N), x = c.getContext('2d');
  const n = fbm(seed, 4);
  x.fillStyle = shade(base, -0.3);
  x.fillRect(0, 0, N, N);
  const boards = 5, h = N / boards;
  for (let b = 0; b < boards; b++) {
    x.fillStyle = shade(base, -0.06 + n(b * 13, 3) * 0.3);
    x.fillRect(0, b * h + 1.5, N, h - 3);
    // Grain: long strokes following the board, never straight.
    for (let s = 0; s < 46; s++) {
      const y0 = b * h + 3 + Math.random() * (h - 6);
      x.strokeStyle = 'rgba(0,0,0,' + (0.05 + Math.random() * 0.12) + ')';
      x.lineWidth = 0.6 + Math.random();
      x.beginPath();
      x.moveTo(0, y0);
      for (let px = 0; px <= N; px += 16) {
        x.lineTo(px, y0 + Math.sin(px / 30 + s) * 1.6 + (n(px / 40, s) - 0.5) * 2.4);
      }
      x.stroke();
    }
    // One knot per couple of boards.
    if (b % 2 === 0) {
      const kx = N * (0.2 + Math.random() * 0.6), ky = b * h + h / 2;
      for (let r = 7; r > 0; r--) {
        x.strokeStyle = 'rgba(0,0,0,' + 0.09 * r / 7 + ')';
        x.lineWidth = 1.4;
        x.beginPath();
        x.ellipse(kx, ky, r * 1.7, r * 1.05, 0.3, 0, TAU);
        x.stroke();
      }
    }
  }
  return c;
}

/** hm.surface.clay-tablets — #6a4636, roughness .9, wetness .4.
 *  Fired clay: grog speckle, fire-clouding, hairline crazing. */
function firedClay(N, base, seed) {
  const c = canvas(N), x = c.getContext('2d');
  const n = fbm(seed, 4);
  x.fillStyle = base;
  x.fillRect(0, 0, N, N);
  for (let py = 0; py < N; py += 2) {
    for (let px = 0; px < N; px += 2) {
      const m = n(px / N, py / N);
      x.fillStyle = 'rgba(' + (m > 0.55 ? '210,180,150,' : '20,12,8,') + Math.abs(m - 0.5) * 0.3 + ')';
      x.fillRect(px, py, 2, 2);
    }
  }
  // Grog: crushed fired clay mixed back into the body.
  for (let i = 0; i < N * 3; i++) {
    x.fillStyle = 'rgba(' + (Math.random() > 0.5 ? '180,150,120,' : '40,26,18,') + (0.2 + Math.random() * 0.4) + ')';
    x.fillRect(Math.random() * N, Math.random() * N, 1.4, 1.4);
  }
  // Crazing.
  for (let i = 0; i < 22; i++) {
    x.strokeStyle = 'rgba(0,0,0,.16)';
    x.lineWidth = 0.7;
    x.beginPath();
    let px = Math.random() * N, py = Math.random() * N;
    x.moveTo(px, py);
    for (let s = 0; s < 5; s++) {
      px += (Math.random() - 0.5) * 40;
      py += (Math.random() - 0.5) * 40;
      x.lineTo(px, py);
    }
    x.stroke();
  }
  return c;
}

/** Blackpine bark — deep vertical fissure, the species' read up close. */
function pineBark(N, base, seed) {
  const c = canvas(N), x = c.getContext('2d');
  const n = fbm(seed, 4);
  x.fillStyle = shade(base, -0.4);
  x.fillRect(0, 0, N, N);
  for (let i = 0; i < 130; i++) {
    const px = Math.random() * N;
    const w = 4 + Math.random() * 13;
    const y0 = Math.random() * N, len = 30 + Math.random() * 110;
    x.fillStyle = shade(base, 0.05 + n(px / 30, y0 / 30) * 0.55);
    x.beginPath();
    x.moveTo(px, y0);
    for (let s = 0; s <= 6; s++) {
      x.lineTo(px + w * (0.4 + n(px, y0 + s * 9) * 0.6), y0 + (len / 6) * s);
    }
    for (let s = 6; s >= 0; s--) x.lineTo(px, y0 + (len / 6) * s);
    x.closePath();
    x.fill();
  }
  return c;
}

/** Woven canvas — the awning's cloth, at weave scale. */
function canvasWeave(N, base, seed) {
  const c = canvas(N), x = c.getContext('2d');
  const n = fbm(seed, 3);
  x.fillStyle = base;
  x.fillRect(0, 0, N, N);
  const p = 5;
  for (let i = 0; i < N; i += p) {
    x.fillStyle = 'rgba(0,0,0,.09)';
    x.fillRect(i, 0, p * 0.45, N);
    x.fillRect(0, i, N, p * 0.45);
  }
  for (let py = 0; py < N; py += 3) {
    for (let px = 0; px < N; px += 3) {
      x.fillStyle = 'rgba(0,0,0,' + n(px / N, py / N) * 0.16 + ')';
      x.fillRect(px, py, 3, 3);
    }
  }
  return c;
}

/** Pitted iron — hammer scale and rust bloom, no chrome anywhere. */
function pittedIron(N, base, seed) {
  const c = canvas(N), x = c.getContext('2d');
  const n = fbm(seed, 4);
  x.fillStyle = base;
  x.fillRect(0, 0, N, N);
  for (let py = 0; py < N; py += 2) {
    for (let px = 0; px < N; px += 2) {
      const m = n(px / N, py / N);
      if (m > 0.62) {
        x.fillStyle = 'rgba(120,66,38,' + (m - 0.62) * 1.5 + ')'; // rust
      } else {
        x.fillStyle = 'rgba(255,255,255,' + Math.max(0, 0.4 - m) * 0.18 + ')';
      }
      x.fillRect(px, py, 2, 2);
    }
  }
  for (let i = 0; i < N * 2; i++) {
    x.fillStyle = 'rgba(0,0,0,' + (0.1 + Math.random() * 0.3) + ')';
    x.fillRect(Math.random() * N, Math.random() * N, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  return c;
}

/** A roughness map derived from a colour canvas: darker pixels read as
 *  wetter, which is how the region's wetness parameter lands visually. */
function roughFrom(src, lo, hi) {
  const N = src.width;
  const c = canvas(N), x = c.getContext('2d');
  x.drawImage(src, 0, 0);
  const img = x.getImageData(0, 0, N, N);
  for (let i = 0; i < img.data.length; i += 4) {
    const l = (img.data[i] * 0.3 + img.data[i + 1] * 0.59 + img.data[i + 2] * 0.11) / 255;
    const v = (lo + (hi - lo) * l) * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
  }
  x.putImageData(img, 0, 0);
  return c;
}

/* -------------------------------------------------------------- decals
 * Each returns an alpha canvas: white where the decal marks, transparent
 * elsewhere. Opacity values are the manifest's declared numbers.          */

function decalBootMud(N) {
  const c = canvas(N), x = c.getContext('2d');
  const step = (cx, cy, rot) => {
    x.save(); x.translate(cx, cy); x.rotate(rot);
    x.fillStyle = 'rgba(38,30,24,.85)';
    x.beginPath(); x.ellipse(0, 0, N * 0.028, N * 0.062, 0, 0, TAU); x.fill();
    x.beginPath(); x.ellipse(0, N * 0.075, N * 0.022, N * 0.03, 0, 0, TAU); x.fill();
    x.restore();
  };
  for (let i = 0; i < 7; i++) {
    const t = i / 7;
    step(N * (0.18 + t * 0.62) + (i % 2 ? N * 0.05 : 0), N * (0.72 - t * 0.42), -0.5 + t * 0.3);
  }
  return c;
}

function decalSootFan(N) {
  const c = canvas(N), x = c.getContext('2d');
  const g = x.createRadialGradient(N / 2, N, 0, N / 2, N, N * 0.85);
  g.addColorStop(0, 'rgba(8,8,8,.9)');
  g.addColorStop(0.45, 'rgba(14,12,11,.42)');
  g.addColorStop(1, 'rgba(20,18,16,0)');
  x.fillStyle = g;
  x.beginPath();
  x.moveTo(N / 2, N);
  x.lineTo(N * 0.02, N * 0.1);
  x.lineTo(N * 0.98, N * 0.1);
  x.closePath();
  x.fill();
  return c;
}

function decalChalkWard(N) {
  const c = canvas(N), x = c.getContext('2d');
  x.strokeStyle = 'rgba(206,200,186,.8)';
  x.lineWidth = N * 0.018;
  // A ward ring, broken — someone scuffed through it and nobody redrew it.
  x.beginPath(); x.arc(N / 2, N / 2, N * 0.36, 0.5, 4.4); x.stroke();
  x.beginPath(); x.arc(N / 2, N / 2, N * 0.28, 4.9, 5.9); x.stroke();
  x.lineWidth = N * 0.012;
  for (let i = 0; i < 6; i++) {
    const a = 0.7 + i * 0.9;
    x.beginPath();
    x.moveTo(N / 2 + Math.cos(a) * N * 0.2, N / 2 + Math.sin(a) * N * 0.2);
    x.lineTo(N / 2 + Math.cos(a) * N * 0.33, N / 2 + Math.sin(a) * N * 0.33);
    x.stroke();
  }
  // The scuff.
  x.globalCompositeOperation = 'destination-out';
  x.fillStyle = '#000';
  x.beginPath(); x.ellipse(N * 0.66, N * 0.7, N * 0.2, N * 0.11, 0.6, 0, TAU); x.fill();
  return c;
}

function decalRainStreak(N) {
  const c = canvas(N), x = c.getContext('2d');
  for (let i = 0; i < 42; i++) {
    const px = Math.random() * N;
    const g = x.createLinearGradient(px, 0, px, N);
    g.addColorStop(0, 'rgba(12,16,17,0)');
    g.addColorStop(0.3, 'rgba(12,16,17,' + (0.14 + Math.random() * 0.3) + ')');
    g.addColorStop(1, 'rgba(12,16,17,0)');
    x.fillStyle = g;
    x.fillRect(px, 0, 1 + Math.random() * 5, N);
  }
  return c;
}

function decalBloodWash(N) {
  const c = canvas(N), x = c.getContext('2d');
  const n = fbm(0x6e2525, 3);
  // Diluted runoff, not spatter — the rain got to it first.
  for (let i = 0; i < 300; i++) {
    const px = N * (0.2 + Math.random() * 0.6);
    const py = N * Math.random();
    const r = N * (0.02 + n(px / N, py / N) * 0.07);
    x.fillStyle = 'rgba(70,22,22,' + (0.05 + Math.random() * 0.14) + ')';
    x.beginPath();
    x.ellipse(px, py, r, r * (1.4 + Math.random()), 0, 0, TAU);
    x.fill();
  }
  return c;
}

function decalMendedSeam(N) {
  const c = canvas(N), x = c.getContext('2d');
  x.strokeStyle = 'rgba(150,142,124,.75)';
  x.lineWidth = N * 0.03;
  x.beginPath();
  let py = N * 0.5;
  x.moveTo(0, py);
  for (let px = 0; px <= N; px += N / 9) {
    py += (Math.random() - 0.5) * N * 0.11;
    x.lineTo(px, py);
  }
  x.stroke();
  // Fresh mortar squeezed out along the joint.
  x.strokeStyle = 'rgba(178,170,152,.35)';
  x.lineWidth = N * 0.055;
  x.stroke();
  return c;
}

/* ---------------------------------------------------------------- exports */

export const SURFACES = [
  { id: 'hm.surface.slate-cobbles-wet', name: 'Wet slate cobbles', base: '#30393b', roughness: 0.72, wetness: 0.9, dim: 512, draw: slateCobbles, repeat: 2, rough: [0.34, 0.62] },
  { id: 'hm.surface.slate-steps-chipped', name: 'Chipped slate steps', base: '#3a4243', roughness: 0.8, wetness: 0.78, dim: 512, draw: slateCobbles, repeat: 3, rough: [0.42, 0.72] },
  { id: 'hm.surface.spring-limestone', name: 'Spring limestone', base: '#68706b', roughness: 0.66, wetness: 1, dim: 512, draw: limestone, repeat: 2, rough: [0.26, 0.56] },
  { id: 'hm.surface.oak-planks-dark', name: 'Dark oak planks', base: '#302924', roughness: 0.76, wetness: 0.7, dim: 512, draw: oakPlanks, repeat: 2, rough: [0.44, 0.74] },
  { id: 'hm.surface.clay-tablets', name: 'Fired clay tablets', base: '#6a4636', roughness: 0.9, wetness: 0.4, dim: 512, draw: firedClay, repeat: 2, rough: [0.62, 0.9] },
  { id: 'hm.surface.peat-mud-tracks', name: 'Peat mud tracks', base: '#272421', roughness: 0.88, wetness: 0.86, dim: 512, draw: limestone, repeat: 2, rough: [0.4, 0.7] },
];

export const DECALS = [
  { id: 'hm.decal.boot-mud-cluster', name: 'Boot mud cluster', mask: 'boot-pairs', opacity: 0.72, dim: 512, draw: decalBootMud },
  { id: 'hm.decal.brazier-soot-fan', name: 'Brazier soot fan', mask: 'soot-fan', opacity: 0.64, dim: 512, draw: decalSootFan },
  { id: 'hm.decal.chalk-ward-broken', name: 'Broken chalk ward', mask: 'broken-ring', opacity: 0.82, dim: 512, draw: decalChalkWard },
  { id: 'hm.decal.rain-streak-wall', name: 'Wall rain streak', mask: 'vertical-streaks', opacity: 0.55, dim: 512, draw: decalRainStreak },
  { id: 'hm.decal.old-blood-wash', name: 'Old blood wash', mask: 'diluted-runoff', opacity: 0.42, dim: 512, draw: decalBloodWash },
  { id: 'hm.decal.mended-stone-seam', name: 'Mended stone seam', mask: 'repair-seam', opacity: 0.76, dim: 512, draw: decalMendedSeam },
];

/* Built lazily and cached — the viewer draws twelve canvases once. */
const cache = new Map();
function build(key, fn) {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key);
}

/** Maps for the named kit materials. Keys are MAT keys in hm-core.js. */
export function surfaceMaps(key) {
  const S = {
    wetSlate: () => { const c = slateCobbles(512, '#30393b', 0x51a7e0); return { c, repeat: 2, rough: [0.34, 0.62] }; },
    slateDry: () => { const c = slateCobbles(512, '#3a4243', 0x3ea112); return { c, repeat: 3, rough: [0.42, 0.72] }; },
    springStone: () => { const c = limestone(512, '#68706b', 0x68706b); return { c, repeat: 2, rough: [0.26, 0.56] }; },
    darkOak: () => { const c = oakPlanks(512, '#302924', 0x302924); return { c, repeat: 2, rough: [0.44, 0.74] }; },
    weatheredTimber: () => { const c = oakPlanks(512, '#3d3328', 0x3d3328); return { c, repeat: 3, rough: [0.5, 0.84] }; },
    heartwood: () => { const c = oakPlanks(512, '#6f5b40', 0x6f5b40); return { c, repeat: 2, rough: [0.5, 0.8] }; },
    firedClay: () => { const c = firedClay(512, '#6a4636', 0x6a4636); return { c, repeat: 1, rough: [0.62, 0.9] }; },
    clayPale: () => { const c = firedClay(512, '#8a7a68', 0x8a7a68); return { c, repeat: 1, rough: [0.7, 0.94] }; },
    pineBark: () => { const c = pineBark(512, '#2a2521', 0x2a2521); return { c, repeat: 3, rough: [0.7, 0.98] }; },
    canvasBone: () => { const c = canvasWeave(512, '#7b7466', 0x7b7466); return { c, repeat: 4, rough: [0.7, 0.96] }; },
    patchedCloth: () => { const c = canvasWeave(512, '#683f37', 0x683f37); return { c, repeat: 3, rough: [0.7, 0.96] }; },
    pittedIron: () => { const c = pittedIron(512, '#3a4143', 0x3a4143); return { c, repeat: 2, rough: [0.4, 0.72] }; },
    blackIron: () => { const c = pittedIron(512, '#24292b', 0x24292b); return { c, repeat: 2, rough: [0.44, 0.76] }; },
    bellBronze: () => { const c = pittedIron(512, '#9d7c43', 0x9d7c43); return { c, repeat: 2, rough: [0.24, 0.5] }; },
    warmBrass: () => { const c = pittedIron(512, '#c18b46', 0xc18b46); return { c, repeat: 2, rough: [0.22, 0.46] }; },
  };
  if (!S[key]) return null;
  return build('m:' + key, () => {
    const { c, repeat, rough } = S[key]();
    return { map: tex(c, repeat), roughnessMap: linear(roughFrom(c, rough[0], rough[1]), repeat) };
  });
}

export function surfaceTexture(row) {
  return build('s:' + row.id, () => {
    const c = row.draw(row.dim, row.base, row.id.length * 7919);
    return { map: tex(c, row.repeat), roughnessMap: linear(roughFrom(c, row.rough[0], row.rough[1]), row.repeat) };
  });
}

export function decalTexture(row) {
  return build('d:' + row.id, () => {
    const t = new THREE.CanvasTexture(row.draw(row.dim));
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  });
}
