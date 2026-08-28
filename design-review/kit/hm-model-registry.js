/* =========================================================================
   hm-model-registry.js — every subject MODEL MAKER can show, in one table
   -------------------------------------------------------------------------
   Single source of truth for the selector: derives its list from the same
   registers the rest of the project already treats as canonical
   (kit/hm-actor-cast.js for the 42 named characters, kit/hm-concept-art.js
   for what art actually exists, kit/hm-art-law.js for why a bestiary family
   can or cannot be rendered yet) rather than re-typing 68 rows by hand and
   letting them drift from those files.

   Four tiers, and the difference between them is stated on every row rather
   than only in this header:
     sculpted     section geometry authored against a measured plate, the
                  enemy.ash-husk depth of build.
     generic-rig  built from the shared parametric actor rig (kit/hm-actor.js)
                  — a real skinned, measured, animated body, but not sculpted
                  to its own concept plate the way a sculpted subject is.
     queued       has concept art and an eligible chassis; not built yet.
     refused      has concept art but no eligible chassis (bestiary families
                  whose prompt needs a body the pipeline cannot build) or no
                  rank-1 authority at all (anchored_quarantine) — the manifest
                  law's own refusal path, surfaced instead of worked around.
   ========================================================================= */
import { CAST } from './hm-actor-cast.js';
import { artFor } from './hm-concept-art.js';
import { FAMILY_LAW, CHASSIS_STATUS } from './hm-art-law.js';

export const SCULPTED = [
  { id: 'enemy.ash-husk', name: 'Ash Husk', family: 'Ashbound', module: './ash-husk-model.js', buildFn: 'buildAshHusk', depth: 'Full depth: eleven section generators, 22 spring bones, a 96\u00d772 sculpted face, ten audited layer pairs.' },
  { id: 'enemy.cinder-mourner', name: 'Cinder Mourner', family: 'Ashbound', module: './cinder-mourner-model.js', buildFn: 'build', depth: 'Lighter depth: one outer garment, paddle hands, void head \u2014 see the file header for what that omits and why.' },
  { id: 'enemy.wicket-eater', name: 'Wicket Eater', family: 'Ashbound', module: './wicket-eater-model.js', buildFn: 'build', depth: 'Lighter depth, same tier as cinder-mourner, plus a cape-over-coat layer audit.' },
  { id: 'enemy.smoke-notary', name: 'Smoke Notary', family: 'Ashbound', module: './smoke-notary-model.js', buildFn: 'build', depth: 'Lighter depth; its own plate defeats most of the silhouette scan (smoke, arm spread) \u2014 stated in file, not hidden.' },
];

/** Enemy id -> FAMILY_LAW key, or null for a family with no rank-1 authority
 *  at all (anchored_quarantine). Hand-kept because it is 26 short rows and
 *  the alternative — parsing kit/hm-concept-art.js's `set` folder-name
 *  strings — is guessing at a mapping that document itself calls unreliable. */
const ENEMY_FAMILY_OF = {
  'enemy.ash-tenant': 'ashbound', 'enemy.ledger-crawler': 'ashbound', 'enemy.pyre-bailiff': 'ashbound',
  'enemy.tagless-stalker': 'ashbound', 'enemy.redaction-warden': 'ashbound', 'enemy.the-unentered': 'ashbound',
  'enemy.cairn-hound': 'cairn_beasts', 'enemy.antlered-cairn': 'cairn_beasts', 'enemy.stonejaw-vixen': 'cairn_beasts',
  'enemy.lichen-back': 'cairn_beasts', 'enemy.warm-cairn-ram': 'cairn_beasts', 'enemy.graveheat-matron': 'cairn_beasts',
  'enemy.cairn-maggot': 'cairn_beasts', 'enemy.flint-pelt': 'cairn_beasts', 'enemy.oathstone-boar': 'cairn_beasts',
  'enemy.barrow-listener': 'cairn_beasts',
  'enemy.armistice-giant': 'march_deserters', 'enemy.command-leech': 'march_deserters',
  'enemy.trench-waif': 'march_deserters', 'enemy.receipt-soldier': 'march_deserters',
  'enemy.buoy-corpse': null, 'enemy.hawser-hand': null,
};

function titleOf(id) {
  return id.split('.')[1].split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
}

function queuedBestiary() {
  const out = [];
  for (const [id, famId] of Object.entries(ENEMY_FAMILY_OF)) {
    const art = artFor(id);
    if (!famId) {
      out.push({
        id, kind: 'creature', name: titleOf(id), family: 'Anchored Quarantine', tier: 'refused',
        plate: art.has ? art.src : null,
        reason: 'No rank-1 prompt exists for this family in prompts/family-plates-batch-01.md, and no FAMILY_LAW row. kit/hm-concept-art.js records this art as FOUND, not approved. Under the manifest law, absent authority is a refusal, not a guess.',
      });
      continue;
    }
    const law = FAMILY_LAW[famId];
    const chassis = CHASSIS_STATUS[law?.chassis];
    if (famId === 'ashbound') {
      out.push({
        id, kind: 'creature', name: titleOf(id), family: law.name, tier: 'queued', plate: art.has ? art.src : null,
        promptCall: law.promptCall,
        reason: 'The humanoid-collapsed chassis is proven \u2014 four Ashbound individuals are built on it. This one\u2019s own section geometry has not been authored yet; it is next in line, not blocked.',
      });
    } else {
      out.push({
        id, kind: 'creature', name: titleOf(id), family: law.name, tier: 'refused', plate: art.has ? art.src : null,
        promptCall: law.promptCall,
        reason: `The prompt requires a ${law.chassis} chassis. ${chassis?.blocker || 'No chassis exists yet for this body plan.'}`,
      });
    }
  }
  return out;
}

function namedCastList() {
  return CAST.map((c) => {
    const art = artFor(c.id);
    return {
      id: c.id, kind: 'character', name: c.name, role: c.role, faction: c.faction,
      tier: 'generic-rig', placed: !!c.placed, authoredClip: !!c.authoredClip,
      plate: art.has ? art.src : null,
    };
  });
}

const ORIGIN_IDS = ['origin.gloamfarer', 'origin.bell_warden', 'origin.mire_physicker', 'origin.oathless_scion',
  'origin.grave_tithe_runner', 'origin.cinder_mason', 'origin.starved_seer', 'origin.thorn_poacher'];

function originsList() {
  return ORIGIN_IDS.map((id) => {
    const art = artFor(id);
    return {
      id, kind: 'origin', name: id.replace('origin.', '').split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' '),
      tier: 'reference', plate: art.has ? art.src : null,
      reason: art.has
        ? 'Playable-origin render, reference only \u2014 origins are not in kit/hm-actor-cast.js, so there is no body spec here to build a model from.'
        : 'No art vendored for this origin yet (four of eight origins have none \u2014 see GAP-ANALYSIS-CONTENT.md).',
    };
  });
}

export function buildRegistry() {
  const sculpted = SCULPTED.map((s) => ({ ...s, kind: 'creature', tier: 'sculpted', plate: artFor(s.id).src }));
  return { sculpted, queuedBestiary: queuedBestiary(), namedCast: namedCastList(), origins: originsList() };
}

export function tally(reg) {
  return {
    sculpted: reg.sculpted.length,
    namedCast: reg.namedCast.length,
    queued: reg.queuedBestiary.filter((r) => r.tier === 'queued').length,
    refused: reg.queuedBestiary.filter((r) => r.tier === 'refused').length,
    origins: reg.origins.length,
    total: reg.sculpted.length + reg.namedCast.length + reg.queuedBestiary.length + reg.origins.length,
  };
}
