/* The elemental VFX registry — every family in one list.
 *
 * The lab and the world both read this, so a family is added in exactly one
 * place. Order is the order the lab shows them: fire, water, weather, veil.
 *
 * DECLARED VARIANT COUNTS
 * Every number below is a product of axes that change silhouette or
 * behaviour. Seed jitter is not counted, and no axis is a recolour — where a
 * colour changes it is because the fuel, the temperature or the mineral
 * changed, and those change shape too. The counting rule was tightened by
 * request, and two axes were CUT to hold it: stormflash's `tint` and
 * groundmist's `glow`. That is why lightning declares 864 and not 1,728.
 *
 * A family's real space is larger than its declared count — every instance
 * also carries a seed that varies placement and phase without bound. The
 * declared number is the count of visibly different effects, which is the
 * only number worth quoting.
 *
 * The CLIMATE group is different in kind from the other four: its three
 * families are driven by the solar model in hm-vfx-climate.js rather than by
 * their axes alone, so the same blizzard variant is a different thing at a
 * winter dawn and a summer noon. Season and time of day are therefore NOT
 * axes — counting them would be counting the same effect twice.
 */
import { FIRE_FAMILIES } from './hm-vfx-fire.js';
import { WATER_FAMILIES } from './hm-vfx-water.js';
import { WEATHER_FAMILIES } from './hm-vfx-weather.js';
import { VEIL_FAMILIES } from './hm-vfx-veil.js';
import { CLIMATE_FAMILIES } from './hm-vfx-climate.js';
import { spaceOf } from './hm-vfx.js';

export const VFX_FAMILIES = [
  ...FIRE_FAMILIES, ...WATER_FAMILIES, ...WEATHER_FAMILIES, ...VEIL_FAMILIES,
  ...CLIMATE_FAMILIES,
];

export const VFX_GROUPS = [
  { id: 'fire', label: 'Fire', note: 'The one element allowed to be beautiful.' },
  { id: 'water', label: 'Water', note: 'Movement, aeration, and a small cool glow.' },
  { id: 'weather', label: 'Weather', note: 'Everywhere at once; the region\u2019s mood.' },
  { id: 'veil', label: 'Veil', note: 'Marsh light, hexcraft, steam, frost.' },
  { id: 'climate', label: 'Climate', note: 'Violent weather, tied to the solar model.' },
];

/** Declared space of one family, and of the kit. */
export const familySpace = (f) => spaceOf(f.axes);
export const totalSpace = () => VFX_FAMILIES.reduce((n, f) => n + spaceOf(f.axes), 0);

/** Turn a set of axis values back into the flat variant index. The inverse of
 *  axesOf(), and what makes a variant addressable: a screenshot can always be
 *  reproduced from (familyId, variant). */
export function indexOfAxes(vals, axes) {
  let mul = 1, n = 0;
  for (const k of Object.keys(axes)) {
    n += (((vals[k] | 0) % axes[k]) + axes[k]) % axes[k] * mul;
    mul *= axes[k];
  }
  return n;
}

export const familyById = (id) => VFX_FAMILIES.find((f) => f.id === id) || null;

/* Deferred, and named rather than quietly missing: combat and ability VFX —
 * blood, harm impact, hit sparks — are not in this pass. They need phase
 * timings (wind-up, impact, dissipate) to hang on, and the project has no
 * turn-order rail, action economy or resolution log yet. Building them now
 * would mean inventing the timing vocabulary twice. */
export const DEFERRED = [
  {
    id: 'hm.vfx.harm', name: 'Blood and harm impact', group: 'combat',
    reason: 'Needs the turn-based resolution vocabulary (initiative rail, action economy, resolution log) before impact phases can be timed. Deferred by decision, not overlooked.',
  },
];
