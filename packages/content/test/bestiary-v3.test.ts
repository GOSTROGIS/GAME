import assert from "node:assert/strict";
import test from "node:test";
import { BESTIARY, BESTIARY_TARGETS, ENEMY_FAMILIES, validateBestiary } from "../src/bestiary.js";

const ORIGINAL_IDS = [
  "ash_husk", "ledger_crawler", "cinder_mourner", "tagless_stalker", "pyre_bailiff", "the_unentered",
  "cairn_hound", "lichen_back", "stonejaw_vixen", "warm_cairn_ram", "graveheat_matron", "antlered_cairn",
  "orderless_pikeman", "wax_seal_archer", "bannerless_scout", "sealed_sapper", "captain_ninth_blank", "marshal_vesk_unreported",
  "mirebound", "vestry_drifter", "drowned_deacon", "font_bearer", "sexton_below", "parish_that_walks",
  "reed_witch", "bog_charm_tender", "marshlight_midwife", "pale_salt_diviner", "mother_of_reeds", "veksa_nine_masks",
  "kiln_thrall", "chain_stoker", "quenchless_smith", "furnace_shield_guard", "slag_foreman", "kiln_knight_rusk",
  "shard_tick", "glasswood_hart", "razorwing_moth", "sapmirror_lynx", "ironroot_auroch", "widow_in_the_glass",
  "hush_monk", "vow_sweeper", "exact_word_adept", "inkless_lector", "prior_cord", "abbot_of_exact_words",
  "urn_whisper", "wall_canticle", "resonance_beadle", "stone_soprano", "choirmaster_without_lungs", "cantor_oss",
  "finger_mice", "ribcage_screecher", "borrowed_spine", "reliquary_millipede", "crypt_assembler", "the_borrowed_saint",
  "ropewalker", "clapper_squire", "verdigris_ringer", "memory_carillonneur", "dusk_toll_collector", "bell_without_tower",
  "salt_veil_strider", "mirror_beetle", "sealed_mirror_bearer", "brine_oracle", "caravan_of_one", "saint_of_closed_mirrors",
  "coral_knuckle", "moonless_netling", "lantern_gilled_raider", "undertow_harpooner", "reefwife_karra", "admiral_of_the_inland_tide",
] as const;

test("bestiary preserves the original roster and reaches the exact V3 targets", () => {
  assert.equal(BESTIARY.length, 178);
  assert.equal(ENEMY_FAMILIES.length, 21);
  const ids = new Set(BESTIARY.map(({ id }) => id));
  assert.equal(ids.size, BESTIARY.length);
  for (const id of ORIGINAL_IDS) assert.ok(ids.has(id), `missing preserved creature ${id}`);

  for (const [rank, target] of Object.entries(BESTIARY_TARGETS.ranks)) {
    assert.equal(BESTIARY.filter((creature) => creature.rank === rank).length, target, `rank ${rank}`);
  }
  for (const [role, target] of Object.entries(BESTIARY_TARGETS.roles)) {
    assert.equal(BESTIARY.filter((creature) => creature.combatRole === role).length, target, `role ${role}`);
  }
});

test("every creature exposes a distinct complete V3 identity, mechanic, and GIS habitat", () => {
  const signatures = new Set<string>();
  const handlers = new Set<string>();
  for (const creature of BESTIARY) {
    assert.equal(creature.schemaVersion, 3, creature.id);
    assert.ok(creature.anatomy.anatomicalViolation.length > 24, creature.id);
    assert.ok(creature.locomotion.rule.length > 24, creature.id);
    assert.ok(creature.horrorLanguage.audio.length > 24, creature.id);
    assert.ok(creature.lifecycle.sustenance.length > 24, creature.id);
    assert.ok(creature.lifecycle.origin.length > 24, creature.id);
    assert.ok(creature.behaviorContract.loop.includes(creature.mechanicContract.moveId.split("_").slice(-2).join(" ")) || creature.behaviorContract.loop.includes(creature.moves.at(-1)!.name), creature.id);
    assert.equal(creature.codexReveals.length, 3, creature.id);
    assert.ok(creature.habitatProfile.territoryIds.length > 0, creature.id);
    assert.ok(creature.habitatProfile.suitabilitySignature.startsWith(`${creature.id}:`), creature.id);
    assert.equal(creature.mechanicContract.implementationStatus, "specified", creature.id);
    assert.ok(!signatures.has(creature.designSignature), `duplicate signature for ${creature.id}`);
    assert.ok(!handlers.has(creature.mechanicContract.handlerId), `duplicate handler for ${creature.id}`);
    signatures.add(creature.designSignature);
    handlers.add(creature.mechanicContract.handlerId);
    if (creature.rank === "boss" || creature.rank === "miniboss") assert.equal(creature.habitatProfile.uniqueAnchorId, `anchor_${creature.id}`);
  }
  const hearthmereResident = BESTIARY.find(({ id }) => id === "ledger_crawler");
  assert.deepEqual(hearthmereResident?.habitatProfile.territoryIds, ["territory.graven-march"]);
  assert.deepEqual(hearthmereResident?.habitatProfile.siteIds, ["site.hearthmere"]);
});

test("the preserved 78 use authored horror language and individualized authoritative timings", () => {
  const originals = ORIGINAL_IDS.map((id) => BESTIARY.find((creature) => creature.id === id));
  assert.equal(originals.every(Boolean), true);

  const anatomy = new Set<string>();
  const locomotion = new Set<string>();
  const audio = new Set<string>();
  const timings = new Set<string>();
  for (const creature of originals) {
    assert.ok(creature);
    assert.doesNotMatch(creature.anatomy.anatomicalViolation, /bears .* as a structural violation/i, creature.id);
    assert.doesNotMatch(creature.locomotion.rule, /approaches with a/i, creature.id);
    assert.doesNotMatch(creature.horrorLanguage.audio, /announces its hunting rhythm through/i, creature.id);
    anatomy.add(creature.anatomy.anatomicalViolation);
    locomotion.add(creature.locomotion.rule);
    audio.add(creature.horrorLanguage.audio);
    const move = creature.moves.at(-1)!;
    timings.add(`${move.timing.startup}:${move.timing.active}:${move.timing.recovery}`);
  }

  assert.equal(anatomy.size, ORIGINAL_IDS.length);
  assert.equal(locomotion.size, ORIGINAL_IDS.length);
  assert.equal(audio.size, ORIGINAL_IDS.length);
  assert.equal(timings.size, ORIGINAL_IDS.length);
});

test("locked six-form families have the required shape and content stays inside horror boundaries", () => {
  const locked = ["shuttered_ward", "charnel_measures", "black_sluice", "last_pest_cart", "breath_tithe", "white_ague", "pallid_root_communion", "anchored_quarantine"];
  for (const familyId of locked) {
    const forms = BESTIARY.filter((creature) => creature.familyId === familyId);
    assert.equal(forms.length, 6, familyId);
    assert.deepEqual(
      Object.fromEntries(["regular", "specialist", "elite", "miniboss", "boss"].map((rank) => [rank, forms.filter((creature) => creature.rank === rank).length])),
      { regular: 2, specialist: 1, elite: 1, miniboss: 1, boss: 1 },
      familyId,
    );
  }
  const corpus = JSON.stringify(BESTIARY).toLowerCase();
  for (const term of ["subhuman", "tuberculosis", "leprosy", "cholera", "smallpox", "influenza"]) assert.equal(corpus.includes(term), false, term);
  assert.equal(BESTIARY.some(({ maturity }) => maturity.production_asset || maturity.playtested), false);
});

test("canonical validator enforces all roster and V3 invariants", () => {
  const validation = validateBestiary();
  assert.equal(validation.valid, true, JSON.stringify(validation.errors, null, 2));
  assert.deepEqual(validation.stats, { enemies: 178, families: 21, bosses: 21 });
});
