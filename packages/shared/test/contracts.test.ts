import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_APPEARANCE_V2, HEARTHMERE_SITE_TRANSFORM, HEARTHMERE_SPATIAL_CONTEXT, MORPH_KEYS,
  PHASES, SAVE_SCHEMA_VERSION, SequenceGate, appearanceSignature, atlasToSiteTransform,
  migrateLegacyV3Save, migrateLegacyV3SaveToV5, migrateServerSaveToV5,
  migrateServerSaveV4ToV5, legacySaveFingerprint, phaseVisible, simulateMovement, siteToAtlasCoordinate,
  sha256Fingerprint, validateActionCommand, validateAppearanceV2,
} from "../src/index.js";

test("AppearanceV2 carries all sixteen creator morphs deterministically", () => {
  assert.equal(MORPH_KEYS.length, 16);
  assert.equal(validateAppearanceV2(DEFAULT_APPEARANCE_V2).ok, true);
  assert.equal(appearanceSignature(DEFAULT_APPEARANCE_V2), appearanceSignature(structuredClone(DEFAULT_APPEARANCE_V2)));
});

test("schema-v3 tile position migrates into Y-up meter space", () => {
  const legacy = { version: 3 as const, player: { x: 7.5, y: 11 }, character: { name: "Mara", origin: "mire_physicker", appearance: { morphs: { stature: 0.5 } } } };
  const save = migrateLegacyV3Save(legacy, "2026-08-23T00:00:00.000Z");
  assert.deepEqual(save.transform, { x: 30, y: 0, z: 44, yaw: 0 });
  assert.equal(save.character.appearance.morphs.stature, 0.5);
  assert.equal(save.character.appearance.originId, "mire_physicker");
});

test("authoritative movement normalizes diagonal input and remains inside half-open world bounds", () => {
  const transform = simulateMovement({ x: 95.9, y: 0, z: 95.9, yaw: 0 }, { sequence: 1, clientTick: 1, moveX: 1, moveZ: 1, yaw: 1, sprint: true }, 1);
  assert.equal(transform.x, 95.999);
  assert.equal(transform.z, 95.999);
  assert.equal(transform.yaw, 1);
});

test("sequence gate rejects replay and action validation requires targets", () => {
  const gate = new SequenceGate();
  assert.equal(gate.accept(4), true);
  assert.equal(gate.accept(4), false);
  assert.equal(validateActionCommand({ commandId: "cmd_1", sequence: 1, clientTick: 1, kind: "light_attack" }).ok, false);
  assert.equal(validateActionCommand({ commandId: "cmd_2", sequence: 2, clientTick: 2, kind: "light_attack", targetId: "enemy.ash-husk" }).ok, true);
});

test("legacy boundary coordinates never migrate onto the excluded 96 metre edge", () => {
  const save = migrateLegacyV3Save({ version: 3, player: { x: 24, y: 24 } });
  assert.ok(save.transform.x < 96 && save.transform.z < 96);
});

test("schema-v4 Hearthmere transforms migrate to v5 byte-for-byte", () => {
  const v4 = migrateLegacyV3Save({ version: 3, player: { x: 7.5, y: 11 } }, "2026-08-23T00:00:00.000Z");
  const transformBytes = JSON.stringify(v4.transform);
  const v5 = migrateServerSaveV4ToV5(v4);
  assert.equal(SAVE_SCHEMA_VERSION, 6);
  assert.equal(v5.version, 5);
  assert.strictEqual(v5.transform, v4.transform);
  assert.equal(JSON.stringify(v5.transform), transformBytes);
  assert.deepEqual(v5.spatial, HEARTHMERE_SPATIAL_CONTEXT);
});

test("schema-v3 replay metadata survives the direct v5 import flow", () => {
  const legacy = { version: 3 as const, player: { x: 3, y: 5 }, character: { name: "After" } };
  const importedAt = "2026-08-23T00:00:00.000Z";
  const v4 = migrateLegacyV3Save(legacy, importedAt);
  const v5 = migrateLegacyV3SaveToV5(legacy, importedAt);
  assert.deepEqual(v5.importedFrom, v4.importedFrom);
  assert.deepEqual(v5.legacyPayload, legacy);
  assert.strictEqual(migrateServerSaveToV5(v5), v5);
});

test("schema-v3 import fingerprint is canonical, stable, and content-sensitive", () => {
  const legacy = { version: 3 as const, player: { x: 3, y: 5 }, character: { name: "After" } };
  const reordered = { player: { y: 5, x: 3 }, character: { name: "After" }, version: 3 as const };
  assert.equal(legacySaveFingerprint(legacy), "d251f05df44e95eb62a4225d4c6279d800a0643b1f9fd63f272c9c816f5598aa");
  assert.equal(legacySaveFingerprint(reordered), legacySaveFingerprint(legacy));
  assert.notEqual(legacySaveFingerprint({ ...legacy, player: { x: 3, y: 6 } }), legacySaveFingerprint(legacy));
});

test("security-sensitive fingerprints use standard SHA-256", () => {
  assert.equal(sha256Fingerprint("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
});

test("Hearthmere site and atlas coordinate conversions round-trip within one millimetre", () => {
  const local = { x: 31.125, y: 2.75, z: 64.875, yaw: 1.25 };
  const atlas = siteToAtlasCoordinate(local, HEARTHMERE_SITE_TRANSFORM);
  assert.deepEqual(atlas, { easting: 6431.125, northing: 8255.125, elevation: 186.75 });
  const roundTrip = atlasToSiteTransform(atlas, local.yaw, HEARTHMERE_SITE_TRANSFORM);
  for (const key of ["x", "y", "z", "yaw"] as const) assert.ok(Math.abs(roundTrip[key] - local[key]) <= 0.001);
});

test("phase visibility permits only intersecting personal phase content", () => {
  assert.equal(phaseVisible(PHASES.PUBLIC | PHASES.HEARTHMERE_RESTORED, PHASES.HEARTHMERE_RESTORED), true);
  assert.equal(phaseVisible(PHASES.PUBLIC | PHASES.HEARTHMERE_UNRESTORED, PHASES.HEARTHMERE_RESTORED), false);
});
