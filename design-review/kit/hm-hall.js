/* =========================================================================
   hm-hall.js — the render runtime for the sprite hall
   -------------------------------------------------------------------------
   One WebGL context, one scene, forty-two actors, and a scissor rect per
   visible card. Only the actor being drawn is visible during its own pass,
   so a frame costs (visible cards × one actor's meshes) rather than
   (visible cards × the whole cast).

   The two halves of the pipeline the brief asked for, in one file:
   - LIVE RIG: `frame()` steps and draws the rig itself. Source of truth.
   - BAKED SHEET: `bakeSheet()` photographs that same rig on an 8-direction
     turntable into a sprite sheet the game client can load. Nothing is
     authored twice, so the sheet cannot drift from the rig.

   Grading is deliberately NOT done in the shader. The design system says
   character art is graded saturate(.72) contrast(1.09) brightness(.82) and
   never shipped raw; that is a CSS filter on the canvas, which means the
   live view and the baked sheet go through the identical transform.
   ========================================================================= */

import * as THREE from 'https://unpkg.com/three@0.184.0/build/three.module.js';
import { buildActor, drawCalls } from './hm-actor.js?v=skin4';
import { makeState, stepActor, CLIP_LIST, CLIP_BY_ID } from './hm-actor-anim.js?v=skin4';
import { makeEnvironment, attachFX, stepFX, FACTION_FX, FX_KINDS } from './hm-actor-fx.js?v=fx1';

export const GRADE = 'saturate(.72) contrast(1.09) brightness(.82)';

/* Studio rig. Three lights and a contact shadow — the minimum that makes
   material read. Key is warm and low-saturation (--gold territory), fill is
   the one cool hue the palette allows (--focus), rim is bone. A fourth light
   would flatten the thing it is meant to reveal.

   Shadows are NOT shadow-mapped. A scissor-rect hall re-renders the shadow
   map once per visible card per frame, which is fourteen depth passes for one
   frame and is what makes the page stall. More importantly a mapped shadow
   would differ between the live view and the baked sheet, and the sheet has
   to be a photograph of what you watched. So both get the same authored
   contact blob instead. */
function contactShadowTexture() {
  const s = 128;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  const rad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  rad.addColorStop(0, 'rgba(0,0,0,.85)');
  rad.addColorStop(0.42, 'rgba(0,0,0,.42)');
  rad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = rad;
  g.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function studio(scene) {
  const key = new THREE.DirectionalLight(0xf0dcae, 3.65);
  key.position.set(-2.3, 3.5, 3.1);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x8fb4c4, 1.18);
  fill.position.set(3.2, 1.5, 1.4);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xd8d0bd, 2.05);
  rim.position.set(0.6, 2.1, -3.4);
  scene.add(rim);

  /* Hemisphere light is deliberately low now that scene.environment exists.
     Before the env map it was carrying the ambient term at 0.95, which is
     also why materials looked flat: a hemi light adds light without adding
     REFLECTION, so it lifts shadows and kills specular contrast at the same
     time. The env map does the same job with a direction, so this drops to a
     fill-of-last-resort. */
  scene.add(new THREE.HemisphereLight(0x46545c, 0x14191b, 0.34));

  // Contact shadow. Offset slightly toward -Z because the key is in front:
  // a blob centred on the feet reads as a sticker, one pushed away from the
  // light reads as a shadow.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 1.5),
    new THREE.MeshBasicMaterial({
      map: contactShadowTexture(), transparent: true, opacity: 0.62,
      depthWrite: false, color: 0x000000,
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0.1, 0.004, -0.12);
  ground.scale.set(0.62, 1, 0.52);
  scene.add(ground);
  return { key, fill, rim, ground };
}

export function createHall({ canvas, plateCanvas, specs }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;
  renderer.setClearAlpha(0);
  renderer.setScissorTest(true);

  const plate = new THREE.WebGLRenderer({
    canvas: plateCanvas, antialias: true, alpha: true, preserveDrawingBuffer: true,
  });
  plate.setPixelRatio(1);
  plate.toneMapping = THREE.ACESFilmicToneMapping;
  plate.toneMappingExposure = 1.28;
  plate.setClearAlpha(0);

  const scene = new THREE.Scene();
  studio(scene);

  /* The environment. Every MeshStandardMaterial in the cast reflects this, so
     it is the difference between PBR surfaces and flat diffuse ones. One
     texture for the whole hall. */
  scene.environment = makeEnvironment(renderer);

  const camera = new THREE.PerspectiveCamera(30, 0.7, 0.15, 40);

  const actors = new Map();
  let builtMeshes = 0;
  let builtCount = 0;
  let builtVerts = 0;
  let builtBones = 0;
  for (const spec of specs) {
    actors.set(spec.id, { spec, rig: null, st: null, calls: 0, plated: false, plateUrl: null });
  }

  /* Rigs are built the first time their card is needed, not at boot.
     Forty-two rigs is roughly two thousand lathe-and-box meshes, each with a
     per-vertex wear pass — doing that before first paint locks the page for
     seconds. Demand-driven construction keeps boot flat and means a filtered
     view only ever pays for the six people it is showing. */
  function ensure(id) {
    const a = actors.get(id);
    if (!a) return null;
    if (!a.rig) {
      a.rig = buildActor(a.spec);
      a.rig.root.visible = false;
      scene.add(a.rig.root);
      a.st = makeState(a.rig, a.spec);
      a.calls = drawCalls(a.rig);
      builtMeshes += a.calls;
      builtVerts += a.rig.measured ? a.rig.measured.verts : 0;
      builtBones += a.rig.measured ? a.rig.measured.bones : 0;
      builtCount++;

      /* FX are per-faction unless the character overrides. Two factions are
         deliberately given none — the Bell Wardens and the Unwritten Roads
         carry no light source, and giving everyone particles would make the
         ones that mean something stop meaning it. */
      const kindName = a.spec.fx !== undefined ? a.spec.fx : FACTION_FX[a.spec.faction];
      a.fx = kindName ? attachFX(a.rig, kindName, a.spec.seed) : null;
      a.fxLabel = kindName && FX_KINDS[kindName] ? FX_KINDS[kindName].label : null;
      // Pre-roll so a card that has just scrolled in is not empty of motes.
      if (a.fx) for (let i = 0; i < 60; i++) stepFX(a.fx, a.rig, 1 / 30);
    }
    return a;
  }

  /* Frame every actor against ONE reference height, not against their own.

     Framing per-actor fills each card equally and is what most character
     galleries do, but it silently destroys the comparison this page exists to
     make: normalised that way, 1.61 m Bera Claymother rendered TALLER than
     1.79 m Fenn Joryn. Since the whole point of a catalogue is judging bodies
     against each other, a shared scale is worth more than a filled frame.
     Short characters get headroom, and that headroom is information.

     Distance is derived from the vertical fov rather than guessed, and a
     narrow slot re-derives it from the horizontal so nothing is cropped. */
  const REF_H = 1.94;

  function aim(a, aspect, yaw, pitch, zoom = 1) {
    const centre = REF_H * 0.47;
    const halfV = REF_H * 0.55;
    const tan = Math.tan((camera.fov * Math.PI / 180) / 2);
    let dist = halfV / tan;
    const halfH = REF_H * 0.26;
    if (dist * tan * aspect < halfH) dist = halfH / (tan * aspect);
    dist /= zoom;
    camera.aspect = aspect;
    camera.position.set(
      Math.sin(yaw) * Math.cos(pitch) * dist,
      centre + Math.sin(pitch) * dist,
      Math.cos(yaw) * Math.cos(pitch) * dist
    );
    camera.lookAt(0, centre, 0);
    camera.updateProjectionMatrix();
  }

  const api = {
    actors,
    ensure,
    clipList: CLIP_LIST,

    /** Advance every actor whose card is on screen. */
    step(dt, slots) {
      for (const s of slots) {
        const a = ensure(s.id);
        if (!a) continue;
        stepActor(a.rig, a.spec, a.st, dt, s.clip);
        if (a.fx) stepFX(a.fx, a.rig, dt);
      }
    },

    /** Draw one scissor rect per slot. `slots` carry CSS-pixel rects. */
    render(slots, size) {
      if (renderer.domElement.width !== size.w * renderer.getPixelRatio() ||
          renderer.domElement.height !== size.h * renderer.getPixelRatio()) {
        renderer.setSize(size.w, size.h, false);
      }
      renderer.clear();
      for (const s of slots) {
        const a = ensure(s.id);
        if (!a || s.w < 8 || s.h < 8) continue;
        a.rig.root.visible = true;
        const y = size.h - s.y - s.h;      // WebGL origin is bottom-left
        renderer.setViewport(s.x, y, s.w, s.h);
        renderer.setScissor(s.x, y, s.w, s.h);
        aim(a, s.w / s.h, s.yaw ?? 0.42, s.pitch ?? 0.1, s.zoom ?? 1);
        renderer.render(scene, camera);
        a.rig.root.visible = false;
      }
    },

    /** The static plate: the same rig, held on one authored pose, rendered
     *  once at 2× and handed back as a data URL. This is the "static image
     *  beside the animated sprite" — not a different asset, the same body. */
    makePlate(id, { w = 460, h = 700, clip = 'signature', t = 1.1, yaw = 0.5, pitch = 0.08 } = {}) {
      const a = ensure(id);
      if (!a) return null;
      plate.setSize(w, h, false);
      const saveT = a.st.clipT, saveClip = a.st.clip;
      a.st.clip = clip; a.st.clipT = 0;
      // Settle the springs so the plate is not caught mid-integration.
      for (let i = 0; i < 40; i++) stepActor(a.rig, a.spec, a.st, t / 40, clip);
      if (a.fx) for (let i = 0; i < 50; i++) stepFX(a.fx, a.rig, 1 / 30);
      a.rig.root.visible = true;
      aim(a, w / h, yaw, pitch, 0.98);
      plate.render(scene, camera);
      a.rig.root.visible = false;
      const url = plate.domElement.toDataURL('image/png');
      a.st.clip = saveClip; a.st.clipT = saveT;
      a.plated = true; a.plateUrl = url;
      return url;
    },

    /** Bake an 8-direction sprite sheet for one clip, the way the game
     *  client wants it: rows are directions, columns are frames. Returns a
     *  2D canvas plus the manifest the client needs to index it. */
    bakeSheet(id, clipId, { cell = 128, frames = 8, dirs = 8 } = {}) {
      const a = ensure(id);
      if (!a) return null;
      const clip = CLIP_BY_ID[clipId] || CLIP_BY_ID.idle;
      const cw = cell, ch = Math.round(cell * 1.5);
      const sheet = document.createElement('canvas');
      sheet.width = cw * frames;
      sheet.height = ch * dirs;
      const ctx = sheet.getContext('2d');
      plate.setSize(cw, ch, false);

      const dur = clip.dur > 0 ? clip.dur : (clip.kind === 'loco' ? 1.05 : 2);
      for (let d = 0; d < dirs; d++) {
        const yaw = (d / dirs) * Math.PI * 2;
        a.st.clip = clipId; a.st.clipT = 0; a.st.phase = 0;
        for (let f = 0; f < frames; f++) {
          // Sub-step so the springs and foot plants are correct at the frame
          // rather than teleported to it. A baked sheet whose cloth has not
          // integrated is the classic reason a sheet looks worse than the rig.
          const sub = 6;
          for (let k = 0; k < sub; k++) stepActor(a.rig, a.spec, a.st, dur / frames / sub, clipId);
          if (a.fx) stepFX(a.fx, a.rig, dur / frames);
          a.rig.root.visible = true;
          aim(a, cw / ch, yaw, 0.14, 0.94);
          plate.render(scene, camera);
          a.rig.root.visible = false;
          ctx.drawImage(plate.domElement, f * cw, d * ch, cw, ch);
        }
      }
      return {
        canvas: sheet,
        manifest: {
          id, clip: clipId, cellW: cw, cellH: ch, frames, dirs,
          fps: +(frames / dur).toFixed(2), durationSeconds: dur,
          grade: GRADE, maturity: 'prototype',
          note: 'Baked from the live rig in kit/hm-actor.js. Row = direction (0 = facing camera, clockwise). Column = frame.',
        },
      };
    },

    /** Blank the canvas — called when focus clears so a stale frame does not
     *  sit under the page after the render loop stops. */
    clear() {
      renderer.setScissorTest(false);
      renderer.clear();
      renderer.setScissorTest(true);
    },

    stats() {
      return {
        actors: actors.size,
        built: builtCount,
        meshes: builtMeshes,
        perActor: builtCount ? Math.round(builtMeshes / builtCount) : 0,
        vertsPerActor: builtCount ? Math.round(builtVerts / builtCount) : 0,
        bonesPerActor: builtCount ? Math.round(builtBones / builtCount) : 0,
      };
    },

    dispose() {
      renderer.dispose();
      plate.dispose();
    },
  };
  return api;
}
