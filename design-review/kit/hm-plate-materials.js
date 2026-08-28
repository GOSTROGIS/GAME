/* =========================================================================
   hm-plate-materials.js — plate-sampled PBR materials, for any subject
   -------------------------------------------------------------------------
   Generalised out of ash-husk-model.js's material pipeline so a second
   sculpted subject does not have to re-derive it. The technique is unchanged
   from the model it was lifted out of:

   - a crop of the plate is tiled into a seamless swatch,
   - HIGH-PASSED against its own wrapped blur, so the plate's own fold
     shading (which would read as corduroy once tiled) is discarded and only
     the crack/weave detail survives,
   - re-seated on the crop's MEASURED mean luminance times one stated LIFT
     constant — so the ratio between a subject's garments survives (the
     plate's cloth can span better than 8:1) and only the render's dimmer key
     is compensated,
   - and turned into a matching roughness map and a Sobel normal map, so the
     crack network reads under a raking key instead of living in albedo alone.

   ash-husk-model.js is left exactly as it is — this module does not replace
   it, it is what a NEW subject should call instead of re-writing the same
   canvas code. Any subject's CROPS table stays local to that subject's own
   file: only the machinery lives here.
   ========================================================================= */
import * as THREE from 'three';

export function loadPlate(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);      // a missing plate must not kill the build
    img.src = url;
  });
}

function tileCanvas(img, c) {
  const s = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s * 2;
  const g = cv.getContext('2d');
  if (c.single) {                        // one crop used directly, not tiled
    g.drawImage(img, c.x, c.y, c.w, c.h, 0, 0, cv.width, cv.height);
    return cv;
  }
  const draw = (fx, fy, dx, dy) => {
    g.save();
    g.translate(dx + (fx ? s : 0), dy + (fy ? s : 0));
    g.scale(fx ? -1 : 1, fy ? -1 : 1);
    g.drawImage(img, c.x, c.y, c.w, c.h, 0, 0, s, s);
    g.restore();
  };
  draw(0, 0, 0, 0); draw(1, 0, s, 0); draw(0, 1, 0, s); draw(1, 1, s, s);
  return cv;
}

function normaliseExposure(src, target, flatten = 0.78) {
  const cv = document.createElement('canvas');
  cv.width = src.width; cv.height = src.height;
  const g = cv.getContext('2d');
  g.drawImage(src, 0, 0);
  const d = g.getImageData(0, 0, cv.width, cv.height);
  const p = d.data;
  let sum = 0;
  for (let i = 0; i < p.length; i += 4) sum += (p[i] * 0.299 + p[i + 1] * 0.587 + p[i + 2] * 0.114) / 255;
  const mean = Math.max(0.02, sum / (p.length / 4));
  for (let i = 0; i < p.length; i += 4) {
    for (let k = 0; k < 3; k++) {
      const v = p[i + k] / 255;
      p[i + k] = Math.max(0, Math.min(255, Math.pow(v / mean, flatten) * target * 255));
    }
  }
  g.putImageData(d, 0, 0);
  return cv;
}

function wrapBlur(src, px) {
  const w = src.width, h = src.height;
  const big = document.createElement('canvas');
  big.width = w * 3; big.height = h * 3;
  const bg = big.getContext('2d');
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) bg.drawImage(src, (i + 1) * w, (j + 1) * h);
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  const og = out.getContext('2d');
  og.filter = `blur(${px}px)`;
  og.drawImage(big, -w, -h);
  og.filter = 'none';
  return out;
}

function plateDetail(tile, c, lift) {
  const target = c.mean * lift;
  if (c.single) return normaliseExposure(tile, target);
  const w = tile.width, h = tile.height;
  const blur = wrapBlur(tile, Math.max(3, Math.round(w * 0.008)));
  const a = tile.getContext('2d').getImageData(0, 0, w, h);
  const b = blur.getContext('2d').getImageData(0, 0, w, h).data;
  const p = a.data;
  const lum = (d, i) => (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
  let mr = 0, mg = 0, mb = 0;
  for (let i = 0; i < p.length; i += 4) { mr += p[i]; mg += p[i + 1]; mb += p[i + 2]; }
  const n = p.length / 4;
  mr /= n * 255; mg /= n * 255; mb /= n * 255;
  const meanL = Math.max(0.02, mr * 0.299 + mg * 0.587 + mb * 0.114);
  const k = target / meanL;
  const contrast = c.contrast ?? 2.0;
  for (let i = 0; i < p.length; i += 4) {
    const d = (lum(p, i) - lum(b, i)) * contrast;
    p[i] = Math.max(0, Math.min(255, (mr * k + d) * 255));
    p[i + 1] = Math.max(0, Math.min(255, (mg * k + d) * 255));
    p[i + 2] = Math.max(0, Math.min(255, (mb * k + d) * 255));
  }
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  out.getContext('2d').putImageData(a, 0, 0);
  return out;
}

function roughFromCanvas(src, floor, gain) {
  const cv = document.createElement('canvas');
  cv.width = src.width; cv.height = src.height;
  const g = cv.getContext('2d');
  g.drawImage(src, 0, 0);
  const d = g.getImageData(0, 0, cv.width, cv.height);
  const p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const l = (p[i] * 0.299 + p[i + 1] * 0.587 + p[i + 2] * 0.114) / 255;
    const v = Math.max(0, Math.min(255, (floor + (1 - l) * gain) * 255));
    p[i] = p[i + 1] = p[i + 2] = v;
  }
  g.putImageData(d, 0, 0);
  return cv;
}

function normalFromCanvas(src, strength) {
  const w = src.width, h = src.height;
  const g0 = src.getContext('2d');
  const s = g0.getImageData(0, 0, w, h).data;
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    lum[i] = (s[i * 4] * 0.299 + s[i * 4 + 1] * 0.587 + s[i * 4 + 2] * 0.114) / 255;
  }
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  const out = g.createImageData(w, h);
  const at = (x, y) => lum[((y + h) % h) * w + ((x + w) % w)];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1))
               - (at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1));
      const dy = (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1))
               - (at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1));
      const nx = -dx * strength, ny = -dy * strength, nz = 1;
      const len = Math.hypot(nx, ny, nz);
      const i = (y * w + x) * 4;
      out.data[i] = ((nx / len) * 0.5 + 0.5) * 255;
      out.data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      out.data[i + 2] = ((nz / len) * 0.5 + 0.5) * 255;
      out.data[i + 3] = 255;
    }
  }
  g.putImageData(out, 0, 0);
  return cv;
}

/**
 * Sample one crop off a plate image and turn it into a tiling map set.
 * @param {HTMLImageElement|null} img
 * @param {{x,y,w,h,repeat:[number,number],mean:number,single?:boolean,contrast?:number}} crop
 * @param {number} lift  render-key compensation, stated once per subject
 */
export function plateMaps(img, crop, lift = 1.35) {
  if (!img) return {};
  const tile = tileCanvas(img, crop);
  const albedo = plateDetail(tile, crop, lift);
  const rep = new THREE.Vector2(crop.repeat[0], crop.repeat[1]);
  const tex = (canvas, srgb) => {
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.copy(rep);
    t.anisotropy = 4;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  return {
    map: tex(albedo, true),
    roughnessMap: tex(roughFromCanvas(albedo, crop.roughFloor ?? 0.62, crop.roughGain ?? 0.34), false),
    normalMap: tex(normalFromCanvas(albedo, crop.normalStrength ?? 3.2), false),
    normalScale: new THREE.Vector2(1.0, 1.0),
  };
}

/** A cloth/skin material carrying a plate map, base held near-white so the
 *  map's own colour and value pass through undimmed (see the ash-husk review
 *  entry on why the base must not ALSO be re-levelled). */
export function plateMaterial(name, maps, flatColor, rough, extra = {}) {
  return new THREE.MeshStandardMaterial({
    name, color: maps.map ? (extra.base ?? 0xf6f4f0) : flatColor, roughness: rough, metalness: extra.metalness ?? 0.02,
    side: extra.side ?? THREE.DoubleSide, vertexColors: true, ...maps, ...extra,
  });
}

/** Soft alpha plume, for smoke/ash/breath billboards. */
export function smokeTexture() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  const grad = g.createLinearGradient(0, 128, 0, 0);
  grad.addColorStop(0, 'rgba(255,255,255,0.40)');
  grad.addColorStop(0.55, 'rgba(255,255,255,0.15)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  for (let i = 0; i < 7; i++) {
    g.beginPath();
    g.ellipse(24 + ((i * 37) % 80), 64 + ((i * 53) % 40), 14 + ((i * 11) % 16), 46 + ((i * 17) % 30), 0, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
