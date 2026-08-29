/* =========================================================================
   hm-concept-art.js — the concept-art register
   -------------------------------------------------------------------------
   HARD RULE for this document and everything that grows out of it: no render
   is ever shown without its concept art beside it. This file is what makes
   that rule enforceable rather than aspirational — every subject has a row,
   and a subject with no art carries an explicit `null` that the surface is
   obliged to draw as a gap.

   Provenance. These plates live in the user's Drive, not in the repository:
     Drive root: sable-reach-unsynced-images-2026-08-26
   Each row records the Drive file id, so the art is traceable and a later
   pass can vendor the binaries into assets/ with proper manifest metadata.
   Until that pass runs, `url()` builds a Drive thumbnail URL. That means:
     - art loads for anyone with access to the folder,
     - it does NOT load offline,
     - and `vendored: false` says so on every row.
   Do not let that flag go stale. tools/assets/validate.mjs would reject an
   undeclared asset, and it would be right to.

   Kinds:
     master — the full concept plate, staged, with background.
     cutout — the same subject with the background removed. Preferred beside
              a render, because a transparent silhouette can be compared to
              the rig's silhouette directly.

   -------------------------------------------------------------------------
   RECONCILED AGAINST THE REAL DRIVE TREE, 2026-08-26. Listed with read
   access to working root 1DQnahPT5zXLEaWPW07F6Ffx4I_48SxA6, so the rows
   below are no longer trusted from memory. Four findings, three still open:

   0. CLOSED, 2026-08-27. The whole tree arrived as a local folder export,
      so 46 plates are now vendored into assets/characters/ and
      assets/enemies/ and every row below carries a `local` path. The page
      no longer needs Drive access, survives going offline, and the art is
      readable by automated review. Bytes were copied unmodified: no resize,
      no recompression, no grade.
   1. FIXED. The four March Deserters carried `cutout: null`. The cutouts
      exist, in their own folder — march-deserters-individual-cutouts-
      2026-08-26. Their ids are now recorded above. The page had been
      reporting "master only" for art that was already finished.
   2. OPEN. `set` values here are folder names with the -2026-08-26 date
      suffix stripped, so six of seven do NOT match a real folder. Only
      `exact-word-finals` matches. Fixing it properly is a schema change,
      not a rename: master and cutout live in DIFFERENT folders
      (grave-tithe-concept-masters-… and grave-tithe-cutouts-…), so one
      `set` per row cannot describe both.
   3. OPEN. An entire family is absent from this register and from
      FAMILY_LAW: anchored-quarantine-individual-forms-2026-08-26 holds
      buoy-corpse-v1 and hawser-hand-v1, each with a cutout. Registering
      them needs subject ids that pass the repo's content-id contract, and
      a rank-1 prompt they can be judged against. Not inventable here.
   4. OPEN. Folders no row references at all: ashbound-individual-forms,
      cairn-beasts-individual-forms, grave-tithe-cutouts,
      unwritten-roads-cutouts, source-cutout-repairs, staged-originals,
      generated-images, and a sable-reach-main folder beside the images.

   Measured file sizes: 1.1–2.3 MB per PNG. That is why vendoring is a
   custodian task with disk access and not something a design pass can do
   by carrying bytes.
   ========================================================================= */

const LH3 = 'https://lh3.googleusercontent.com/d/';
const THUMB = 'https://drive.google.com/thumbnail?id=';

/** Drive image URL at a requested width.
 *
 *  Three URL forms were measured against this folder from inside a browser
 *  frame, sequentially, on a cold cache:
 *    lh3.googleusercontent.com/d/<id>=w480   4/4 ok, 660-1090 ms
 *    drive.google.com/thumbnail?id=...       works alone, but drops requests
 *                                            under burst load - an 18-image
 *                                            page left every request hanging
 *                                            with neither load nor error
 *    drive.google.com/uc?export=view         4/4 error
 *  So lh3 is primary and the thumbnail endpoint is the fallback the retry
 *  ladder climbs to. `uc` is not used at all.
 *
 *  `attempt` also busts cache. lh3 rejects unknown query parameters, so the
 *  buster is a one-pixel width change rather than an added parameter.
 */
export function url(driveId, w = 480, attempt = 0) {
  if (!driveId) return null;
  if (attempt < 2) return `${LH3}${driveId}=w${w + attempt}`;
  return `${THUMB}${driveId}&sz=w${w}&r=${attempt}`;
}

/** One row per subject. `master` and `cutout` are Drive ids or null. */
export const CONCEPT_ART = {
  /* ---- Named characters: The Grave Tithe (6/6 mastered, 6/6 cut out) ---- */
  'npc.sera-dusk': { master: '1JpupsyrENKJk6YAjDBzHRYFRyUnArP7B', cutout: '1GJya3WaXr-e1XRNbkNa97WTYr31UU6mQ', set: 'grave-tithe-concept-masters', local: '../assets/characters/sera-dusk-v1-cutout.png' },
  'npc.mott-vane': { master: '15tFD5_Mrxf_pgWQS8pVXdtSQJL-3q6RZ', cutout: '1OE_bPAMZvKRXN3PeF6xs15I70WX-N2jw', set: 'grave-tithe-concept-masters', local: '../assets/characters/mott-vane-v1-cutout.png' },
  'npc.ilse-crow': { master: '15oiSI3h2oPcAlD4jElEiGfY0xZW38nkf', cutout: '1Y9Qb5fFR3mH1_-3n_30TzywheyP8zblM', set: 'grave-tithe-concept-masters', local: '../assets/characters/ilse-crow-v1-cutout.png' },
  'npc.garran-low': { master: '10m3OI-g9iHJUHX5puosPUtUPv6zFjUYN', cutout: '1U3GW0Rxd2RtKZeFZFfavvZu40Mcb_j1v', set: 'grave-tithe-concept-masters', local: '../assets/characters/garran-low-v1-cutout.png' },
  'npc.netta-aster': { master: '1l1xKTdnwNwD94gLsSYUEmWt1O7XNM21B', cutout: '1lI8oGGOKfVyT2sKHtVVjEfNg5Sia2FtH', set: 'grave-tithe-concept-masters', local: '../assets/characters/netta-aster-v1-cutout.png' },
  'npc.orris-pale': { master: '1-Ko3HjizwKKktcPSMZZiPplADr_NtGdr', cutout: '1wBgmogI2_1R9Ld8b_KqgeGE2_2Y_LR16', set: 'grave-tithe-concept-masters', local: '../assets/characters/orris-pale-v1-cutout.png' },

  /* ---- The Unwritten Roads (6/6, 6/6) ---- */
  'npc.vellin-the-unwritten': { master: '16_EpoFOByjaNki2DsiGsu75KRRrjszqY', cutout: '1UQeHpsUsGV4wB0kyWa9D9rIX24j7ibBa', set: 'unwritten-roads-concept-masters', local: '../assets/characters/vellin-the-unwritten-v1-cutout.png' },
  'npc.kora-path': { master: '1FNaxgkey2rBdW2X2-FnlObRmzlbHTApC', cutout: '1qlejt3_ta-ixuNXi42DVCEj7pH5g94Gw', set: 'unwritten-roads-concept-masters', local: '../assets/characters/kora-path-v1-cutout.png' },
  'npc.marn-upland': { master: '1PN_SG32h5jXLTOqNst7DNSl1lDXPILUv', cutout: '1IhoCLehGadl9a770jRIJ4nCFTHDRhjLg', set: 'unwritten-roads-concept-masters', local: '../assets/characters/marn-upland-v1-cutout.png' },
  'npc.iri-north': { master: '1emnmYf4FCqkOjMPa_cR_dQQ3a_gUG9hV', cutout: '1HobGkplktS26kn4xINjcWBVl-TWNaDNz', set: 'unwritten-roads-concept-masters', local: '../assets/characters/iri-north-v1-cutout.png' },
  'npc.rin-waymark': { master: '1vUvx9awCZmu_lOp5pk6wkTPQdF0qTVtg', cutout: '1rDeq3gOAAkqRyctWF-aZSufqJPb0wrAI', set: 'unwritten-roads-concept-masters', local: '../assets/characters/rin-waymark-v1-cutout.png' },
  'npc.elo-veer': { master: '10sGqOKCxgcMTuCLA1tVtmlhoVzYvQzU3', cutout: '1I2d3PwVMqGf0VilcPIzr6HG85aKtG7Yq', set: 'unwritten-roads-concept-masters', local: '../assets/characters/elo-veer-v1-cutout.png' },

  /* ---- Custodians of the Exact Word (6/6 mastered, 3/6 cut out) ---- */
  'npc.gatewarden-nhal': { master: '1N2Dm9mxwu6EBMVHXFNXy3UFF1Frn-sYv', cutout: '1aJxNT6x0yYufy-CxkkCiMQUoSnE4DyhF', set: 'exact-word-finals', local: '../assets/characters/nhal-without-shadow-v1-cutout.png' },
  'npc.moira-quiet': { master: '1Jsxblr6FI5xt6ra0qW-9BLlHQUfPTomT', cutout: '169w9tcsoOG6_vbi-OXZ9_ADq4d5Fuk77', set: 'exact-word-finals', local: '../assets/characters/moira-quiet-v1-cutout.png' },
  'npc.seln-clause': { master: '1a0JOmJR0sbZ0gxM47QVfJllkiAOERFKX', cutout: '19PWHZHKT4-baVLCC0GLue10RZV-v59_D', set: 'exact-word-finals', local: '../assets/characters/seln-clause-v1-cutout.png' },
  'npc.brother-iven': { master: '1gA47xgSLuyPJ4q2gR6hv3BM_u1RlbJHF', cutout: null, set: 'exact-word-finals', local: '../assets/characters/brother-iven-v1.png' },
  'npc.aven-tongueless': { master: '13I3u2kPbMmX4g76vP62K73WchAPkZe9h', cutout: null, set: 'exact-word-finals', local: '../assets/characters/aven-tongueless-v1.png' },
  'npc.teth-varo': { master: '1pspXM83BRojL1m_qP7dZk7wI-SMdimBl', cutout: null, set: 'exact-word-finals', local: '../assets/characters/teth-varo-v1.png' },

  /* ---- The Ember Ledger (0/6) ----
     Nothing exists. Six explicit nulls rather than six absent keys, so the
     coverage count cannot quietly skip them. */
  /* Cutouts for these two were found in generated-images/ during the
     2026-08-27 reconciliation: staged output, not an approved master, and no
     Drive id in an approved folder. Vendored so the art is visible, marked
     unreviewed so nothing downstream mistakes it for rank 2. */
  'npc.maela-voss': { master: null, cutout: null, set: 'generated-images-unreviewed', local: '../assets/characters/maela-voss-v1-cutout.png' },
  'npc.avren-doss': { master: null, cutout: null },
  'npc.bera-claymother': { master: null, cutout: null, set: 'generated-images-unreviewed', local: '../assets/characters/bera-claymother-v1-cutout.png' },
  'npc.fenn-joryn': { master: null, cutout: null },
  'npc.dessa-mirel': { master: null, cutout: null },
  'npc.kett-sable': { master: null, cutout: null },

  /* ---- The Bell Wardens (0/6) ---- */
  'npc.torren-vale': { master: null, cutout: null },
  'npc.alda-rime': { master: null, cutout: null },
  'npc.neris-thorn': { master: null, cutout: null },
  'npc.edda-quill': { master: null, cutout: null },
  'npc.bram-caul': { master: null, cutout: null },
  'npc.olan-vey': { master: null, cutout: null },

  /* ---- The Reed Sisters (0/6) ---- */
  'npc.ysra-pell': { master: null, cutout: null },
  'npc.nima-reed': { master: null, cutout: null },
  'npc.cal-harrow': { master: null, cutout: null },
  'npc.iva-pell': { master: null, cutout: null },
  'npc.tess-fen': { master: null, cutout: null },
  'npc.roan-drel': { master: null, cutout: null },

  /* ---- The Cinder Compact (0/6) ---- */
  'npc.orik-senn': { master: null, cutout: null },
  'npc.sava-quench': { master: null, cutout: null },
  'npc.tarn-widow': { master: null, cutout: null },
  'npc.mera-bolt': { master: null, cutout: null },
  'npc.dain-coal': { master: null, cutout: null },
  'npc.pritch-glass': { master: null, cutout: null },

  /* ---- Playable origins. Four renders are already vendored in assets/,
     which is the one place this document can show art with no network. ---- */
  'origin.gloamfarer': { local: '../assets/characters/gloamfarer-v2.png', vendored: true, set: 'assets/characters' },
  'origin.bell_warden': { local: '../assets/characters/bell-warden-v2.png', vendored: true, set: 'assets/characters' },
  'origin.mire_physicker': { local: '../assets/characters/mire-physicker-v2.png', vendored: true, set: 'assets/characters' },
  'origin.oathless_scion': { local: '../assets/characters/oathless-scion-v2.png', vendored: true, set: 'assets/characters' },
  'origin.grave_tithe_runner': { master: null, cutout: null },
  'origin.cinder_mason': { master: null, cutout: null },
  'origin.starved_seer': { master: null, cutout: null },
  'origin.thorn_poacher': { master: null, cutout: null },

  /* ---- Bestiary: Ashbound, individual concept masters (10) ----
     These are named individuals within the family, not the family sigil, and
     ash_husk is the entry the content gap analysis uses as its worked
     example. It has art. That is worth knowing. ---- */
  'enemy.ash-husk': { master: '1Dqei3v-gO5MXoDbW6Z6d4INl-pE-P-Jy', cutout: null, set: 'ashbound-individual-concept-masters', local: '../assets/enemies/ash-husk-v1.png' },
  'enemy.ash-tenant': { master: '1Jv170ZuEnPNxGVnI4pItZLaWlKQWwBPv', cutout: null, set: 'ashbound-individual-concept-masters', local: '../assets/enemies/ash-tenant-v1-cutout.png' },
  'enemy.ledger-crawler': { master: '1X0VVLHz21ncrvlV0fO1fbb3kbGT7tBCw', cutout: null, set: 'ashbound-individual-concept-masters', local: '../assets/enemies/ledger-crawler-v1.png' },
  'enemy.pyre-bailiff': { master: '1KwPw3W2VnhXFUDZym81l2sKf9GAi2Q0V', cutout: null, set: 'ashbound-individual-concept-masters', local: '../assets/enemies/pyre-bailiff-v1.png' },
  'enemy.cinder-mourner': { master: '1Pm_Y2vEPCJYjYEwgV2gbRNFgZk2btcYu', cutout: null, set: 'ashbound-individual-concept-masters', local: '../assets/enemies/cinder-mourner-v1.png' },
  'enemy.tagless-stalker': { master: '1qt570J0ZZbhSYhEGQOhzfmiD8QUiGMKO', cutout: null, set: 'ashbound-individual-concept-masters', local: '../assets/enemies/tagless-stalker-v1.png' },
  'enemy.smoke-notary': { master: '12A88_v4fU-Z6lqsIQ5BES1hikOXOpzue', cutout: null, set: 'ashbound-individual-concept-masters', local: '../assets/enemies/smoke-notary-v1.png' },
  'enemy.redaction-warden': { master: '1WRCMfANROAnepL1kxdOQnepRwpoYVKrS', cutout: null, set: 'ashbound-individual-concept-masters', local: '../assets/enemies/redaction-warden-v1.png' },
  'enemy.wicket-eater': { master: '14Aw-IQldgSrwbmeOLQRR41mQKjZQbJwY', cutout: null, set: 'ashbound-individual-concept-masters', local: '../assets/enemies/wicket-eater-v1.png' },
  'enemy.the-unentered': { master: '1umBaK0fxqt1lV3vYLd6dMva5lqPZG_EU', cutout: null, set: 'ashbound-individual-concept-masters', local: '../assets/enemies/the-unentered-v1.png' },

  /* ---- Bestiary: Cairn Beasts, individual concept masters (10) ---- */
  'enemy.cairn-hound': { master: '1im9IxUU9RMxnHSZmIPkl1LKTCtOs2Hs-', cutout: null, set: 'cairn-beasts-individual-concept-masters', local: '../assets/enemies/cairn-hound-v1.png' },
  'enemy.antlered-cairn': { master: '1JxJ3IyaSUrIydZig1qTmswgL0IU_F3bG', cutout: null, set: 'cairn-beasts-individual-concept-masters', local: '../assets/enemies/antlered-cairn-v1.png' },
  'enemy.stonejaw-vixen': { master: '1S2zVDesVoc3WMWcs8vGFR32fdwjx8KtH', cutout: null, set: 'cairn-beasts-individual-concept-masters', local: '../assets/enemies/stonejaw-vixen-v1.png' },
  'enemy.lichen-back': { master: '1gf68PY11hm8yeiWWbmS1ULklMfyQ9ZmA', cutout: null, set: 'cairn-beasts-individual-concept-masters', local: '../assets/enemies/lichen-back-v1.png' },
  'enemy.warm-cairn-ram': { master: '1e7MInYPgldNJ4tKYXAQhi7KIHhN_z2I8', cutout: null, set: 'cairn-beasts-individual-concept-masters', local: '../assets/enemies/warm-cairn-ram-v1.png' },
  'enemy.graveheat-matron': { master: '1OAfMhVgSHf7M8TCj9NjEy58xDIr7LMM6', cutout: null, set: 'cairn-beasts-individual-concept-masters', local: '../assets/enemies/graveheat-matron-v1.png' },
  'enemy.cairn-maggot': { master: '1pkat5RYu8yb8vyegWmFc_rNcap52FXjH', cutout: null, set: 'cairn-beasts-individual-concept-masters', local: '../assets/enemies/cairn-maggot-v1-cutout.png' },
  'enemy.flint-pelt': { master: '1mBJYSk3cWOk2MPnXiF3hHVR-haplN3Wn', cutout: null, set: 'cairn-beasts-individual-concept-masters', local: '../assets/enemies/flint-pelt-v1.png' },
  'enemy.oathstone-boar': { master: '1P4sWworX7FV1_kx3k7YI0XXT0WZxigFx', cutout: null, set: 'cairn-beasts-individual-concept-masters', local: '../assets/enemies/oathstone-boar-v1-cutout.png' },
  'enemy.barrow-listener': { master: '17yGrmPNMskFOZ3N44UxPjOfMkrhK_1G-', cutout: null, set: 'cairn-beasts-individual-concept-masters', local: '../assets/enemies/barrow-listener-v1-cutout.png' },

  /* ---- Bestiary: March Deserters, individual concept masters (4 of a
     family the audit lists as fully authored) ---- */
  'enemy.armistice-giant': { master: '11vxL8ENn_-gswxUevjqmmAj0RBG_Lq6i', cutout: '1oRvzsbASJNFkKscpSWtng3uf4VoBomdx', set: 'march-deserters-individual-concept-masters', local: '../assets/enemies/armistice-giant-v1-cutout.png' },
  'enemy.command-leech': { master: '1ZtNY1VWYATyS13dB4KDxU-3uX2-R3gN2', cutout: '1w900RxOq6Ixz9zshA5BFCdGYUNDsX-qn', set: 'march-deserters-individual-concept-masters', local: '../assets/enemies/command-leech-v1-cutout.png' },
  'enemy.trench-waif': { master: '1tuU1MuhbkU31ork2D2Z6Iii5I0yOhwie', cutout: '1H_9-j-ffKnt9gFgg7ld4Ug_nfDYWSIzL', set: 'march-deserters-individual-concept-masters', local: '../assets/enemies/trench-waif-v1-cutout.png' },
  /* ---- Anchored Quarantine. Found in Drive on 2026-08-27. The family has
     no batch-01 prompt and no FAMILY_LAW row, so these are registered as art
     that exists, not as approved masters. ---- */
  'enemy.buoy-corpse': { master: null, cutout: null, local: '../assets/enemies/buoy-corpse-v1-cutout.png', set: 'anchored-quarantine-individual-forms-2026-08-26' },
  'enemy.hawser-hand': { master: null, cutout: null, local: '../assets/enemies/hawser-hand-v1-cutout.png', set: 'anchored-quarantine-individual-forms-2026-08-26' },

  'enemy.receipt-soldier': { master: '175TAI1OEpYiwu05NJFms6xkN3hKcdDr0', cutout: '12NM6sQWCBnwJLxAVXMORwZC8e-TCYBej', set: 'march-deserters-individual-concept-masters', local: '../assets/enemies/receipt-soldier-v1-cutout.png' },
};

/**
 * Resolve the art for one subject into something a card can render.
 * Prefers a vendored local file, then the cutout, then the master.
 * Never guesses: a subject with no row and a subject with a null row both
 * come back `has: false`, and the caller must draw the gap.
 */
export function artFor(id, w = 480, attempt = 0) {
  const row = CONCEPT_ART[id];
  if (!row) return { has: false, kind: 'unregistered', src: null, vendored: false, note: 'No row in the concept-art register.' };
  if (row.local) {
    return { has: true, kind: 'concept plate', src: row.local, vendored: true, set: row.set, note: 'Vendored in assets/ — same-origin, loads offline, readable by review.' };
  }
  if (row.cutout) {
    return { has: true, kind: 'concept cutout', src: url(row.cutout, w, attempt), vendored: false, set: row.set, driveId: row.cutout, note: 'Served from Google’s image CDN, not vendored: needs folder access and will not survive going offline.' };
  }
  if (row.master) {
    return { has: true, kind: 'concept master', src: url(row.master, w, attempt), vendored: false, set: row.set, driveId: row.master, note: 'Served from Google’s image CDN, not vendored: needs folder access and will not survive going offline.' };
  }
  return { has: false, kind: 'none', src: null, vendored: false, note: 'Registered with no art. This is a queue item, not an oversight.' };
}

/** Coverage, measured over whichever id list the caller cares about.
 *  Kind and vendoring are counted independently: a plate is a cutout or a
 *  master because of what it IS, not because of where it is served from.
 *  Counting them in one ladder is how the cutout tile read zero the day
 *  every row gained a `local` path. */
export function coverage(ids) {
  let master = 0, cutout = 0, vendored = 0, none = 0, unregistered = 0, withArt = 0;
  for (const id of ids) {
    const row = CONCEPT_ART[id];
    if (!row) { unregistered++; continue; }
    const localCutout = !!row.local && /-cutout\.png$/i.test(row.local);
    const localMaster = !!row.local && !localCutout;
    if (row.local) vendored++;
    if (row.cutout || localCutout) { cutout++; master++; withArt++; continue; }
    if (row.master || localMaster) { master++; withArt++; continue; }
    none++;
  }
  return { total: ids.length, master, cutout, vendored, none, unregistered,
    withArt, ratio: +((withArt / Math.max(ids.length, 1)) * 100).toFixed(1) };
}
