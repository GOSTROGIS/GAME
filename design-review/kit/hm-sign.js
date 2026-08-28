/* Signage, wayfinding and civic display — parametric families.
 *
 * The gap this closes: a settlement with no signage cannot be read. A player
 * needs to know which building is the alehouse, which road leads out, how far
 * the next hold is, and what the watch has posted. Signage is also the cheapest
 * way to put language and heraldry into a world without writing a UI for it.
 *
 * Grounded in the world's own institutions. Hearthmere records names on clay,
 * so its notices are clay tablets and nailed cloth rather than printed paper.
 * The Vigil rings bells, so its standards carry bell devices. A gibbet exists
 * because the march is lawless, not because dark fantasy expects one.
 */
import { THREE, MAT, rnd, jitter, lean, part, lathe, limb, torus, cone, cyl, ico, seat } from './hm-core.js';
import { axesOf } from './hm-steam.js';

const box = (w, h, d, ws = 1, hs = 1, ds = 1) => new THREE.BoxGeometry(w, h, d, ws, hs, ds);
const T = Math.PI * 2;
const tube = (pts, r, rad = 6) =>
  new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]))), Math.max(6, pts.length * 3), r, rad, false);

const M = (name, color, rough, metal = 0, extra) => {
  const m = new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(color), roughness: rough, metalness: metal }, extra || {}));
  m.name = name;
  return m;
};
export const SIGN = {
  board: M('sign-board', '#3a3025', 0.86, 0.01),
  boardPale: M('sign-board-pale', '#5a4c39', 0.88, 0.01),
  paint: M('sign-paint', '#683f37', 0.8, 0.0),
  paintBone: M('sign-paint-bone', '#a9a291', 0.82, 0.0),
  gilt: M('sign-gilt', '#c18b46', 0.42, 0.32),
  cloth: M('banner-cloth', '#683f37', 0.95, 0.0, { side: THREE.DoubleSide }),
  clothPale: M('banner-cloth-pale', '#7b7466', 0.95, 0.0, { side: THREE.DoubleSide }),
  clothDark: M('banner-cloth-dark', '#2f2a2a', 0.95, 0.0, { side: THREE.DoubleSide }),
  notice: M('nailed-notice', '#9a9080', 0.94, 0.0, { side: THREE.DoubleSide }),
  ink: M('sign-ink', '#1b1e21', 0.6, 0.0),
  glass: M('lantern-pane', '#6f8f9b', 0.2, 0.02, { transparent: true, opacity: 0.42 }),
  flame: M('lantern-flame', '#5a2a17', 0.7, 0.0, { emissive: new THREE.Color('#bd6135'), emissiveIntensity: 1.6 }),
  bone: M('gibbet-bone', '#a9a291', 0.9, 0.0),
};

/* A cloth panel that hangs: a subdivided plane with a catenary sag baked into
   the top edge and a slack ripple through the body. Cloth is never a flat quad
   in this kit — a flat quad reads as painted board. */
function clothPanel(w, h, segW, segH, slack, tear) {
  const geo = box(w, h, 0.0022, segW, segH, 1);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const tx = p.getX(i) / w;
    const ty = (p.getY(i) + h / 2) / h;
    const sag = (1 - Math.cos(tx * Math.PI * 2)) * 0.5 * slack * h * 0.14;
    p.setY(i, p.getY(i) - sag * (0.35 + ty * 0.65));
    p.setZ(i, p.getZ(i) + Math.sin(tx * 7 + ty * 3) * slack * w * 0.035 * (1 - ty * 0.4));
    if (tear && ty < 0.2 && Math.abs(tx) > 0.28) p.setY(i, p.getY(i) + (0.2 - ty) * h * tear * 0.9);
  }
  p.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/* ------------------------------------------------------- HANGING SHOP SIGN */
export const SHOPSIGN_AXES = { trade: 6, boardForm: 4, bracket: 3, chain: 3, lamp: 2, askew: 2 };
export function hangingShopSign(variant = 0) {
  const A = axesOf(variant, SHOPSIGN_AXES);
  const rand = rnd(variant * 1013 + 5);
  const g = new THREE.Group();
  const wallH = 1.5;
  g.add(part(box(0.09, wallH, 0.5), MAT.slateDry, 'wall-stub', { pos: [-0.045, wallH / 2, 0] }));
  const reach = 0.34 + A.bracket * 0.09;
  const armY = wallH * 0.82;
  g.add(part(cyl(0.014, 0.017, reach, 8), MAT.pittedIron, 'bracket-arm', { pos: [reach / 2, armY, 0], rot: [0, 0, Math.PI / 2] }));
  g.add(part(box(0.05, 0.05, 0.05), MAT.pittedIron, 'bracket-plate', { pos: [0.006, armY, 0] }));
  if (A.bracket) {
    g.add(part(cyl(0.009, 0.011, reach * 0.8, 7), MAT.pittedIron, 'bracket-stay', { pos: [reach * 0.34, armY - reach * 0.28, 0], rot: [0, 0, -0.85] }));
    for (let i = 0; i < A.bracket; i++) {
      g.add(part(torus(0.03 + i * 0.012, 0.005, 4, 12, Math.PI * 1.4), MAT.pittedIron, 'scrollwork-' + i, { pos: [reach * (0.2 + i * 0.16), armY - 0.05 - i * 0.02, 0], rot: [Math.PI / 2, 0.4, 0] }));
    }
  }
  g.add(part(cone(0.02, 0.05, 6), MAT.warmBrass, 'bracket-finial', { pos: [reach + 0.02, armY, 0], rot: [0, 0, -Math.PI / 2] }));
  const chainL = 0.1 + A.chain * 0.05;
  const hangX = reach * 0.72;
  const boardW = 0.34 + A.boardForm * 0.06;
  const boardH = boardW * (A.boardForm === 2 ? 1.15 : 0.62);
  const tilt = A.askew ? 0.14 : 0;
  [-1, 1].forEach((s, si) => {
    const x0 = hangX + s * boardW * 0.32;
    const links = 3 + A.chain;
    for (let k = 0; k < links; k++) {
      const t = k / links;
      g.add(part(torus(0.011, 0.0028, 3, 8), MAT.pittedIron, 'link-' + si + '-' + k, {
        pos: [x0 + (A.askew ? s * t * 0.01 : 0), armY - 0.02 - t * chainL, 0],
        rot: [k % 2 ? 0 : Math.PI / 2, 0, 0],
      }));
    }
    g.add(part(torus(0.014, 0.003, 3, 10), MAT.pittedIron, 'eye-' + si, { pos: [x0, armY - 0.02 - chainL, 0], rot: [Math.PI / 2, 0, 0] }));
  });
  const boardY = armY - 0.04 - chainL - boardH / 2;
  const boardGeo = A.boardForm === 3
    ? lathe([[boardW * 0.5, 0], [boardW * 0.5, boardH * 0.7], [boardW * 0.3, boardH], [0, boardH]], 14)
    : box(boardW, boardH, 0.022, 3, 2, 1);
  if (A.boardForm !== 3) jitter(boardGeo, 0.003, rand);
  g.add(part(boardGeo, SIGN.board, 'sign-board', { pos: [hangX, A.boardForm === 3 ? boardY - boardH / 2 : boardY, 0], rot: [0, 0, tilt] }));
  g.add(part(box(boardW * 0.9, boardH * 0.84, 0.002), A.trade % 2 ? SIGN.paintBone : SIGN.paint, 'board-field', { pos: [hangX, boardY, 0.013], rot: [0, 0, tilt] }));
  for (let e = 0; e < 2; e++) g.add(part(box(boardW, 0.016, 0.028), MAT.pittedIron, 'board-strap-' + e, { pos: [hangX, boardY + (e ? -1 : 1) * boardH * 0.42, 0], rot: [0, 0, tilt] }));
  // The trade device: an abstract mark, not an illustration — six silhouettes.
  const dev = new THREE.Group();
  const dr = Math.min(boardW, boardH) * 0.3;
  if (A.trade === 0) { dev.add(part(lathe([[dr * 0.2, 0], [dr, dr * 0.9], [dr * 0.86, dr * 1.05], [dr * 0.3, dr * 1.1]], 12), SIGN.gilt, 'device-bell')); dev.add(part(cyl(dr * 0.1, dr * 0.1, dr * 0.3, 6), SIGN.gilt, 'device-bell-stem', { pos: [0, dr * 1.22, 0] })); }
  else if (A.trade === 1) { dev.add(part(box(dr * 0.22, dr * 1.7, dr * 0.09), SIGN.gilt, 'device-key-shank', { pos: [0, dr * 0.85, 0] })); dev.add(part(torus(dr * 0.34, dr * 0.09, 4, 12), SIGN.gilt, 'device-key-bow', { pos: [0, dr * 1.9, 0] })); dev.add(part(box(dr * 0.5, dr * 0.2, dr * 0.09), SIGN.gilt, 'device-key-ward', { pos: [dr * 0.24, dr * 0.16, 0] })); }
  else if (A.trade === 2) { dev.add(part(lathe([[dr * 0.7, 0], [dr * 0.8, dr * 0.9], [dr * 0.5, dr * 1.05], [dr * 0.55, dr * 1.2]], 12), SIGN.gilt, 'device-tankard')); dev.add(part(torus(dr * 0.32, dr * 0.08, 4, 10, Math.PI * 1.2), SIGN.gilt, 'device-tankard-handle', { pos: [dr * 0.85, dr * 0.6, 0], rot: [0, Math.PI / 2, 1.2] })); }
  else if (A.trade === 3) { dev.add(part(box(dr * 0.16, dr * 1.5, dr * 0.1), SIGN.gilt, 'device-hammer-haft', { pos: [0, dr * 0.75, 0] })); dev.add(part(box(dr * 0.9, dr * 0.34, dr * 0.3), SIGN.gilt, 'device-hammer-head', { pos: [0, dr * 1.6, 0] })); }
  else if (A.trade === 4) { for (let k = 0; k < 3; k++) dev.add(part(cone(dr * 0.2, dr * 0.9, 5), SIGN.gilt, 'device-sheaf-' + k, { pos: [(k - 1) * dr * 0.32, dr * 0.6, 0], rot: [0, 0, (k - 1) * 0.24] })); dev.add(part(box(dr * 1, dr * 0.14, dr * 0.1), SIGN.gilt, 'device-sheaf-tie', { pos: [0, dr * 0.34, 0] })); }
  else { dev.add(part(lathe([[dr * 0.1, 0], [dr * 0.55, dr * 0.4], [dr * 0.5, dr * 1.2], [dr * 0.2, dr * 1.5]], 11), SIGN.gilt, 'device-flask')); dev.add(part(cyl(dr * 0.16, dr * 0.16, dr * 0.2, 8), SIGN.gilt, 'device-flask-neck', { pos: [0, dr * 1.58, 0] })); }
  dev.position.set(hangX, boardY - dr * 0.6, 0.02);
  dev.rotation.z = tilt;
  g.add(dev);
  if (A.lamp) {
    const lx = hangX + boardW * 0.62;
    g.add(part(cyl(0.006, 0.006, 0.1, 6), MAT.pittedIron, 'lamp-hook', { pos: [lx, armY - 0.06, 0] }));
    g.add(part(box(0.05, 0.07, 0.05), MAT.pittedIron, 'lamp-frame', { pos: [lx, armY - 0.15, 0] }));
    g.add(part(box(0.042, 0.06, 0.042), SIGN.glass, 'lamp-pane', { pos: [lx, armY - 0.15, 0] }));
    g.add(part(ico(0.011, 0), SIGN.flame, 'lamp-flame', { pos: [lx, armY - 0.16, 0] }));
    g.add(part(cone(0.032, 0.026, 6), MAT.pittedIron, 'lamp-hood', { pos: [lx, armY - 0.105, 0] }));
  }
  return seat(g);
}

/* --------------------------------------------------------------- NOTICE POST */
export const NOTICE_AXES = { posts: 3, boardForm: 3, notices: 4, nails: 2, roof: 3, height: 3 };
export function noticePost(variant = 0) {
  const A = axesOf(variant, NOTICE_AXES);
  const rand = rnd(variant * 733 + 11);
  const g = new THREE.Group();
  const H = 1.5 + A.height * 0.35;
  const W = A.posts === 0 ? 0.36 : 0.62 + A.posts * 0.14;
  const posts = 1 + A.posts;
  for (let i = 0; i < posts; i++) {
    const x = posts === 1 ? 0 : -W / 2 + (W / (posts - 1)) * i;
    g.add(part(limb(0.045, 0.058, H, 7, 3), MAT.weatheredTimber, 'post-' + i, { pos: [x, H / 2, 0], rot: [0, 0, (rand() - 0.5) * 0.03] }));
    g.add(part(lathe([[0.075, 0], [0.06, 0.03], [0, 0.04]], 9), MAT.slateDry, 'post-footing-' + i, { pos: [x, 0, 0] }));
  }
  const bw = A.boardForm === 0 ? W * 0.9 : W * 1.05;
  const bh = 0.55 + A.boardForm * 0.16;
  const by = H * 0.62;
  if (A.boardForm === 2) {
    for (let k = 0; k < 4; k++) g.add(part(box(bw, bh / 4 - 0.006, 0.02), MAT.darkOak, 'plank-' + k, { pos: [0, by - bh / 2 + (bh / 4) * (k + 0.5), 0], rot: [0, 0, (rand() - 0.5) * 0.012] }));
  } else {
    g.add(part(box(bw, bh, 0.022, 3, 3, 1), A.boardForm ? MAT.darkOak : MAT.weatheredTimber, 'notice-board', { pos: [0, by, 0] }));
  }
  [-1, 1].forEach((s, i) => g.add(part(box(0.03, bh + 0.03, 0.03), MAT.darkOak, 'board-frame-' + i, { pos: [s * bw / 2, by, 0] })));
  const n = 1 + A.notices;
  for (let i = 0; i < n; i++) {
    const nw = bw * (0.22 + rand() * 0.2), nh = bh * (0.2 + rand() * 0.28);
    const nx = -bw * 0.36 + rand() * bw * 0.72, ny = by - bh * 0.32 + rand() * bh * 0.6;
    const sheet = box(nw, nh, 0.0016, 3, 3, 1);
    const p = sheet.attributes.position;
    for (let v = 0; v < p.count; v++) {
      const ty = (p.getY(v) + nh / 2) / nh;
      p.setZ(v, p.getZ(v) + (1 - ty) * nh * 0.14 * (0.4 + rand() * 0.2));
    }
    p.needsUpdate = true;
    sheet.computeVertexNormals();
    const clay = i % 3 === 2;
    g.add(part(clay ? box(nw * 0.7, nh * 0.7, 0.012) : sheet, clay ? MAT.firedClay : SIGN.notice, 'notice-' + i, { pos: [nx, ny, 0.014], rot: [0, 0, (rand() - 0.5) * 0.16] }));
    for (let l = 0; l < 3; l++) g.add(part(box(nw * 0.62, 0.0016, 0.0008), SIGN.ink, 'notice-line-' + i + '-' + l, { pos: [nx, ny + nh * 0.16 - l * nh * 0.16, 0.0155] }));
    if (A.nails) for (let c = 0; c < 2; c++) g.add(part(cyl(0.0035, 0.0035, 0.006, 6), MAT.pittedIron, 'nail-' + i + '-' + c, { pos: [nx + (c ? 1 : -1) * nw * 0.4, ny + nh * 0.4, 0.017], rot: [Math.PI / 2, 0, 0] }));
  }
  if (A.roof) {
    const rw = bw + 0.1;
    const rd = 0.16 + A.roof * 0.05;
    [-1, 1].forEach((s, i) => g.add(part(box(rw, 0.014, rd), MAT.darkOak, 'roof-slope-' + i, { pos: [0, by + bh / 2 + 0.06, s * rd * 0.42], rot: [s * 0.55, 0, 0] })));
    g.add(part(box(rw, 0.02, 0.02), MAT.darkOak, 'roof-ridge', { pos: [0, by + bh / 2 + 0.1, 0] }));
    if (A.roof > 1) for (let k = 0; k < 5; k++) g.add(part(box(rw * 0.9, 0.006, rd * 0.3), MAT.slateDry, 'shingle-' + k, { pos: [0, by + bh / 2 + 0.075 - k * 0.008, (k % 2 ? 1 : -1) * rd * (0.18 + k * 0.04)], rot: [(k % 2 ? 1 : -1) * 0.55, 0, 0] }));
  }
  return seat(g);
}

/* ---------------------------------------------------------------- FINGER POST */
export const FINGERPOST_AXES = { arms: 4, armForm: 3, cap: 3, height: 3, plaque: 2, lean: 3 };
export function fingerPost(variant = 0) {
  const A = axesOf(variant, FINGERPOST_AXES);
  const rand = rnd(variant * 941 + 17);
  const g = new THREE.Group();
  const H = 1.7 + A.height * 0.4;
  const lean0 = (A.lean - 1) * 0.05;
  const post = limb(0.05, 0.07, H, 9, 4);
  jitter(post, 0.006, rand);
  g.add(part(post, MAT.weatheredTimber, 'post', { pos: [0, H / 2, 0], rot: [0, 0, lean0] }));
  g.add(part(lathe([[0.11, 0], [0.09, 0.05], [0.06, 0.07]], 10), MAT.slateDry, 'cairn-footing'));
  for (let i = 0; i < 4; i++) g.add(part(ico(0.035, 0), MAT.slateDry, 'footing-stone-' + i, { pos: [Math.cos((i / 4) * T) * 0.1, 0.03, Math.sin((i / 4) * T) * 0.1] }));
  const arms = 1 + A.arms;
  for (let i = 0; i < arms; i++) {
    const y = H * (0.62 + i * 0.11);
    const a = (i / arms) * T * 0.7 + rand() * 0.4;
    const L = 0.3 + rand() * 0.12;
    const bh = 0.09 + A.armForm * 0.015;
    const armGroup = new THREE.Group();
    if (A.armForm === 0) {
      armGroup.add(part(box(L, bh, 0.02), SIGN.board, 'arm-board-' + i, { pos: [L / 2, 0, 0] }));
      armGroup.add(part(cone(bh * 0.5, 0.05, 3), SIGN.board, 'arm-point-' + i, { pos: [L + 0.02, 0, 0], rot: [0, 0, -Math.PI / 2] }));
    } else if (A.armForm === 1) {
      const b = box(L, bh, 0.02, 4, 1, 1);
      const p = b.attributes.position;
      for (let v = 0; v < p.count; v++) { const t = (p.getX(v) + L / 2) / L; if (t > 0.78) p.setY(v, p.getY(v) * (1 - (t - 0.78) * 3.4)); }
      p.needsUpdate = true; b.computeVertexNormals();
      armGroup.add(part(b, SIGN.board, 'arm-board-' + i, { pos: [L / 2, 0, 0] }));
    } else {
      armGroup.add(part(box(L, bh, 0.02), SIGN.boardPale, 'arm-board-' + i, { pos: [L / 2, 0, 0] }));
      armGroup.add(part(box(0.03, bh * 1.3, 0.026), MAT.pittedIron, 'arm-shoe-' + i, { pos: [0.012, 0, 0] }));
    }
    for (let l = 0; l < 2; l++) armGroup.add(part(box(L * 0.6, 0.008, 0.0016), SIGN.ink, 'arm-text-' + i + '-' + l, { pos: [L * 0.48, bh * (0.18 - l * 0.34), 0.011] }));
    armGroup.add(part(cyl(0.006, 0.006, 0.08, 6), MAT.pittedIron, 'arm-bolt-' + i, { pos: [0.01, 0, 0], rot: [Math.PI / 2, 0, 0] }));
    armGroup.position.set(Math.sin(lean0) * y, y, 0);
    armGroup.rotation.set(0, a, (rand() - 0.5) * 0.05);
    g.add(armGroup);
  }
  if (A.cap === 0) g.add(part(cone(0.07, 0.09, 7), MAT.weatheredTimber, 'post-cap', { pos: [Math.sin(lean0) * H, H + 0.045, 0] }));
  else if (A.cap === 1) g.add(part(lathe([[0.075, 0], [0.06, 0.03], [0.03, 0.05], [0, 0.055]], 10), MAT.pittedIron, 'post-cap', { pos: [Math.sin(lean0) * H, H, 0] }));
  else { g.add(part(cyl(0.055, 0.06, 0.02, 8), MAT.pittedIron, 'post-collar', { pos: [Math.sin(lean0) * H, H, 0] })); g.add(part(lathe([[0.03, 0], [0.05, 0.04], [0.02, 0.08], [0, 0.09]], 9), MAT.bellBronze, 'post-finial', { pos: [Math.sin(lean0) * H, H + 0.02, 0] })); }
  if (A.plaque) {
    g.add(part(box(0.11, 0.07, 0.008), MAT.bellBronze, 'milepost-plaque', { pos: [Math.sin(lean0) * H * 0.4, H * 0.4, 0.05] }));
    for (let l = 0; l < 2; l++) g.add(part(box(0.07, 0.006, 0.0012), SIGN.ink, 'plaque-line-' + l, { pos: [Math.sin(lean0) * H * 0.4, H * 0.4 + 0.012 - l * 0.022, 0.055] }));
  }
  return seat(g);
}

/* ----------------------------------------------------------------- MILESTONE */
export const MILESTONE_AXES = { form: 4, carve: 4, cap: 3, lean: 3, moss: 2, scale: 2 };
export function milestone(variant = 0) {
  const A = axesOf(variant, MILESTONE_AXES);
  const rand = rnd(variant * 587 + 23);
  const g = new THREE.Group();
  const s = 0.85 + A.scale * 0.35;
  const H = (0.5 + A.form * 0.12) * s;
  const W = H * (0.42 - A.form * 0.04);
  const tilt = (A.lean - 1) * 0.07;
  let stone;
  if (A.form === 0) { stone = box(W, H, W * 0.72, 2, 3, 2); jitter(stone, W * 0.05, rand); }
  else if (A.form === 1) {
    stone = box(W, H, W * 0.7, 2, 4, 2);
    const p = stone.attributes.position;
    for (let v = 0; v < p.count; v++) { const t = (p.getY(v) + H / 2) / H; p.setX(v, p.getX(v) * (1 - t * 0.22)); p.setZ(v, p.getZ(v) * (1 - t * 0.2)); }
    p.needsUpdate = true; stone.computeVertexNormals();
    jitter(stone, W * 0.04, rand);
  } else if (A.form === 2) {
    stone = lathe([[W * 0.5, 0], [W * 0.52, H * 0.5], [W * 0.46, H * 0.86], [W * 0.3, H], [0, H]], 11);
    jitter(stone, W * 0.05, rand);
  } else {
    stone = box(W * 1.1, H, W * 0.5, 2, 3, 1);
    const p = stone.attributes.position;
    for (let v = 0; v < p.count; v++) { const t = (p.getY(v) + H / 2) / H; if (t > 0.7) p.setX(v, p.getX(v) * (1 - (t - 0.7) * 1.5)); }
    p.needsUpdate = true; stone.computeVertexNormals();
    jitter(stone, W * 0.04, rand);
  }
  g.add(part(stone, MAT.springStone, 'milestone', { pos: [0, A.form === 2 ? 0 : H / 2, 0], rot: [tilt * 0.5, rand() * T, tilt] }));
  const face = W * 0.34;
  for (let i = 0; i < A.carve; i++) {
    const cy = H * (0.68 - i * 0.15);
    g.add(part(box(face, H * 0.035, 0.006), MAT.wetSlate, 'carve-line-' + i, { pos: [0, cy, W * 0.36], rot: [tilt * 0.5, 0, tilt] }));
    if (i === 0) for (let k = 0; k < 3; k++) g.add(part(box(0.012, 0.012, 0.005), MAT.wetSlate, 'carve-numeral-' + k, { pos: [-face * 0.3 + k * 0.02, cy - H * 0.09, W * 0.36], rot: [tilt * 0.5, 0, tilt] }));
  }
  if (A.cap === 1) g.add(part(lathe([[W * 0.4, 0], [W * 0.32, W * 0.12], [0, W * 0.2]], 10), MAT.slateDry, 'stone-cap', { pos: [0, H, 0], rot: [tilt * 0.5, 0, tilt] }));
  else if (A.cap === 2) g.add(part(box(W * 1.15, W * 0.14, W * 0.85), MAT.slateDry, 'stone-cap', { pos: [0, H + W * 0.07, 0], rot: [tilt * 0.5, 0, tilt] }));
  if (A.moss) {
    for (let i = 0; i < 6; i++) {
      const a = rand() * T;
      g.add(part(lathe([[W * 0.16, 0], [W * 0.12, 0.006], [0, 0.008]], 8), MAT.graveMoss, 'moss-' + i, { pos: [Math.cos(a) * W * 0.4, H * rand() * 0.5, Math.sin(a) * W * 0.35] }));
    }
    g.add(part(lathe([[W * 0.75, 0], [W * 0.6, 0.012], [0, 0.016]], 12), MAT.graveMoss, 'moss-skirt'));
  }
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * T + rand();
    g.add(part(cone(0.02 * s, 0.07 * s, 5), MAT.reedPale, 'verge-grass-' + i, { pos: [Math.cos(a) * W * 0.8, 0.03, Math.sin(a) * W * 0.8], rot: [rand() * 0.3, a, 0] }));
  }
  return seat(g);
}

/* -------------------------------------------------------------------- BANNER */
export const BANNER_AXES = { length: 4, width: 3, device: 4, fringe: 3, tear: 3, mount: 2 };
export function verticalBanner(variant = 0) {
  const A = axesOf(variant, BANNER_AXES);
  const rand = rnd(variant * 421 + 29);
  const g = new THREE.Group();
  const W = 0.32 + A.width * 0.11;
  const L = 0.9 + A.length * 0.45;
  const topY = L + 0.16;
  if (A.mount) {
    g.add(part(cyl(0.014, 0.016, W * 1.5, 9), MAT.pittedIron, 'mount-bar', { pos: [0, topY, 0], rot: [0, 0, Math.PI / 2] }));
    [-1, 1].forEach((s, i) => g.add(part(cone(0.024, 0.05, 6), MAT.warmBrass, 'bar-finial-' + i, { pos: [s * W * 0.79, topY, 0], rot: [0, 0, s * -Math.PI / 2] })));
    g.add(part(box(0.06, 0.06, 0.05), MAT.pittedIron, 'wall-bracket', { pos: [-W * 0.8, topY, -0.03] }));
  } else {
    g.add(part(box(W * 1.2, 0.03, 0.05), MAT.darkOak, 'batten', { pos: [0, topY, 0] }));
    for (let i = 0; i < 2; i++) g.add(part(torus(0.016, 0.0035, 3, 10), MAT.pittedIron, 'batten-ring-' + i, { pos: [(i ? 1 : -1) * W * 0.42, topY + 0.024, 0], rot: [Math.PI / 2, 0, 0] }));
  }
  const cloth = clothPanel(W, L, 7, 12, 1 + A.tear * 0.25, A.tear * 0.14);
  const mats = [SIGN.cloth, SIGN.clothPale, SIGN.clothDark, SIGN.cloth];
  g.add(part(cloth, mats[A.device], 'banner-cloth', { pos: [0, topY - 0.03 - L / 2, 0] }));
  g.add(part(box(W * 1.01, 0.03, 0.006), SIGN.clothDark, 'banner-header', { pos: [0, topY - 0.03, 0.001] }));
  // Device: an abstract charge built from primitives, four variants.
  const dev = new THREE.Group();
  const dr = W * 0.26;
  if (A.device === 0) { dev.add(part(lathe([[dr * 0.2, 0], [dr, dr * 0.95], [dr * 0.85, dr * 1.1], [dr * 0.3, dr * 1.15]], 12), SIGN.gilt, 'charge-bell')); }
  else if (A.device === 1) { dev.add(part(torus(dr * 0.8, dr * 0.13, 4, 16), SIGN.paintBone, 'charge-ring')); dev.add(part(box(dr * 0.2, dr * 1.5, 0.004), SIGN.paintBone, 'charge-bar')); }
  else if (A.device === 2) { for (let k = 0; k < 3; k++) dev.add(part(cone(dr * 0.28, dr * 0.9, 5), SIGN.gilt, 'charge-flame-' + k, { pos: [(k - 1) * dr * 0.5, dr * 0.45 + (k === 1 ? dr * 0.2 : 0), 0] })); }
  else { dev.add(part(box(dr * 1.3, dr * 0.22, 0.004), SIGN.paintBone, 'charge-chevron-a', { pos: [0, dr * 0.3, 0], rot: [0, 0, 0.5] })); dev.add(part(box(dr * 1.3, dr * 0.22, 0.004), SIGN.paintBone, 'charge-chevron-b', { pos: [0, dr * 0.3, 0], rot: [0, 0, -0.5] })); dev.add(part(box(dr * 1.3, dr * 0.22, 0.004), SIGN.paintBone, 'charge-chevron-c', { pos: [0, -dr * 0.3, 0], rot: [0, 0, 0.5] })); }
  dev.position.set(0, topY - L * 0.36, 0.014);
  g.add(dev);
  if (A.fringe) {
    const n = 6 + A.fringe * 4;
    for (let i = 0; i < n; i++) {
      const x = -W / 2 + (W / (n - 1)) * i;
      const fl = 0.035 + rand() * 0.03 - (A.tear ? Math.abs(x) * 0.06 : 0);
      g.add(part(tube([[x, topY - 0.03 - L, 0], [x, topY - 0.03 - L - fl, 0.004]], 0.0022, 4), A.fringe === 2 ? SIGN.gilt : SIGN.clothPale, 'fringe-' + i, {}));
      if (A.fringe > 1 && i % 3 === 0) g.add(part(ico(0.008, 0), SIGN.gilt, 'fringe-bead-' + i, { pos: [x, topY - 0.03 - L - fl, 0.004] }));
    }
  }
  return seat(g);
}

/* ------------------------------------------------------------- PENNANT LINE */
export const PENNANT_AXES = { span: 4, count: 4, shape: 3, sag: 3, mount: 2, gap: 2 };
export function pennantLine(variant = 0) {
  const A = axesOf(variant, PENNANT_AXES);
  const rand = rnd(variant * 359 + 35);
  const g = new THREE.Group();
  const span = 1.4 + A.span * 0.7;
  const H = 1.7;
  const sag = 0.1 + A.sag * 0.11;
  if (A.mount) {
    [-1, 1].forEach((s, i) => {
      g.add(part(limb(0.03, 0.042, H, 8, 3), MAT.weatheredTimber, 'pole-' + i, { pos: [s * span / 2, H / 2, 0], rot: [0, 0, s * 0.03] }));
      g.add(part(lathe([[0.07, 0], [0.055, 0.04], [0, 0.05]], 9), MAT.slateDry, 'pole-base-' + i, { pos: [s * span / 2, 0, 0] }));
      g.add(part(cone(0.032, 0.06, 6), MAT.pittedIron, 'pole-cap-' + i, { pos: [s * span / 2, H + 0.03, 0] }));
    });
  } else {
    [-1, 1].forEach((s, i) => g.add(part(box(0.06, 0.06, 0.05), MAT.slateDry, 'wall-anchor-' + i, { pos: [s * span / 2, H, -0.03] })));
  }
  const linePts = [];
  for (let k = 0; k <= 10; k++) {
    const t = k / 10;
    const x = -span / 2 + t * span;
    linePts.push([x, H - Math.sin(t * Math.PI) * sag, 0]);
  }
  g.add(part(tube(linePts, 0.0045, 5), MAT.ropeHemp, 'line', {}));
  const n = 4 + A.count * 3;
  const mats = [SIGN.cloth, SIGN.clothPale, SIGN.clothDark];
  for (let i = 0; i < n; i++) {
    if (A.gap && i % 4 === 3) continue;
    const t = (i + 0.5) / n;
    const x = -span / 2 + t * span;
    const y = H - Math.sin(t * Math.PI) * sag;
    const pw = 0.09 + rand() * 0.03;
    const pl = 0.14 + rand() * 0.07;
    const mat = mats[i % 3];
    if (A.shape === 0) {
      const tri = new THREE.BufferGeometry();
      const v = new Float32Array([-pw / 2, 0, 0, pw / 2, 0, 0, 0, -pl, 0.01]);
      tri.setAttribute('position', new THREE.BufferAttribute(v, 3));
      tri.computeVertexNormals();
      g.add(part(tri, mat, 'pennant-' + i, { pos: [x, y - 0.006, 0], rot: [0, 0, (rand() - 0.5) * 0.2] }));
    } else if (A.shape === 1) {
      g.add(part(clothPanel(pw, pl, 3, 4, 1.4, 0), mat, 'pennant-' + i, { pos: [x, y - 0.006 - pl / 2, 0], rot: [0, (rand() - 0.5) * 0.5, (rand() - 0.5) * 0.16] }));
    } else {
      g.add(part(clothPanel(pw, pl * 0.8, 3, 3, 1.2, 0.3), mat, 'pennant-' + i, { pos: [x, y - 0.006 - pl * 0.4, 0], rot: [0, (rand() - 0.5) * 0.5, (rand() - 0.5) * 0.16] }));
      g.add(part(cone(pw * 0.16, pl * 0.24, 3), mat, 'pennant-tail-' + i, { pos: [x, y - pl * 0.9, 0], rot: [Math.PI, 0, 0] }));
    }
    g.add(part(torus(0.005, 0.0016, 3, 7), MAT.ropeHemp, 'tie-' + i, { pos: [x, y, 0], rot: [0, Math.PI / 2, 0] }));
  }
  return seat(g);
}

/* ------------------------------------------------------------ GUILD STANDARD */
export const STANDARD_AXES = { finial: 4, banner: 3, crossbar: 3, tassel: 3, height: 3, base: 2 };
export function guildStandard(variant = 0) {
  const A = axesOf(variant, STANDARD_AXES);
  const rand = rnd(variant * 811 + 41);
  const g = new THREE.Group();
  const H = 2.1 + A.height * 0.5;
  g.add(part(limb(0.022, 0.03, H, 10, 4), MAT.darkOak, 'staff', { pos: [0, H / 2, 0] }));
  for (let i = 0; i < 3; i++) g.add(part(torus(0.032, 0.006, 3, 12), MAT.warmBrass, 'staff-ferrule-' + i, { pos: [0, H * (0.18 + i * 0.24), 0], rot: [Math.PI / 2, 0, 0] }));
  if (A.base === 0) {
    g.add(part(lathe([[0.16, 0], [0.14, 0.05], [0.08, 0.1], [0.04, 0.13]], 12), MAT.slateDry, 'stone-socket'));
  } else {
    g.add(part(cyl(0.1, 0.13, 0.06, 10), MAT.pittedIron, 'iron-shoe', { pos: [0, 0.03, 0] }));
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * T;
      g.add(part(box(0.02, 0.03, 0.14), MAT.pittedIron, 'shoe-foot-' + i, { pos: [Math.cos(a) * 0.1, 0.015, Math.sin(a) * 0.1], rot: [0, -a, 0] }));
    }
  }
  const cbY = H * 0.84;
  const cbW = 0.3 + A.crossbar * 0.11;
  if (A.crossbar) {
    g.add(part(cyl(0.012, 0.014, cbW, 8), MAT.warmBrass, 'crossbar', { pos: [0, cbY, 0], rot: [0, 0, Math.PI / 2] }));
    [-1, 1].forEach((s, i) => g.add(part(ico(0.022, 1), MAT.warmBrass, 'crossbar-knop-' + i, { pos: [s * cbW / 2, cbY, 0] })));
  }
  const bw = cbW * 0.86, bl = 0.5 + A.banner * 0.28;
  g.add(part(clothPanel(bw, bl, 6, 9, 1.2, 0.1), A.banner === 2 ? SIGN.clothDark : SIGN.cloth, 'standard-cloth', { pos: [0, cbY - 0.02 - bl / 2, 0.006] }));
  g.add(part(box(bw, 0.022, 0.008), SIGN.gilt, 'standard-header', { pos: [0, cbY - 0.02, 0.008] }));
  for (let k = 0; k < 3; k++) g.add(part(torus(bw * 0.12, bw * 0.03, 4, 12), SIGN.gilt, 'standard-charge-' + k, { pos: [0, cbY - bl * (0.28 + k * 0.2), 0.012] }));
  if (A.finial === 0) g.add(part(cone(0.03, 0.14, 7), MAT.warmBrass, 'finial-spear', { pos: [0, H + 0.07, 0] }));
  else if (A.finial === 1) { g.add(part(lathe([[0.028, 0], [0.05, 0.05], [0.045, 0.09], [0.02, 0.12], [0, 0.13]], 12), MAT.bellBronze, 'finial-bell', { pos: [0, H, 0] })); g.add(part(ico(0.012, 1), MAT.pittedIron, 'finial-clapper', { pos: [0, H + 0.03, 0] })); }
  else if (A.finial === 2) { g.add(part(torus(0.05, 0.012, 4, 16), MAT.warmBrass, 'finial-ring', { pos: [0, H + 0.05, 0] })); g.add(part(box(0.014, 0.1, 0.014), MAT.warmBrass, 'finial-cross', { pos: [0, H + 0.05, 0] })); }
  else { for (let k = 0; k < 4; k++) g.add(part(cone(0.016, 0.07, 4), MAT.warmBrass, 'finial-blade-' + k, { pos: [0, H + 0.045, 0], rot: [0, (k / 4) * T, 0.5] })); }
  for (let i = 0; i < A.tassel; i++) {
    const s = i === 0 ? 0 : (i === 1 ? -1 : 1);
    const tx = s * cbW * 0.42;
    const ty = cbY - 0.02;
    g.add(part(tube([[tx, ty, 0], [tx + s * 0.02, ty - 0.06, 0.01]], 0.003, 4), SIGN.gilt, 'tassel-cord-' + i, {}));
    g.add(part(lathe([[0.006, 0], [0.018, 0.012], [0.014, 0.05], [0, 0.055]], 9), SIGN.gilt, 'tassel-head-' + i, { pos: [tx + s * 0.02, ty - 0.115, 0.01] }));
    for (let k = 0; k < 5; k++) g.add(part(tube([[tx + s * 0.02, ty - 0.11, 0.01], [tx + s * 0.02 + Math.cos((k / 5) * T) * 0.012, ty - 0.15, 0.01 + Math.sin((k / 5) * T) * 0.012]], 0.0016, 4), SIGN.gilt, 'tassel-strand-' + i + '-' + k, {}));
  }
  return seat(g);
}

/* -------------------------------------------------------------------- GIBBET */
export const GIBBET_AXES = { cageForm: 3, ribs: 4, arm: 3, chain: 3, occupied: 2, height: 3 };
export function gibbet(variant = 0) {
  const A = axesOf(variant, GIBBET_AXES);
  const rand = rnd(variant * 1097 + 47);
  const g = new THREE.Group();
  const H = 2.4 + A.height * 0.6;
  const post = limb(0.07, 0.1, H, 8, 4);
  jitter(post, 0.008, rand);
  g.add(part(post, MAT.weatheredTimber, 'gibbet-post', { pos: [0, H / 2, 0] }));
  g.add(part(box(0.34, 0.1, 0.34), MAT.slateDry, 'post-base', { pos: [0, 0.05, 0] }));
  for (let i = 0; i < 4; i++) g.add(part(ico(0.05, 0), MAT.slateDry, 'base-stone-' + i, { pos: [Math.cos((i / 4) * T) * 0.2, 0.04, Math.sin((i / 4) * T) * 0.2] }));
  const reach = 0.55 + A.arm * 0.18;
  const armY = H * 0.92;
  g.add(part(box(reach, 0.075, 0.075), MAT.weatheredTimber, 'gibbet-arm', { pos: [reach / 2 - 0.03, armY, 0] }));
  g.add(part(box(0.09, 0.09, 0.09), MAT.pittedIron, 'arm-collar', { pos: [0, armY, 0] }));
  if (A.arm) g.add(part(box(0.05, 0.05, reach * 0.62), MAT.weatheredTimber, 'arm-knee', { pos: [reach * 0.3, armY - reach * 0.24, 0], rot: [0, Math.PI / 2, -0.78] }));
  const chainL = 0.2 + A.chain * 0.11;
  const hx = reach * 0.82;
  for (let k = 0; k < 3 + A.chain * 2; k++) {
    const t = k / (3 + A.chain * 2);
    g.add(part(torus(0.019, 0.0055, 4, 9), MAT.pittedIron, 'chain-link-' + k, { pos: [hx, armY - 0.05 - t * chainL, 0], rot: [k % 2 ? 0 : Math.PI / 2, 0, 0] }));
  }
  const cageTop = armY - 0.05 - chainL;
  const cH = 0.6 + A.cageForm * 0.14;
  const cR = 0.17 + A.cageForm * 0.02;
  g.add(part(torus(cR * 0.5, 0.012, 4, 12), MAT.pittedIron, 'cage-hoop-top', { pos: [hx, cageTop, 0], rot: [Math.PI / 2, 0, 0] }));
  const ribs = 4 + A.ribs * 2;
  for (let i = 0; i < ribs; i++) {
    const a = (i / ribs) * T;
    const bulge = A.cageForm === 0 ? 1 : A.cageForm === 1 ? 1.25 : 0.85;
    const pts = [
      [hx + Math.cos(a) * cR * 0.5, cageTop, Math.sin(a) * cR * 0.5],
      [hx + Math.cos(a) * cR * bulge, cageTop - cH * 0.42, Math.sin(a) * cR * bulge],
      [hx + Math.cos(a) * cR * 0.75, cageTop - cH * 0.82, Math.sin(a) * cR * 0.75],
      [hx + Math.cos(a) * cR * 0.22, cageTop - cH, Math.sin(a) * cR * 0.22],
    ];
    g.add(part(tube(pts, 0.0075, 5), MAT.pittedIron, 'cage-rib-' + i, {}));
  }
  for (let k = 0; k < 2 + A.cageForm; k++) {
    const y = cageTop - cH * (0.25 + k * 0.26);
    const r = cR * (A.cageForm === 1 ? 1.2 : 0.95) * (1 - k * 0.1);
    g.add(part(torus(r, 0.008, 4, 16), MAT.pittedIron, 'cage-band-' + k, { pos: [hx, y, 0], rot: [Math.PI / 2, 0, 0] }));
  }
  g.add(part(lathe([[cR * 0.22, 0], [cR * 0.3, 0.012], [cR * 0.1, 0.02]], 11), MAT.pittedIron, 'cage-floor', { pos: [hx, cageTop - cH, 0] }));
  if (A.occupied) {
    g.add(part(ico(0.075, 1), SIGN.bone, 'remains-skull', { pos: [hx, cageTop - cH * 0.3, 0] }));
    for (let k = 0; k < 4; k++) g.add(part(cyl(0.011, 0.013, 0.16, 6), SIGN.bone, 'remains-bone-' + k, { pos: [hx + (rand() - 0.5) * cR * 0.6, cageTop - cH * (0.6 + rand() * 0.3), (rand() - 0.5) * cR * 0.6], rot: [rand() * T, rand() * T, rand() * T] }));
    g.add(part(clothPanel(cR * 1.1, cH * 0.5, 4, 5, 1.6, 0.4), SIGN.clothDark, 'remains-rag', { pos: [hx, cageTop - cH * 0.6, cR * 0.5] }));
  }
  g.add(part(box(0.16, 0.1, 0.01), SIGN.board, 'crime-plaque', { pos: [0.06, H * 0.55, 0.05], rot: [0, 0, 0.06] }));
  for (let l = 0; l < 2; l++) g.add(part(box(0.1, 0.008, 0.0014), SIGN.ink, 'plaque-line-' + l, { pos: [0.06, H * 0.55 + 0.018 - l * 0.03, 0.056] }));
  return seat(g);
}

/* --------------------------------------------------------------- PRAYER FLAGS */
export const PRAYERFLAG_AXES = { span: 4, count: 4, form: 3, weather: 3, knot: 2, mount: 2 };
export function prayerFlagLine(variant = 0) {
  const A = axesOf(variant, PRAYERFLAG_AXES);
  const rand = rnd(variant * 619 + 53);
  const g = new THREE.Group();
  const span = 1.2 + A.span * 0.6;
  const H = 1.5 + A.span * 0.12;
  const sag = 0.14 + A.span * 0.04;
  if (A.mount) {
    [-1, 1].forEach((s, i) => {
      g.add(part(limb(0.022, 0.032, H, 7, 3), MAT.weatheredTimber, 'stake-' + i, { pos: [s * span / 2, H / 2, 0], rot: [0, 0, s * 0.06] }));
      for (let k = 0; k < 2; k++) g.add(part(torus(0.026, 0.004, 3, 10), MAT.ropeHemp, 'stake-binding-' + i + '-' + k, { pos: [s * span / 2, H * (0.86 + k * 0.06), 0], rot: [Math.PI / 2, 0, 0] }));
      g.add(part(ico(0.038, 0), MAT.slateDry, 'stake-stone-' + i, { pos: [s * span / 2, 0.02, 0] }));
    });
  } else {
    [-1, 1].forEach((s, i) => {
      g.add(part(limb(0.05, 0.07, H * 0.9, 8, 3), MAT.pineBark, 'anchor-tree-' + i, { pos: [s * span / 2, H * 0.45, 0] }));
      g.add(part(cone(0.09, 0.2, 6), MAT.pineNeedle, 'anchor-bough-' + i, { pos: [s * span / 2, H * 0.95, 0] }));
    });
  }
  const linePts = [];
  for (let k = 0; k <= 10; k++) { const t = k / 10; linePts.push([-span / 2 + t * span, H * 0.88 - Math.sin(t * Math.PI) * sag, 0]); }
  g.add(part(tube(linePts, 0.0035, 5), MAT.ropeHemp, 'prayer-line', {}));
  const n = 5 + A.count * 3;
  const mats = [SIGN.clothPale, SIGN.cloth, SIGN.clothDark, MAT.boneLinen];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const x = -span / 2 + t * span;
    const y = H * 0.88 - Math.sin(t * Math.PI) * sag;
    const w = 0.07 + rand() * 0.03;
    const l = (0.11 + rand() * 0.05) * (1 - A.weather * 0.14);
    const tear = A.weather * 0.2;
    if (A.form === 0) g.add(part(clothPanel(w, l, 3, 4, 1.6, tear), mats[i % 4], 'flag-' + i, { pos: [x, y - l / 2 - 0.004, 0], rot: [0, (rand() - 0.5) * 0.7, (rand() - 0.5) * 0.2] }));
    else if (A.form === 1) {
      g.add(part(clothPanel(w, l, 3, 4, 1.6, tear), mats[i % 4], 'flag-' + i, { pos: [x, y - l / 2 - 0.004, 0], rot: [0, (rand() - 0.5) * 0.7, (rand() - 0.5) * 0.2] }));
      for (let k = 0; k < 2; k++) g.add(part(tube([[x + (k ? w : -w) * 0.4, y - l - 0.004, 0], [x + (k ? w : -w) * 0.5, y - l - 0.03, 0.006]], 0.0016, 4), mats[i % 4], 'flag-tail-' + i + '-' + k, {}));
    } else {
      g.add(part(clothPanel(w * 0.7, l * 1.3, 3, 5, 1.9, tear), mats[i % 4], 'flag-' + i, { pos: [x, y - l * 0.65 - 0.004, 0], rot: [0, (rand() - 0.5) * 0.9, (rand() - 0.5) * 0.24] }));
    }
    if (A.knot) g.add(part(ico(0.006, 0), MAT.ropeHemp, 'knot-' + i, { pos: [x, y, 0] }));
    if (A.weather > 1) for (let k = 0; k < 2; k++) g.add(part(box(w * 0.2, 0.001, 0.0016), SIGN.ink, 'flag-mark-' + i + '-' + k, { pos: [x, y - l * (0.3 + k * 0.3), 0.003] }));
  }
  return seat(g);
}

/* ------------------------------------------------------------- LANTERN SIGN */
export const LANTERNSIGN_AXES = { form: 4, panes: 3, bracket: 3, glyph: 4, chain: 2, cage: 2 };
export function lanternSign(variant = 0) {
  const A = axesOf(variant, LANTERNSIGN_AXES);
  const rand = rnd(variant * 907 + 59);
  const g = new THREE.Group();
  const wallH = 1.35;
  g.add(part(box(0.08, wallH, 0.44), MAT.slateDry, 'wall-stub', { pos: [-0.04, wallH / 2, 0] }));
  const reach = 0.2 + A.bracket * 0.08;
  const armY = wallH * 0.86;
  g.add(part(cyl(0.011, 0.013, reach, 7), MAT.pittedIron, 'bracket-arm', { pos: [reach / 2, armY, 0], rot: [0, 0, Math.PI / 2] }));
  g.add(part(box(0.045, 0.045, 0.04), MAT.pittedIron, 'bracket-plate', { pos: [0.004, armY, 0] }));
  if (A.bracket > 1) g.add(part(torus(0.05, 0.005, 4, 14, Math.PI), MAT.pittedIron, 'bracket-scroll', { pos: [reach * 0.4, armY - 0.045, 0], rot: [Math.PI / 2, 0, 0] }));
  const chainL = A.chain ? 0.09 : 0.035;
  for (let k = 0; k < (A.chain ? 4 : 2); k++) g.add(part(torus(0.008, 0.002, 3, 8), MAT.pittedIron, 'chain-' + k, { pos: [reach * 0.86, armY - 0.015 - (k / (A.chain ? 4 : 2)) * chainL, 0], rot: [k % 2 ? 0 : Math.PI / 2, 0, 0] }));
  const lx = reach * 0.86;
  const lH = 0.15 + A.form * 0.035;
  const lR = lH * (0.34 + A.form * 0.03);
  const top = armY - 0.02 - chainL;
  const sides = A.panes === 0 ? 4 : A.panes === 1 ? 6 : 8;
  g.add(part(lathe([[lR * 1.25, 0], [lR * 1.1, lH * 0.1], [lR * 0.9, lH * 0.16]], sides), MAT.pittedIron, 'lantern-hood', { pos: [lx, top - lH * 0.16, 0] }));
  g.add(part(cone(lR * 0.3, lH * 0.12, sides), MAT.warmBrass, 'hood-finial', { pos: [lx, top, 0] }));
  const body = lH * 0.62;
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * T;
    const pw = (T * lR) / sides * 0.86;
    g.add(part(box(pw, body, 0.0025), SIGN.glass, 'pane-' + i, { pos: [lx + Math.cos(a) * lR, top - lH * 0.16 - body / 2, Math.sin(a) * lR], rot: [0, -a + Math.PI / 2, 0] }));
    g.add(part(box(0.006, body, 0.006), MAT.pittedIron, 'mullion-' + i, { pos: [lx + Math.cos(a + Math.PI / sides) * lR * 1.05, top - lH * 0.16 - body / 2, Math.sin(a + Math.PI / sides) * lR * 1.05] }));
  }
  g.add(part(lathe([[lR * 1.15, 0], [lR * 1.05, lH * 0.08], [lR * 0.6, lH * 0.12]], sides), MAT.pittedIron, 'lantern-base', { pos: [lx, top - lH * 0.16 - body - lH * 0.12, 0] }));
  g.add(part(cyl(lR * 0.28, lR * 0.34, body * 0.4, 8), MAT.boneLinen, 'candle', { pos: [lx, top - lH * 0.16 - body * 0.78, 0] }));
  g.add(part(ico(lR * 0.2, 1), SIGN.flame, 'flame', { pos: [lx, top - lH * 0.16 - body * 0.52, 0] }));
  if (A.cage) {
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * T;
      g.add(part(cyl(0.0028, 0.0028, body * 1.1, 4), MAT.blackIron, 'cage-bar-' + i, { pos: [lx + Math.cos(a) * lR * 1.16, top - lH * 0.16 - body / 2, Math.sin(a) * lR * 1.16] }));
    }
    for (let k = 0; k < 2; k++) g.add(part(torus(lR * 1.16, 0.0028, 3, sides * 2), MAT.blackIron, 'cage-ring-' + k, { pos: [lx, top - lH * 0.16 - body * (0.2 + k * 0.6), 0], rot: [Math.PI / 2, 0, 0] }));
  }
  // Glyph plate: the sign part of a lantern sign.
  const gw = lR * 1.5;
  g.add(part(box(gw, gw * 0.7, 0.004), MAT.blackIron, 'glyph-plate', { pos: [lx, top - lH * 0.16 - body * 0.5, lR * 1.3] }));
  const gd = gw * 0.2;
  if (A.glyph === 0) g.add(part(torus(gd, gd * 0.28, 4, 12), SIGN.gilt, 'glyph', { pos: [lx, top - lH * 0.16 - body * 0.5, lR * 1.33] }));
  else if (A.glyph === 1) { g.add(part(box(gd * 0.3, gd * 2, 0.003), SIGN.gilt, 'glyph-a', { pos: [lx, top - lH * 0.16 - body * 0.5, lR * 1.33] })); g.add(part(box(gd * 1.6, gd * 0.3, 0.003), SIGN.gilt, 'glyph-b', { pos: [lx, top - lH * 0.16 - body * 0.35, lR * 1.33] })); }
  else if (A.glyph === 2) g.add(part(lathe([[gd * 0.2, 0], [gd, gd * 0.9], [gd * 0.8, gd * 1.05]], 10), SIGN.gilt, 'glyph-bell', { pos: [lx, top - lH * 0.16 - body * 0.5 - gd * 0.5, lR * 1.33], rot: [Math.PI / 2, 0, 0] }));
  else for (let k = 0; k < 3; k++) g.add(part(cone(gd * 0.24, gd * 0.8, 4), SIGN.gilt, 'glyph-flame-' + k, { pos: [lx + (k - 1) * gd * 0.44, top - lH * 0.16 - body * 0.5, lR * 1.33], rot: [Math.PI / 2, 0, 0] }));
  return seat(g);
}

/* --------------------------------------------------------------- WANTED BOARD */
export const WANTEDBOARD_AXES = { size: 3, legs: 3, sheets: 4, frame: 3, canopy: 2, brace: 2 };
export function wantedBoard(variant = 0) {
  const A = axesOf(variant, WANTEDBOARD_AXES);
  const rand = rnd(variant * 479 + 65);
  const g = new THREE.Group();
  const W = 0.7 + A.size * 0.22;
  const H = 0.9 + A.size * 0.2;
  const lean0 = A.legs === 2 ? 0.16 : 0.06;
  const boardY = H * 0.55;
  g.add(part(box(W, H * 0.78, 0.026, 4, 4, 1), MAT.darkOak, 'board', { pos: [0, boardY, 0], rot: [lean0, 0, 0] }));
  if (A.frame) {
    [-1, 1].forEach((s, i) => g.add(part(box(0.035, H * 0.82, 0.035), MAT.weatheredTimber, 'frame-stile-' + i, { pos: [s * W / 2, boardY, Math.sin(lean0) * 0.02], rot: [lean0, 0, 0] })));
    [-1, 1].forEach((s, i) => g.add(part(box(W + 0.06, 0.035, 0.035), MAT.weatheredTimber, 'frame-rail-' + i, { pos: [0, boardY + s * H * 0.41, Math.sin(lean0) * 0.02], rot: [lean0, 0, 0] })));
    if (A.frame === 2) for (let k = 0; k < 4; k++) g.add(part(cyl(0.005, 0.005, 0.03, 6), MAT.pittedIron, 'frame-peg-' + k, { pos: [(k % 2 ? 1 : -1) * W / 2, boardY + (k < 2 ? 1 : -1) * H * 0.41, 0.02], rot: [Math.PI / 2 + lean0, 0, 0] }));
  }
  if (A.legs === 0) {
    [-1, 1].forEach((s, i) => g.add(part(limb(0.026, 0.036, H, 6, 2), MAT.weatheredTimber, 'leg-' + i, { pos: [s * W * 0.42, H / 2, -0.06], rot: [-0.1, 0, s * 0.04] })));
  } else if (A.legs === 1) {
    g.add(part(limb(0.038, 0.05, H, 7, 3), MAT.weatheredTimber, 'centre-post', { pos: [0, H / 2, -0.05] }));
    g.add(part(box(0.3, 0.05, 0.3), MAT.slateDry, 'post-base', { pos: [0, 0.025, -0.05] }));
  } else {
    [-1, 1].forEach((s, i) => {
      g.add(part(limb(0.026, 0.034, H * 1.02, 6, 2), MAT.weatheredTimber, 'a-leg-front-' + i, { pos: [s * W * 0.4, H / 2, 0.07], rot: [0.2, 0, s * 0.05] }));
      g.add(part(limb(0.026, 0.034, H * 1.02, 6, 2), MAT.weatheredTimber, 'a-leg-back-' + i, { pos: [s * W * 0.4, H / 2, -0.11], rot: [-0.22, 0, s * 0.05] }));
    });
    g.add(part(cyl(0.012, 0.012, W * 0.86, 6), MAT.weatheredTimber, 'a-tie', { pos: [0, H * 0.28, -0.02], rot: [0, 0, Math.PI / 2] }));
  }
  if (A.brace) [-1, 1].forEach((s, i) => g.add(part(box(0.022, 0.022, H * 0.5), MAT.weatheredTimber, 'brace-' + i, { pos: [s * W * 0.3, H * 0.3, -0.1], rot: [0.7, 0, 0] })));
  const n = 1 + A.sheets;
  for (let i = 0; i < n; i++) {
    const sw = W * (0.2 + rand() * 0.14), sh = H * (0.2 + rand() * 0.2);
    const sx = -W * 0.36 + rand() * W * 0.72, sy = boardY - H * 0.24 + rand() * H * 0.44;
    const sheet = box(sw, sh, 0.0016, 3, 3, 1);
    const p = sheet.attributes.position;
    for (let v = 0; v < p.count; v++) { const ty = (p.getY(v) + sh / 2) / sh; p.setZ(v, p.getZ(v) + (1 - ty) * sh * 0.16 * (0.4 + rand() * 0.3)); }
    p.needsUpdate = true; sheet.computeVertexNormals();
    g.add(part(sheet, SIGN.notice, 'sheet-' + i, { pos: [sx, sy, 0.016 + Math.sin(lean0) * 0.02], rot: [lean0, 0, (rand() - 0.5) * 0.14] }));
    g.add(part(box(sw * 0.5, sh * 0.24, 0.001), SIGN.ink, 'portrait-block-' + i, { pos: [sx, sy + sh * 0.12, 0.0175 + Math.sin(lean0) * 0.02], rot: [lean0, 0, 0] }));
    for (let l = 0; l < 2; l++) g.add(part(box(sw * 0.66, 0.0018, 0.0008), SIGN.ink, 'sheet-line-' + i + '-' + l, { pos: [sx, sy - sh * (0.14 + l * 0.12), 0.0175 + Math.sin(lean0) * 0.02], rot: [lean0, 0, 0] }));
    for (let c = 0; c < 2; c++) g.add(part(cyl(0.0032, 0.0032, 0.005, 6), MAT.pittedIron, 'tack-' + i + '-' + c, { pos: [sx + (c ? 1 : -1) * sw * 0.38, sy + sh * 0.4, 0.019 + Math.sin(lean0) * 0.02], rot: [Math.PI / 2 + lean0, 0, 0] }));
  }
  if (A.canopy) {
    const cw = W + 0.14;
    g.add(part(box(cw, 0.014, 0.2), MAT.darkOak, 'canopy', { pos: [0, boardY + H * 0.46, 0.05], rot: [0.34, 0, 0] }));
    for (let k = 0; k < 4; k++) g.add(part(box(cw * 0.9, 0.005, 0.05), MAT.slateDry, 'canopy-shingle-' + k, { pos: [0, boardY + H * 0.46 + 0.012 - k * 0.004, 0.12 - k * 0.045], rot: [0.34, 0, 0] }));
  }
  return seat(g);
}

/* ----------------------------------------------------------------- TALLY POST */
export const TALLY_AXES = { form: 4, tallies: 4, band: 3, top: 3, height: 2, tilt: 2 };
export function tallyPost(variant = 0) {
  const A = axesOf(variant, TALLY_AXES);
  const rand = rnd(variant * 787 + 71);
  const g = new THREE.Group();
  const H = 1.0 + A.height * 0.45;
  const R = 0.045 + A.form * 0.008;
  const tilt = A.tilt ? 0.07 : 0;
  let shaft;
  if (A.form === 0) shaft = limb(R * 0.9, R, H, 8, 4);
  else if (A.form === 1) shaft = box(R * 1.7, H, R * 1.7, 1, 4, 1);
  else if (A.form === 2) shaft = limb(R * 0.8, R * 1.2, H, 6, 4);
  else { shaft = lathe([[R, 0], [R * 1.05, H * 0.3], [R * 0.85, H * 0.6], [R * 0.95, H * 0.9], [R * 0.8, H]], 9); }
  jitter(shaft, R * 0.09, rand);
  g.add(part(shaft, MAT.weatheredTimber, 'tally-post', { pos: [0, A.form === 3 ? 0 : H / 2, 0], rot: [tilt * 0.6, rand(), tilt] }));
  g.add(part(lathe([[R * 2, 0], [R * 1.7, 0.03], [R * 1.1, 0.05]], 10), MAT.slateDry, 'post-collar-stone'));
  const rows = 1 + A.tallies;
  for (let r = 0; r < rows; r++) {
    const y = H * (0.28 + r * (0.5 / rows));
    const marks = 3 + Math.floor(rand() * 4);
    for (let i = 0; i < marks; i++) {
      const a = rand() * 0.8 - 0.4;
      g.add(part(box(0.004, R * 0.9, 0.006), MAT.wetSlate, 'tally-' + r + '-' + i, {
        pos: [Math.sin(a) * R * 0.95 + Math.sin(tilt) * y, y + (rand() - 0.5) * 0.01, Math.cos(a) * R * 0.95],
        rot: [tilt * 0.6, a, (i === marks - 1 && marks > 3 ? 1.1 : 0.06)],
      }));
    }
  }
  for (let b = 0; b < A.band; b++) {
    const y = H * (0.2 + b * 0.3);
    g.add(part(torus(R * 1.12, R * 0.1, 4, 12), MAT.pittedIron, 'iron-band-' + b, { pos: [Math.sin(tilt) * y, y, 0], rot: [Math.PI / 2 + tilt * 0.6, 0, tilt] }));
    if (b === 0) g.add(part(cyl(0.005, 0.005, R * 0.6, 6), MAT.pittedIron, 'band-pin-' + b, { pos: [Math.sin(tilt) * y + R, y, 0], rot: [0, 0, Math.PI / 2] }));
  }
  const ty = H;
  if (A.top === 0) g.add(part(cone(R * 1.2, R * 1.8, 7), MAT.weatheredTimber, 'post-top', { pos: [Math.sin(tilt) * ty, ty + R * 0.9, 0] }));
  else if (A.top === 1) {
    g.add(part(cyl(R * 1.3, R * 1.3, R * 0.5, 9), MAT.pittedIron, 'top-cap', { pos: [Math.sin(tilt) * ty, ty, 0] }));
    g.add(part(box(R * 2.6, R * 1.4, 0.012), SIGN.board, 'top-plate', { pos: [Math.sin(tilt) * ty, ty + R * 1.1, 0] }));
    for (let l = 0; l < 2; l++) g.add(part(box(R * 1.8, 0.006, 0.0014), SIGN.ink, 'top-text-' + l, { pos: [Math.sin(tilt) * ty, ty + R * (1.3 - l * 0.36), 0.007] }));
  } else {
    g.add(part(lathe([[R * 1.1, 0], [R * 0.8, R * 0.5], [R * 0.5, R * 0.9], [0, R]], 9), MAT.bellBronze, 'top-knop', { pos: [Math.sin(tilt) * ty, ty, 0] }));
    g.add(part(torus(R * 0.45, R * 0.1, 3, 10), MAT.pittedIron, 'top-ring', { pos: [Math.sin(tilt) * ty, ty + R * 1.1, 0], rot: [0.4, 0, 0] }));
  }
  return seat(g);
}

export const SIGN_GENERATORS = [
  { id: 'sign.shop-sign', name: 'Hanging shop sign', axes: SHOPSIGN_AXES, build: hangingShopSign, domain: 'signage', budgetClass: 'standard' },
  { id: 'sign.notice-post', name: 'Notice post', axes: NOTICE_AXES, build: noticePost, domain: 'signage', budgetClass: 'standard' },
  { id: 'sign.finger-post', name: 'Direction finger post', axes: FINGERPOST_AXES, build: fingerPost, domain: 'signage', budgetClass: 'standard' },
  { id: 'sign.milestone', name: 'Milestone / boundary stone', axes: MILESTONE_AXES, build: milestone, domain: 'signage', budgetClass: 'minor' },
  { id: 'sign.banner', name: 'Vertical banner', axes: BANNER_AXES, build: verticalBanner, domain: 'signage', budgetClass: 'standard' },
  { id: 'sign.pennant-line', name: 'Pennant line', axes: PENNANT_AXES, build: pennantLine, domain: 'signage', budgetClass: 'standard' },
  { id: 'sign.standard', name: 'Guild standard', axes: STANDARD_AXES, build: guildStandard, domain: 'signage', budgetClass: 'standard' },
  { id: 'sign.gibbet', name: 'Gibbet cage', axes: GIBBET_AXES, build: gibbet, domain: 'signage', budgetClass: 'hero' },
  { id: 'sign.prayer-flags', name: 'Prayer flag line', axes: PRAYERFLAG_AXES, build: prayerFlagLine, domain: 'signage', budgetClass: 'standard' },
  { id: 'sign.lantern-sign', name: 'Lantern sign', axes: LANTERNSIGN_AXES, build: lanternSign, domain: 'signage', budgetClass: 'standard' },
  { id: 'sign.wanted-board', name: 'Proclamation board', axes: WANTEDBOARD_AXES, build: wantedBoard, domain: 'signage', budgetClass: 'standard' },
  { id: 'sign.tally-post', name: 'Tally post', axes: TALLY_AXES, build: tallyPost, domain: 'signage', budgetClass: 'minor' },
];
