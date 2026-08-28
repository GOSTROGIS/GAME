/* =========================================================================
   ash-husk-model.js — enemy.ash-husk, composed from section generators
   -------------------------------------------------------------------------
   v2. The v1 model was one function emitting about forty primitives, and it
   failed in a way worth writing down, because the same failure is available
   to any procedural character:

   1. THE SILHOUETTE WAS INVERTED. The plate is a bell — 0.42 m across the
      shoulders widening to 0.83 m across the sleeve drape at 0.66 m above the
      sole. v1 built a ring of twenty flat extruded slabs on a 0.20 m circle
      and tilted them outward, which from the front is a lampshade: widest at
      the top, narrow at the bottom. Nothing else could be judged until that
      was fixed.
   2. THE HEM WAS A PANEL COUNT, NOT A SURFACE. Torn pendant hems ARE the
      Ashbound silhouette. Separate slabs cannot read as hanging cloth.
   3. THE HANDS WERE INSIDE CLOSED CONES. On the plate the sleeve's front is
      open and the hands hang clear of it. v1 wrapped a closed cone of panels
      around the forearm, so the one piece of exposed anatomy vanished.
   4. THE TABLET HAD NO HARNESS. The plate carries it on two straps over the
      shoulders. Without them a plaque is stuck to a chest.
   5. NOTHING WAS MEASURED. Every dimension was asserted in a comment. There
      was no table of what the plate says and no check that the mesh agreed.

   v2 answers all five: eleven section generators in kit/hm-husk-sections.js,
   each owning one region of the plate and each solo-able in the viewer; a
   PLATE table of measurements taken by scanning the image; and
   silhouetteReport() below, which measures the finished mesh at the same
   heights and prints the difference in millimetres.

   THE STANDING CONFLICT, restated. The family prompt (rank 1,
   call_nIgtNVLVAaxYFQ2Pt3fXba2w, FAMILY_LAW.ashbound) requires a torso that
   is "a narrow vertical archive of cracked clay address drawers". This
   subject's own plate (rank 2) shows an ordinary robed torso carrying ONE
   blank clay tablet. The model follows the plate and REFUSES against the
   prompt; the refusal is reported below rather than quietly resolved. Design
   authority has to settle which governs an individual form.
   ========================================================================= */

import * as THREE from 'three';
import {
  HUSK_SECTIONS, PLATE, JOINTS, FOOT_YAW, tris,
} from './kit/hm-husk-sections.js';
import {
  buildBoneTree, seg, bindGeometry, bindRigid, SpringSim,
  rescale, reseat, measurePosed, skinPoint,
} from './kit/hm-husk-rig.js';
import { radialProfile, layerAudit } from './kit/hm-husk-layers.js';

export { HUSK_SECTIONS, PLATE };

export const SUBJECT = {
  id: 'enemy.ash-husk',
  name: 'Ash Husk',
  family: 'Ashbound',
  rank: 2,
  plate: PLATE.file,
  promptCall: 'call_nIgtNVLVAaxYFQ2Pt3fXba2w',
  targetHeightMeters: PLATE.scale.height,
};

/** What earlier passes got wrong, kept in the file so the fixes are
 *  reviewable. The first five are original-model faults; the last two were
 *  found in this one by measuring the build against its own claims. */
export const REVIEW = [
  { fault: 'Silhouette inverted', was: 'Twenty extruded slabs on a 0.20 m ring, tilted out: widest at the top, a cone from the front.', now: 'husk.mantle lofts one surface from 0.186 m at the shoulder to 0.250 m at the hem; husk.sleeves carry the drape out to 0.417 m from centre at 0.665 m, which is where the plate is widest.' },
  { fault: 'Hem was a panel count', was: 'Pointed slabs at jittered lengths, readable as slabs from any angle.', now: 'tornHem() cusps the boundary of a continuous surface, so the tongues are geometry on cloth.' },
  { fault: 'Hands hidden', was: 'A closed cone of eight panels around each forearm swallowed the hands.', now: 'The sleeve front-inner quadrant opens below the elbow (gapAt + gapMid) exactly as the plate shows, and husk.hands sweeps four fingers and a thumb with the palm turned to the thigh.' },
  { fault: 'Tablet unmounted', was: 'A plaque floating proud of a cylinder, ember bars on its face.', now: 'husk.tablet adds two swept straps over the shoulders and puts the ember slivers BEHIND the rim, where the plate\u2019s warm pixels actually are.' },
  { fault: 'Nothing measured', was: 'Dimensions asserted in comments.', now: 'PLATE holds a landmark table scanned off the image; silhouetteReport() intersects the finished mesh at the same heights and prints the deviation, hem rows excluded and marked as such.' },
  { fault: 'Every garment the same value', was: 'This model’s first pass set pale near-neutral bases AND re-levelled each plate crop to a hand-picked target, then desaturated it. The two cancelled out: all ten materials sat inside a 1.27:1 band of bone-white where the plate’s cloth spans better than 8:1. A brief of “very faithful to the concept art” rendered as a pale statue of a sooty one.', now: 'Each crop carries its MEASURED mean off the plate (0.042 to 0.353); the albedo target is that mean times one stated LIFT constant, so the ratios between garments survive and only the overall level is compensated. No desaturation — the plate’s browns are the only colour this subject has. Bases sit at near-white and pass the map through.' },
  { fault: 'Variant 0 was not the plate', was: 'Optional parts were gated on axis > 0, and axesOf(0) returns 0 on every axis — so the default build, the one the viewer shows and every screenshot captures, silently dropped the tablet harness, the mantle under-layer, the cowl fold, the tunic column and cross drape, the sash tail and both boot soles, while this panel went on claiming them.', now: 'Index 0 on every axis is now the plate as drawn; 1 is the lighter reading, 2 the heavier. An axis may vary a form. It may not decide whether the subject’s own plate is honoured.' },
  { fault: 'Cowl climbed over the jaw', was: 'Chasing the plate’s 0.252 m width at 1.56 m, the cowl’s top was raised four times until it topped out at 1.625 — 95 mm above its own declared band — swallowing the jaw and leaving the face a smooth ovoid with two dark bars on it.', now: 'Heights are pinned back to PLATE.cowl (1.405–1.530) and that width is answered with a `sides` term that lifts both flanks and leaves the front alone. The opening lip traces the actual cut at a third of its old thickness instead of arcing over the forehead like a headphone band.' },
  { fault: 'Arms passed through their own sleeves', was: 'Sections were rigid meshes parented to Groups. The sleeve hung off the shoulder and the hand off the wrist with nothing between them, so rotating the elbow drove the hand THROUGH the cloth. No reshaping of the sleeve can fix that — the surface had no relationship to the chain it covers.', now: 'A real THREE.Skeleton with automatic capsule-field weighting. The right bell sleeve now takes 40 % shoulder, 31 % elbow, 10 % wrist: half its vertices move when the elbow does, by up to 454 mm. Each garment declares which bones may claim it, because on distance alone the skirt ring stole a quarter of the sleeve.' },
  { fault: 'Cloth made of steel', was: 'A robe rigidly parented to the chest cannot lag when the body starts, swing through a turn, or settle after a stop. Every clip read as a mannequin being carried.', now: 'Twenty-two spring bones — eight two-segment chains round the hem, one per sleeve drape, plus cowl fold and sash tail — integrated with Verlet, gravity, body inertia, a length constraint and a per-group angle limit. Through the resolve clip the sleeve drape swings 25° and the hem 6°, and both settle back to 0.1°. A first attempt read each bone’s rest pose through its own current rotation, feeding the spring its own output and cancelling the restoring force: the hem moved a tenth of a degree.' },
  { fault: 'The face was an ovoid', was: 'A 40×30 sphere is about 6 mm between vertices across the face. A lid crease is thinner than that, so it was not softened, it was deleted — leaving a smooth egg with a lash arc and a mouth bar stuck on the front.', now: 'kit/hm-face.js builds the head at 96×72 from canonical facial proportion, in six ordered passes (skull, masses, features, folds, asymmetry, skin relief) so a broad cheek sweep can no longer flatten a nose built before it. Closed lids are a globe-pushed dome with a crease above and a lash seam at the margin. 7,081 vertices in the face alone.' },
  { fault: 'Layers passed through each other', was: 'Every garment’s radius was typed by hand and tuned against the plate one section at a time. That fixes the OUTSIDE of the figure and says nothing about the relationship between layers, so the inner ones drifted straight out through the outer ones: the rust apron 45 mm outside the mantle covering it, the cross drape 69 mm, the tunic column 9 mm through the under-layer, the sash’s inner wall 54 mm INSIDE the robe it wraps, and the harness threaded through the garment it is buckled over.', now: 'kit/hm-husk-layers.js derives the stack instead: the plate fixes the outermost surface and every inner layer is that surface minus a declared inset, so an inner garment cannot escape its outer one. Insets clear the ~14 mm that folds, crease and crack push a surface past its own station, on both sides. The sash adds its tube’s own wall thickness explicitly, and straps project onto the robe’s surface rather than carrying typed coordinates. All ten audited pairs clear.' },
  { fault: 'A uniform gap that did not fit', was: 'The first stack used one 32 mm gap for every layer. It read as principled and was arithmetically impossible: four layers inside a robe of radius 0.21 leaves the innermost at 0.11, while the thighs reach 0.16 — so the trousers burst through the tunic by 68 mm.', now: 'Insets are sized against what is actually inside them. The apron and column share one depth because on the plate they are one garment, and the trousers are narrowed to what a gaunt figure would wear — which costs nothing, since the sleeves and hem own every silhouette band down there.' },
  { fault: 'Cloth swung through the body', was: 'A layer stack governs the rest pose and nothing after it. The hem chains had no colliders, so any clip that moved a leg swung the robe straight through it.', now: 'Nine body capsules — torso, hips, thighs, shins, upper arms — push the spring particles out after the length constraint, so an advancing thigh displaces the hem instead of passing through it.' },
  { fault: 'The audit measured the wrong thing twice', was: 'The clipping check first compared radial profiles by HEIGHT alone, so a narrow shoulder strap was scored against the mantle’s width at the side of the body it never crosses — reporting 43 mm of penetration that did not exist. And robeR interpolated the station list against y while clothLoft interpolates by station INDEX; with three stations inside the robe’s top 70 mm those are different functions, and they disagreed most exactly where the harness crosses.', now: 'The audit bins by height AND angle and compares only where both surfaces have geometry. robeR is sampled from a table built with clothLoft’s own formula, so the stack and the mesh agree by construction rather than by coincidence.' },
];

/* ------------------------------------------------------------------ plate
   Crops from the 1024 x 1536 plate. Same-origin, so it is readable; a CDN
   thumbnail taints the canvas and cannot be sampled at all.

   `mean` is the crop's MEASURED mean luminance, scanned off the plate. It is
   not a taste value and must not be hand-edited: it is what the art says that
   garment is worth. The plate's cloth spans 0.042 to 0.353 — better than 8:1 —
   and the first pass of this model flattened all of it into a 1.27:1 band of
   bone-white by re-seating every crop to a hand-picked target and then pulling
   it toward grey. The figure came out a pale statue where the plate is a sooty
   one, which for a brief of "very faithful to the concept art" is the whole
   job missed.

   Two rules keep it honest now:
     · albedo target = mean × LIFT, one stated constant, so the RATIOS between
       garments survive and only the overall level is compensated;
     · no desaturation at all — the plate's browns (saturation 0.28 to 0.37 on
       mantle, tunic and sash) are the only colour this subject has. */
const LIFT = 1.35;   // the render's key is dimmer than the plate's. Nothing else.

const CROPS = {
  /* Repeats are set so one tile covers roughly 0.12 m of cloth: the plate's
     crack cells run 1.3–2.6 cm, and at repeat 3 a tile spanned half a metre,
     which read as marbled paper.       measured:   hex      lum   sat */
  crust:  { x: 620, y: 430, w: 140, h: 140, repeat: [10, 12], mean: 0.189 }, // #32302e  48  .08
  mantle: { x: 250, y: 850, w: 140, h: 140, repeat: [8, 10], mean: 0.076 },  // #161310  20  .28
  tunic:  { x: 430, y: 720, w: 120, h: 160, repeat: [4, 6], mean: 0.154 },   // #2e2520  39  .31
  sash:   { x: 380, y: 548, w: 150, h: 80,  repeat: [6, 2], mean: 0.132 },   // #282019  34  .37
  tablet: { x: 405, y: 365, w: 165, h: 140, repeat: [1, 1], mean: 0.353, single: true }, // #675749 90 .29
  skin:   { x: 425, y: 140, w: 120, h: 120, repeat: [6, 6], mean: 0.241, contrast: 0.55 }, // #433c36 62 .19
  boot:   { x: 260, y: 1330, w: 170, h: 110, repeat: [3, 3], mean: 0.066 },  // #12110f  17  .18
  dark:   { x: 330, y: 1180, w: 150, h: 130, repeat: [5, 6], mean: 0.042 },  // #0c0b08  11  .33
};

/** The measured plate colour, lifted the same way — used only when the plate
 *  cannot be read, so even the fallback is the art's value and not a guess. */
const FLAT = {
  crust: 0x43413e, mantle: 0x1e1a16, tunic: 0x3e322b, sash: 0x362b22,
  tablet: 0x8b7563, skin: 0x5a5149, boot: 0x181714, dark: 0x100f0b,
};

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
  if (c.single) {                        // the tablet field is one crop, not a tile
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

/** Lift the crop to a stated mean and flatten its baked lighting a little. */
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

/** Tile the source nine times, blur, take the centre — a blur that wraps, so
 *  the low-frequency estimate has no edge darkening to subtract. */
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

/**
 * Turn a crop into a tiling DETAIL map.
 *
 * A crop used directly as albedo carries the plate's own fold shading, and
 * tiled ten times across a robe that shading becomes corduroy — which is
 * exactly what the first pass of this model looked like. So the crop is
 * high-passed: subtract its own wrapped blur to keep the crack network and
 * throw away the lighting, then re-seat it on the crop's mean colour at a
 * stated value. The hue and the crazing are both still the plate's; only the
 * plate's lighting is discarded, because this model has its own.
 */
function plateDetail(tile, c) {
  const target = c.mean * LIFT;
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

function plateMaps(img, key) {
  if (!img) return {};
  const c = CROPS[key];
  const tile = tileCanvas(img, c);
  const albedo = plateDetail(tile, c);
  const rep = new THREE.Vector2(c.repeat[0], c.repeat[1]);
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
    roughnessMap: tex(roughFromCanvas(albedo, 0.62, 0.34), false),
    normalMap: tex(normalFromCanvas(albedo, 3.2), false),
    normalScale: new THREE.Vector2(1.0, 1.0),
  };
}

function smokeTexture() {
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

/* -------------------------------------------------------------- materials */
function buildMaterials(plateImg) {
  const M = {};
  const maps = {};
  for (const k of Object.keys(CROPS)) maps[k] = plateMaps(plateImg, k);
  /* When a crop loaded, the MAP carries the plate's colour and value and the
     base is held at near-white so it only passes it through. The old code did
     the opposite — pale base AND re-levelled map — so neither carried the art
     and all ten materials landed inside one bone-white band. */
  const BASE = 0xf6f4f0;
  const cloth = (name, key, rough) => new THREE.MeshStandardMaterial({
    name, color: maps[key].map ? BASE : FLAT[key], roughness: rough, metalness: 0.02,
    side: THREE.DoubleSide, vertexColors: true, ...maps[key],
  });

  M.crust = cloth('ash-crust-cloth', 'crust', 0.95);
  M.mantle = cloth('ash-crust-under', 'mantle', 0.96);
  M.tunic = cloth('rust-tunic', 'tunic', 0.93);
  M.sash = cloth('sash-wrap', 'sash', 0.95);
  M.dark = cloth('under-wrap', 'dark', 0.97);
  M.boot = cloth('soft-boot-leather', 'boot', 0.92);

  M.skin = new THREE.MeshStandardMaterial({
    name: 'ash-cured-skin', color: maps.skin.map ? BASE : FLAT.skin,
    roughness: 0.86, metalness: 0, vertexColors: true, ...maps.skin,
  });
  /* The face is the one surface where crust detail competes with anatomy, so
     its normal map is held back: brow, lids and nose have to read first. */
  if (M.skin.normalScale) M.skin.normalScale.set(0.35, 0.35);
  M.clay = new THREE.MeshStandardMaterial({
    name: 'name-tablet-clay', color: maps.tablet.map ? BASE : FLAT.tablet,
    roughness: 0.84, metalness: 0, vertexColors: true, ...maps.tablet,
  });
  /* The rim and the harness are rusted clay-fired iron: the plate gives them
     the tunic's own hue, so they take the tunic crop, held a little darker. */
  M.frame = new THREE.MeshStandardMaterial({
    name: 'tablet-frame-iron', color: maps.tunic.map ? 0xb9b2a8 : 0x2e251f,
    roughness: 0.74, metalness: 0.14, vertexColors: true, ...maps.tunic,
  });
  M.ember = new THREE.MeshStandardMaterial({
    name: 'ember-seam', color: 0x2a1206, emissive: 0xc44a18, emissiveIntensity: 1.4,
    roughness: 0.6, vertexColors: true,
  });
  M.smoke = new THREE.MeshStandardMaterial({
    name: 'shoulder-smoke', color: 0xb9b4a8, transparent: true, opacity: 0.15,
    depthWrite: false, roughness: 1, metalness: 0, side: THREE.DoubleSide,
    map: smokeTexture(), alphaMap: smokeTexture(),
  });
  return M;
}

/* ================================================================= build */
/**
 * @param {{plate?:HTMLImageElement|null, variant?:number, enabled?:Set<string>}} o
 */
export function buildAshHusk({ plate = null, variant = 0, enabled = null } = {}) {
  const mats = buildMaterials(plate);
  const root = new THREE.Group();
  root.name = 'ash-husk';

  /* ---- skeleton. Seventeen body joints plus the cloth bones that give the
     garments somewhere to swing from. Bones, not Groups: the sections are
     SKINNED to this, so a sleeve bends at the elbow it covers instead of
     sliding past it. */
  const PARENT = {
    pelvis: null, spine: 'pelvis', chest: 'spine', neck: 'chest', head: 'neck',
    shoulderL: 'chest', shoulderR: 'chest', elbowL: 'shoulderL', elbowR: 'shoulderR',
    wristL: 'elbowL', wristR: 'elbowR',
    hipL: 'pelvis', hipR: 'pelvis', kneeL: 'hipL', kneeR: 'hipR',
    ankleL: 'kneeL', ankleR: 'kneeR',
  };
  const order = ['pelvis', 'spine', 'chest', 'neck', 'head', 'shoulderL', 'shoulderR',
    'elbowL', 'elbowR', 'wristL', 'wristR', 'hipL', 'hipR', 'kneeL', 'kneeR', 'ankleL', 'ankleR'];
  const rest = { ...JOINTS };

  /* Cloth bones. The robe hangs on a ring of eight two-segment chains, the
     sleeves on one chain each, and the cowl fold and sash tail on one apiece.
     Positions sit ON the garment surface, so the binder's capsule distance
     picks them over the body bones without needing hand-painted weights. */
  const SKIRT_N = 8;
  const clothChains = [];
  for (let i = 0; i < SKIRT_N; i++) {
    const th = (i / SKIRT_N) * Math.PI * 2;
    const s = Math.sin(th), c = Math.cos(th);
    const A = `skirtA${i}`, B = `skirtB${i}`;
    rest[A] = [0.205 * s, 1.055, 0.152 * c];
    rest[B] = [0.232 * s, 0.700, 0.172 * c];
    PARENT[A] = 'pelvis'; PARENT[B] = A;
    order.push(A, B);
    clothChains.push({ bones: [A, B], tip: [0.248 * s, 0.360, 0.184 * c], group: 'skirt' });
  }
  for (const side of [1, -1]) {
    const k = side > 0 ? 'L' : 'R';
    const rch = side > 0 ? 0.93 : 1.05;
    const A = `drapeA${k}`, B = `drapeB${k}`;
    rest[A] = [side * 0.160 * rch, 1.170, 0.020];
    rest[B] = [side * 0.244 * rch, 0.860, 0.028];
    PARENT[A] = `shoulder${k}`; PARENT[B] = A;
    order.push(A, B);
    clothChains.push({ bones: [A, B], tip: [side * 0.270 * rch, 0.520, 0.030], group: 'sleeve' });
  }
  rest.cowlFold = [0.086, 1.430, 0.052];
  PARENT.cowlFold = 'neck'; order.push('cowlFold');
  clothChains.push({ bones: ['cowlFold'], tip: [0.104, 1.300, 0.070], group: 'cowl' });

  rest.sashTail = [-0.010, 1.086, 0.168];
  PARENT.sashTail = 'pelvis'; order.push('sashTail');
  clothChains.push({ bones: ['sashTail'], tip: [-0.028, 0.866, 0.150], group: 'sash' });

  const tree = buildBoneTree(rest, PARENT, order);
  const J = tree.byName, abs = tree.abs, boneIndex = tree.index;
  root.add(J.pelvis);

  /* ---- influence field. One capsule per bone segment; a vertex takes its
     four strongest and normalises. Body capsules are broad and weighted 1;
     cloth capsules are narrow and weighted up, so a hem vertex 0.4 m from the
     spine and 0.05 m from a skirt bone goes to the skirt bone. */
  const P = (n) => [abs[n].x, abs[n].y, abs[n].z];
  const field = [
    seg('pelvis', P('pelvis'), [0, 1.000, 0], 0.20),
    seg('spine', [0, 1.000, 0], [0, 1.180, 0], 0.22),
    seg('chest', [0, 1.180, 0], P('neck'), 0.26),
    seg('neck', P('neck'), [0, 1.520, 0], 0.13),
    seg('head', [0, 1.540, 0], [0, 1.720, 0], 0.15),
    seg('shoulderL', P('shoulderL'), P('elbowL'), 0.155, 1.0),
    seg('shoulderR', P('shoulderR'), P('elbowR'), 0.155, 1.0),
    /* The forearm capsules are wide and weighted UP because the bell sleeve
       hangs outboard of the arm, not on it: at r 0.13 the elbow claimed 4 % of
       the sleeve and only 13 % of its vertices moved when the elbow did — the
       arm complaint, in one number. */
    seg('elbowL', P('elbowL'), P('wristL'), 0.215, 1.9, 1.2),
    seg('elbowR', P('elbowR'), P('wristR'), 0.215, 1.9, 1.2),
    seg('wristL', P('wristL'), [abs.wristL.x, 0.66, 0.03], 0.175, 1.6, 1.2),
    seg('wristR', P('wristR'), [abs.wristR.x, 0.66, 0.03], 0.175, 1.6, 1.2),
    seg('hipL', P('hipL'), P('kneeL'), 0.14),
    seg('hipR', P('hipR'), P('kneeR'), 0.14),
    seg('kneeL', P('kneeL'), P('ankleL'), 0.13),
    seg('kneeR', P('kneeR'), P('ankleR'), 0.13),
    seg('ankleL', P('ankleL'), [abs.ankleL.x, 0, 0.06], 0.11),
    seg('ankleR', P('ankleR'), [abs.ankleR.x, 0, 0.06], 0.11),
  ];
  for (const ch of clothChains) {
    const w = ch.group === 'sleeve' ? 1.5 : ch.group === 'skirt' ? 1.6 : 2.0;
    const r = ch.group === 'skirt' ? 0.165 : ch.group === 'sleeve' ? 0.150 : 0.085;
    for (let i = 0; i < ch.bones.length; i++) {
      const a = P(ch.bones[i]);
      const b = i + 1 < ch.bones.length ? P(ch.bones[i + 1]) : ch.tip;
      field.push(seg(ch.bones[i], a, b, r, w, 1.4));
    }
  }

  /* ---- sections. Geometry is authored in figure space (or joint-local, which
     is lifted into figure space here), then bound. Nothing is parented to a
     joint any more: the skeleton does the moving. */
  const sectionMeshes = {};
  const sectionReport = [];
  const smokeMeshes = [];
  const allGeos = [];
  const bodyMeshes = [];
  const ctx = { PLATE, mats, joint: (n) => abs[n].clone(), variant };

  for (const S of HUSK_SECTIONS) {
    if (enabled && !enabled.has(S.id)) continue;
    const built = S.build(ctx, variant);
    const meshes = [];
    let t = 0;
    for (const part of built.parts) {
      const geo = part.geometry;
      if (part.local) geo.translate(abs[part.joint].x, abs[part.joint].y, abs[part.joint].z);

      /* Smoke stays an unskinned billboard: it is not on the body and it is
         the one section that is deliberately not solid. */
      if (part.billboard) {
        const mesh = new THREE.Mesh(geo, mats[part.material] || mats.crust);
        mesh.name = part.name;
        mesh.userData.seed = part.seed ?? 0;
        mesh.userData.anchor = part.offset ? part.offset.slice() : [0, 1.4, 0];
        mesh.position.set(...mesh.userData.anchor);
        root.add(mesh);
        smokeMeshes.push(mesh);
        meshes.push(mesh);
        t += tris(geo);
        continue;
      }

      if (part.rigid) bindRigid(geo, boneIndex, part.joint);
      else bindGeometry(geo, field, boneIndex, part.joint, part.bind || null);

      const mesh = new THREE.SkinnedMesh(geo, mats[part.material] || mats.crust);
      mesh.name = part.name;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;      // it deforms; a static bound would clip it
      root.add(mesh);
      allGeos.push(geo);
      bodyMeshes.push(mesh);
      meshes.push(mesh);
      t += tris(geo);
    }
    sectionMeshes[S.id] = meshes;
    sectionReport.push({ id: S.id, name: S.name, triangles: t, meshes: meshes.length, reads: S.reads, method: S.method });
  }

  /* ---- the plate's stance, applied as POSE rather than baked, so the neck
     actually deforms under the bowed head instead of the head detaching. Foot
     yaw is the exception: it is baked into the boot and lower-leg geometry
     before binding, because a bind pose that already carries it would make
     every clip's ankle rotation relative to a turned foot. */
  const headBow = 0.20;
  const applyStance = () => {
    J.head.rotation.x = headBow;
    J.neck.rotation.x = 0.05;
    J.chest.rotation.x = 0.02;
    J.ankleL.rotation.y = FOOT_YAW.L;
    J.ankleR.rotation.y = FOOT_YAW.R;
  };
  const clearStance = () => {
    for (const n of order) { J[n].rotation.set(0, 0, 0); }
  };

  let skeleton = null;
  const rebind = () => {
    clearStance();
    root.updateMatrixWorld(true);
    skeleton = new THREE.Skeleton(tree.bones);
    for (const m of bodyMeshes) { m.bind(skeleton, new THREE.Matrix4()); }
    applyStance();
    root.updateMatrixWorld(true);
  };
  rebind();

  /* ---- fit. boneInverses and bindMatrix are snapshots, so scaling the root
     after binding applies the scale twice. The fit is therefore BAKED into the
     buffers and bone offsets and the skeleton rebuilt — twice, because the
     bowed head changes the crown by a few millimetres and the first pass can
     only measure the pose it already has. */
  let scaleApplied = 1;
  let totalDy = 0;
  /* The fit measures with a stride: CPU skinning every vertex of a 54k mesh
     five times over is several seconds of blocked main thread, and the crown
     and sole are found just as reliably from a quarter of the points. The
     final metrics below take the full pass. */
  for (let pass = 0; pass < 2; pass++) {
    const b = measurePosed(bodyMeshes, undefined, 4);
    const h = Math.max(0.2, b.max.y - b.min.y);
    const k = SUBJECT.targetHeightMeters / h;
    clearStance();
    root.updateMatrixWorld(true);
    rescale(allGeos, tree.bones, k);
    scaleApplied *= k;
    totalDy *= k;
    rebind();
    const after = measurePosed(bodyMeshes, undefined, 4);
    clearStance();
    root.updateMatrixWorld(true);
    reseat(allGeos, J.pelvis, -after.min.y);
    totalDy += -after.min.y;
    rebind();
  }
  scaleApplied = +scaleApplied.toFixed(5);

  /* Smoke is not skinned, so it misses rescale/reseat; place it from its own
     anchor through the same transform the body just took. */
  for (const m of smokeMeshes) {
    const a = m.userData.anchor;
    m.userData.baseScale = scaleApplied;
    m.userData.baseY = a[1] * scaleApplied + totalDy;
    m.position.set(a[0] * scaleApplied, m.userData.baseY, a[2] * scaleApplied);
  }

  /* ---- spring bones. Axes are read with the stance CLEARED, so every cloth
     bone's rest direction is measured in an unrotated frame; measuring it
     through a bowed spine would bake the bow into the rest pose and the hem
     would settle into a permanent lean. */
  const FEEL = {
    skirt: { stiff: 0.055, damp: 0.085, limit: 0.50 },
    sleeve: { stiff: 0.075, damp: 0.105, limit: 0.44 },
    cowl: { stiff: 0.130, damp: 0.150, limit: 0.34 },
    sash: { stiff: 0.105, damp: 0.130, limit: 0.40 },
  };
  clearStance();
  root.updateMatrixWorld(true);
  const springChains = clothChains.map((ch) => ch.bones.map((name, i) => {
    const bone = J[name];
    let local;
    if (i + 1 < ch.bones.length) {
      local = J[ch.bones[i + 1]].position.clone();
    } else {
      const tip = new THREE.Vector3(ch.tip[0], ch.tip[1], ch.tip[2]).multiplyScalar(scaleApplied);
      tip.y += totalDy;
      bone.updateWorldMatrix(true, false);
      local = bone.worldToLocal(tip);
    }
    const len = Math.max(1e-4, local.length());
    return { bone, len, axis: local.clone().normalize(), group: ch.group, ...FEEL[ch.group] };
  }));
  applyStance();
  root.updateMatrixWorld(true);

  /* Heavier cloth settles slower and swings less. Ash-cured sacking is stiff
     and dead, so every group is damped hard; the per-group values above carry
     the differences between a metre of robe and a hand's width of cowl. */
  const springs = new SpringSim(springChains, {
    stiff: 0.085, damp: 0.11, gravity: -2.6, limit: 0.45, inertia: 0.98,
    /* Body capsules, in the same units the fit just baked. The thighs are what
       the hem actually hits: on any clip that swings a leg, a hem with no
       collider passes straight through it. */
    colliders: [
      { boneA: J.pelvis, boneB: J.chest, r: 0.200 * scaleApplied },
      { boneA: J.pelvis, boneB: J.hipL, r: 0.175 * scaleApplied },
      { boneA: J.pelvis, boneB: J.hipR, r: 0.175 * scaleApplied },
      { boneA: J.hipL, boneB: J.kneeL, r: 0.115 * scaleApplied },
      { boneA: J.hipR, boneB: J.kneeR, r: 0.115 * scaleApplied },
      { boneA: J.kneeL, boneB: J.ankleL, r: 0.098 * scaleApplied },
      { boneA: J.kneeR, boneB: J.ankleR, r: 0.098 * scaleApplied },
      { boneA: J.shoulderL, boneB: J.elbowL, r: 0.090 * scaleApplied },
      { boneA: J.shoulderR, boneB: J.elbowR, r: 0.090 * scaleApplied },
    ],
  });

  const body = measurePosed(bodyMeshes);
  const smokeTop = smokeMeshes.reduce((m, s) => Math.max(m, s.userData.baseY + 0.30 * scaleApplied), body.max.y);
  const metrics = {
    figureHeight: +(body.max.y - body.min.y).toFixed(3),
    withSmoke: +(smokeTop - body.min.y).toFixed(3),
    width: +(body.max.x - body.min.x).toFixed(3),
    depth: +(body.max.z - body.min.z).toFixed(3),
    scaleApplied,
    errorMm: Math.round((body.max.y - body.min.y - SUBJECT.targetHeightMeters) * 1000),
  };

  let triangles = 0;
  root.traverse((o) => { if (o.isMesh) triangles += tris(o.geometry); });

  /* ================================================================ clips
     Five, as authored. The telegraph is the creature's own recovery tell from
     the bestiary — "its arms lock wide, then tremble inward" — so animation
     and codex cannot disagree. Poses are joint rotations; the mantle and
     sleeves hang from chest and shoulder, so they swing with the body. */
  const restPose = new Map();
  for (const name of order) restPose.set(J[name], { p: J[name].position.clone(), r: J[name].rotation.clone() });
  const reset = () => restPose.forEach((v, g) => { g.position.copy(v.p); g.rotation.copy(v.r); });

  const clips = {
    idle: (t) => {
      const b = Math.sin(t * 1.15);
      J.chest.rotation.x = 0.02 + b * 0.020;
      J.spine.rotation.y = Math.sin(t * 0.42) * 0.040;
      J.head.rotation.x = headBow + Math.sin(t * 0.9 + 1) * 0.028;
      J.head.rotation.y = Math.sin(t * 0.33) * 0.06;
      J.shoulderL.rotation.z = -0.03 + b * 0.016;
      J.shoulderR.rotation.z = 0.03 - b * 0.016;
      J.pelvis.position.y += b * 0.004;
    },
    move: (t) => {
      const s = t * 2.6, sw = Math.sin(s), co = Math.cos(s);
      J.pelvis.position.y += -0.016 + Math.abs(sw) * 0.020;
      J.pelvis.rotation.y = sw * 0.06;
      J.chest.rotation.x = 0.11;
      J.spine.rotation.y = -sw * 0.05;
      J.hipL.rotation.x = sw * 0.40; J.hipR.rotation.x = -sw * 0.40;
      J.kneeL.rotation.x = Math.max(0, -co) * 0.48;
      J.kneeR.rotation.x = Math.max(0, co) * 0.48;
      J.ankleL.rotation.x = -J.hipL.rotation.x * 0.30;
      J.ankleR.rotation.x = -J.hipR.rotation.x * 0.30;
      J.shoulderL.rotation.x = -sw * 0.18; J.shoulderR.rotation.x = sw * 0.18;
      J.shoulderL.rotation.z = -0.05; J.shoulderR.rotation.z = 0.05;
      J.head.rotation.x = headBow + 0.06 - Math.abs(sw) * 0.03;
    },
    telegraph: (t) => {
      const c = (t % 2.4) / 2.4;
      const open = Math.min(1, c / 0.28);
      const hold = c > 0.28 ? (c - 0.28) / 0.72 : 0;
      const trem = hold > 0 ? Math.sin(t * 34) * 0.026 * hold : 0;
      J.shoulderL.rotation.z = -(open * 1.00) + hold * 0.15 - trem;
      J.shoulderR.rotation.z = (open * 1.00) - hold * 0.15 + trem;
      J.shoulderL.rotation.x = J.shoulderR.rotation.x = -open * 0.26;
      J.elbowL.rotation.z = -open * 0.20 - trem;
      J.elbowR.rotation.z = open * 0.20 + trem;
      J.chest.rotation.x = 0.02 - open * 0.14;
      J.head.rotation.x = headBow - open * 0.28;             // the face comes up
      J.pelvis.position.y += open * 0.018;
      J.spine.rotation.y = trem * 0.4;
    },
    resolve: (t) => {
      const c = (t % 1.9) / 1.9;
      const wind = c < 0.22 ? c / 0.22 : 1;
      const strike = c >= 0.22 && c < 0.42 ? (c - 0.22) / 0.20 : c >= 0.42 ? 1 : 0;
      const recover = c >= 0.42 ? (c - 0.42) / 0.58 : 0;
      const f = strike * (1 - recover);
      J.shoulderL.rotation.z = -(wind * 0.85) + f * 1.15;
      J.shoulderR.rotation.z = (wind * 0.85) - f * 1.15;
      J.elbowL.rotation.x = -f * 0.85; J.elbowR.rotation.x = -f * 0.85;
      J.chest.rotation.x = 0.02 - wind * 0.18 + f * 0.38;
      J.pelvis.position.z += f * 0.13;
      J.pelvis.position.y -= f * 0.05;
      J.head.rotation.x = headBow - wind * 0.22 + f * 0.32;
    },
    death: (t) => {
      const c = Math.min(1, t / 2.6);
      const e = c * c * (3 - 2 * c);
      J.pelvis.position.y -= e * 0.60;
      J.pelvis.position.z += e * 0.10;
      J.pelvis.rotation.x = e * 0.40;
      J.hipL.rotation.x = -e * 1.20; J.hipR.rotation.x = -e * 1.10;
      J.kneeL.rotation.x = e * 1.80; J.kneeR.rotation.x = e * 1.70;
      J.chest.rotation.x = 0.02 + e * 0.52;
      J.spine.rotation.z = e * 0.12;
      J.head.rotation.x = headBow + e * 0.50;
      J.shoulderL.rotation.z = -e * 0.28; J.shoulderR.rotation.z = e * 0.24;
      J.shoulderL.rotation.x = J.shoulderR.rotation.x = e * 0.50;
      mats.ember.emissiveIntensity = 1.4 * (1 - e) + 0.04;
    },
  };

  let current = 'idle', clock = 0;
  const update = (dt) => {
    clock += dt;
    reset();
    (clips[current] || clips.idle)(clock);
    root.updateMatrixWorld(true);
    /* Cloth AFTER the pose, every frame: the sim reads where the body just
       moved to and trails it. Run before the pose and it would be chasing
       last frame's body, which is the classic one-frame-late rubber look. */
    springs.step(root, dt);
    if (current !== 'death') {
      mats.ember.emissiveIntensity = 1.2 + Math.sin(clock * 1.9) * 0.35 + Math.sin(clock * 7.3) * 0.10;
    }
    for (let i = 0; i < smokeMeshes.length; i++) {
      const m = smokeMeshes[i];
      const s = clock * 0.40 + m.userData.seed;
      const k = s % 1;
      m.position.y = m.userData.baseY + k * 0.24 * m.userData.baseScale;
      m.rotation.y = Math.sin(s * 0.6) * 0.5;
      m.rotation.z = Math.sin(s * 0.9) * 0.12;
      m.scale.setScalar((0.8 + k * 0.5) * m.userData.baseScale);
      m.material.opacity = current === 'death'
        ? Math.max(0, 0.15 - clock * 0.05)
        : 0.15 * (1 - k) * (0.6 + 0.4 * Math.sin(s * 2.1));
    }
  };

  const setClip = (name) => {
    if (!clips[name]) return;
    current = name; clock = 0;
    reset();
    clips[name](0);
    root.updateMatrixWorld(true);
    springs.reset(root);          // a pose jump must not fling the hem
  };
  const setSection = (id, on) => { (sectionMeshes[id] || []).forEach((m) => { m.visible = on; }); };
  const soloSection = (id) => {
    for (const key of Object.keys(sectionMeshes)) setSection(key, !id || key === id);
  };

  return {
    group: root, joints: J, materials: mats,
    update, setClip, clipNames: Object.keys(clips),
    setSection, soloSection, sectionMeshes, sectionReport,
    triangles: Math.round(triangles), metrics,
    plateLoaded: !!plate,
    skeleton, bones: tree.bones, springs,
    silhouette: () => silhouetteReport(bodyMeshes),
    clipping: () => clippingReport(bodyMeshes),
  };
}

/* ---------------------------------------------------------- clipping check
   The layer stack is a claim that inner garments stay inside outer ones. This
   measures it on the built mesh and the viewer prints the millimetres, for the
   same reason the silhouette table exists: an unchecked claim is decoration.

   `tol` is not slack for sloppiness — it names where an intersection is
   CORRECT. A sleeve's shoulder cap belongs under the mantle, and a hand
   belongs inside the sleeve's mouth; scoring those as faults would push the
   model toward pulling the arm out of its own garment. */
export const LAYER_PAIRS = [
  { inner: 'rust-apron', outer: 'mantle-outer', label: 'Rust apron inside the mantle' },
  { inner: 'tunic-cross-drape', outer: 'mantle-outer', label: 'Cross drape inside the mantle' },
  { inner: 'tunic-under-column', outer: 'mantle-under-layer', label: 'Tunic column inside the under-layer' },
  { inner: 'mantle-under-layer', outer: 'mantle-outer', label: 'Under-layer inside the mantle' },
  { inner: 'rust-apron', outer: 'mantle-under-layer', label: 'Rust apron inside the under-layer' },
  { inner: 'mantle-outer', outer: 'sash-wraps', label: 'Sash wraps OVER the mantle' },
  { inner: 'trouser-thigh-L', outer: 'tunic-under-column', label: 'Left trouser inside the tunic' },
  { inner: 'trouser-thigh-R', outer: 'tunic-under-column', label: 'Right trouser inside the tunic' },
  { inner: 'mantle-outer', outer: 'name-tablet-blank', label: 'Tablet proud of the mantle', tol: 0 },
  { inner: 'mantle-outer', outer: 'tablet-harness', label: 'Harness rides over the mantle' },
];

export function clippingReport(meshes) {
  /* Only the meshes named in a pair get profiled. Profiling all 33 walked
     every vertex of the whole figure and blew a ten-second budget. */
  const wanted = new Set();
  for (const p of LAYER_PAIRS) { wanted.add(p.inner); wanted.add(p.outer); }
  const profiles = {};
  for (const m of meshes) {
    if (!wanted.has(m.name) || profiles[m.name]) continue;
    profiles[m.name] = radialProfile(m);
  }
  const rows = layerAudit(profiles, LAYER_PAIRS);
  const live = rows.filter((r) => !r.missing);
  return { rows, clean: live.filter((r) => r.ok).length, total: live.length };
}

/* ------------------------------------------------------- silhouette check
   The plate's own width at twenty-two heights against the model's.

   Measured by intersecting TRIANGLES with the height plane, not by bucketing
   vertices: a vertex scan reports whatever happens to have a ring near that
   height, which made adjacent bands disagree by 300 mm on a surface that is
   obviously smooth. Rows graded `tongue` sit inside the hem region, where the
   plate's width is decided by which pendant tongue a row happens to cross;
   they are printed for reference and NOT counted, because a band-by-band
   comparison there would be measuring tongue phase, not fidelity. */
export function silhouetteReport(meshes) {
  const heights = PLATE.silhouette.map((r) => r[0]);
  const lo = new Float64Array(heights.length).fill(Infinity);
  const hi = new Float64Array(heights.length).fill(-Infinity);
  const hit = new Uint32Array(heights.length);
  const v = new THREE.Vector3();

  for (const o of meshes) {
    if (!o.visible) continue;
    o.updateWorldMatrix(true, false);
    const g = o.geometry;
    const p = g.attributes.position;
    const si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
    const idx = g.index;
    const count = idx ? idx.count : p.count;
    /* Vertices are POSED first — skinned on the CPU exactly as the shader does
       it — because measuring the rest buffer would report the bind pose and
       quietly congratulate the model on a silhouette nobody sees. */
    const xs = new Float32Array(p.count), ys = new Float32Array(p.count);
    for (let i = 0; i < p.count; i++) {
      v.set(p.getX(i), p.getY(i), p.getZ(i));
      if (si && sw && o.skeleton) skinPoint(v, o, si, sw, i);
      v.applyMatrix4(o.matrixWorld);
      xs[i] = v.x; ys[i] = v.y;
    }
    const tri = [0, 0, 0];
    for (let i = 0; i < count; i += 3) {
      tri[0] = idx ? idx.getX(i) : i;
      tri[1] = idx ? idx.getX(i + 1) : i + 1;
      tri[2] = idx ? idx.getX(i + 2) : i + 2;
      const y0 = ys[tri[0]], y1 = ys[tri[1]], y2 = ys[tri[2]];
      const ymin = Math.min(y0, y1, y2), ymax = Math.max(y0, y1, y2);
      for (let k = 0; k < heights.length; k++) {
        const h = heights[k];
        if (h < ymin || h > ymax) continue;
        for (let e = 0; e < 3; e++) {
          const i0 = tri[e], i1 = tri[(e + 1) % 3];
          const ya = ys[i0], yb = ys[i1];
          if ((ya - h) * (yb - h) > 0 || ya === yb) continue;
          const x = xs[i0] + ((h - ya) / (yb - ya)) * (xs[i1] - xs[i0]);
          if (x < lo[k]) lo[k] = x;
          if (x > hi[k]) hi[k] = x;
          hit[k]++;
        }
      }
    }
  }

  const TOL = { hard: 55, soft: 90, tongue: 250 };
  const rows = [];
  PLATE.silhouette.forEach(([h, plateW, grade], k) => {
    const modelW = hit[k] ? hi[k] - lo[k] : 0;
    const dev = Math.round((modelW - plateW) * 1000);
    rows.push({
      h, plateW, modelW: +modelW.toFixed(3), dev, tol: TOL[grade], grade,
      counted: grade !== 'tongue',
      ok: Math.abs(dev) <= TOL[grade], samples: hit[k],
    });
  });
  const counted = rows.filter((r) => r.counted);
  return { rows, within: counted.filter((r) => r.ok).length, total: counted.length };
}

/** Read off the plate, one row per feature. `state` is the honest verdict. */
export const CONFORMANCE = [
  { feature: 'Bell silhouette: 0.42 m shoulders to 0.83 m across the sleeves', state: 'built',
    detail: 'The plate widens all the way down to 0.66 m above the sole and only then narrows. Measured against the plate row by row in the silhouette table above; v1 inverted this and read as a cone.' },
  { feature: 'Blank clay tablet fired into the chest', state: 'built',
    detail: '0.246 \u00d7 0.215 m at 1.289 m in a raised rim, carried on two straps over the shoulders. The face is left blank: the unfinished name is the whole subject.' },
  { feature: 'Ember burning behind the tablet', state: 'built',
    detail: 'The plate\u2019s warm pixels sit outside the plaque (1.172\u20131.388 m), so the slivers are behind the rim with a spill below, not on the face.' },
  { feature: 'Torn pendant hems on every layer', state: 'built',
    detail: 'Mantle, under-layer, sleeves, apron, sash tail and cowl fold each carry their own tongue set at their own height, which is why the plate\u2019s hem reads as several torn edges rather than one.' },
  { feature: 'Bell sleeves open at the front, hands hanging clear', state: 'built',
    detail: 'Drape from the shoulder to 0.36 m, outer edge 0.417 m from centre, front opening below the elbow. The hands read because the cloth is behind them.' },
  { feature: 'Ash-cured head, face exposed, eyes closed, chin down', state: 'built',
    detail: 'Sculpted head with the lids closed over the sockets, under a full ash shell with the face oval and neck hole cut out of it. Chin held 0.20 rad down as a rest pose, not an animation frame.' },
  { feature: 'Rust-ochre inner tunic behind the open mantle', state: 'built',
    detail: 'The only second colour on the plate. 0.230 m wide apron over a darker column, with the grey drape that crosses it.' },
  { feature: 'Wrapped cowl and waist sash', state: 'built',
    detail: 'Helical passes, so each wrap overlaps the one beneath. v1 used tori, and a torus cannot overlap itself.' },
  { feature: 'Soft flat boots, blunt toe, one foot turned right out', state: 'built',
    detail: '0.245 \u00d7 0.115 m lofted last; the plate\u2019s left boot points nearly sideways and the model keeps that asymmetry.' },
  { feature: 'Layers that stay in order', state: 'built',
    detail: 'Ten pairs audited on the built mesh, all clear: apron 48 mm inside the mantle, cross drape 19 mm, tunic column 15 mm inside the under-layer, sash 8 mm outside the robe it wraps, tablet 19 mm proud, harness 10 mm over. Measured per height AND angle bin, and printed in the panel above rather than asserted here.' },
  { feature: 'Cloth kept out of the body while moving', state: 'built',
    detail: 'Nine body capsules collide against the spring particles after the length constraint, so a swinging leg displaces the hem rather than passing through it. The layer stack governs the rest pose; this governs every pose after it.' },
  { feature: 'The plate’s own value range, not a bone-white statue', state: 'built',
    detail: 'Every material takes its albedo level from the measured mean of its own crop — trousers 0.042, boots 0.066, mantle 0.076, sash 0.132, tunic 0.154, crust 0.189, skin 0.241, tablet 0.353. A single LIFT constant compensates for the render’s dimmer key and nothing else, so the better-than-8:1 spread the plate draws survives into the mesh instead of collapsing to one pale band.' },
  { feature: 'Crazed crack network across every surface', state: 'built',
    detail: 'Now carried three ways: shallow ridge relief in the geometry, a normal map by Sobel off the plate, and the plate\u2019s own albedo. v1 had albedo only, which is why it looked like a smooth cone in a cracked photograph.' },
  { feature: 'Smoke off the shoulders and crown', state: 'built',
    detail: 'Eight alpha plumes at variant 0. Excluded from the height measurement, because they are not the figure.' },
  { feature: 'Skinned mesh', state: 'built',
    detail: 'The sections are now bound to a real THREE.Skeleton — seventeen body bones plus twenty-two cloth bones — with weights solved automatically from a field of capsule influences. The sleeve bends at the elbow it covers, and the neck deforms under the bowed head. This was a stated deviation until the arms gave it away.' },
  { feature: 'Cloth that lags, swings and settles', state: 'built',
    detail: 'The robe hem hangs on eight two-segment spring chains, each sleeve drape on one, plus the cowl fold and sash tail. Verlet with gravity, inertia from the body’s own motion, a length constraint and a 0.42 rad angle limit, tuned stiff and heavily damped because ash-cured sacking is dead weight, not silk. Watch the resolve and death clips.' },
  { feature: 'Face detail that survives at viewing size', state: 'built',
    detail: 'Brow ridge and supraorbital shelf, orbital socket and lateral rim, closed lid dome with crease and lash seam, tear trough, medial canthus, nasal root, dorsum, tip, alae and nostril sills, philtrum ridges, cupid’s bow, vermillion borders, mentolabial sulcus, malar eminence, submalar and temporal hollows, zygomatic arch, masseter, gonial angle, nasolabial and marionette folds, crow’s feet, forehead lines, and pore relief masked away from the lids and lips where it would eat them.' },
  { feature: 'Ears', state: 'absent',
    detail: 'Built in kit/hm-face.js and deliberately not mounted: on the plate the ash wrap covers the cranium past the ear line, so an ear here would only intersect the shell hiding it.' },
  { feature: 'Fingernails and tablet lettering', state: 'absent',
    detail: 'Below the resolution this subject is used at, and the tablet is blank by design.' },
  { feature: 'Torso as an archive of cracked clay drawers', state: 'refused',
    detail: 'Required by the family prompt (rank 1). Absent from this subject\u2019s plate (rank 2) and therefore absent here. The model conforms to the plate and REFUSES against the prompt. Design authority must settle which governs an individual form.' },
];
