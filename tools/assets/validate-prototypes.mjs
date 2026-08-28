#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("../..", import.meta.url).pathname.replace(/^\/(?:[A-Za-z]:)/, (value) => value.slice(1)));
const manifestPath = resolve(root, "packages/content/manifests/sable-reach.prototype-assets.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const errors = [];
if (manifest.schemaVersion !== 1 || manifest.classification !== "procedural_prototype_assets") errors.push("invalid prototype asset schema/classification");
if (manifest.assets?.length !== 21 || new Set(manifest.assets?.map(({ id }) => id)).size !== 21 || new Set(manifest.assets?.map(({ familyId }) => familyId)).size !== 21) errors.push("prototype manifest must contain 21 unique family assets");
for (const asset of manifest.assets ?? []) if (asset.id !== `prototype_creature.${asset.familyId}`) errors.push(`asset/family mismatch ${asset.id}`);
if (manifest.locationAssets?.length !== 7 || new Set(manifest.locationAssets?.map(({ id }) => id)).size !== 7 || new Set(manifest.locationAssets?.map(({ siteId }) => siteId)).size !== 7) errors.push("prototype manifest must contain seven unique location assets");
for (const asset of manifest.locationAssets ?? []) if (asset.id !== `prototype_location.${asset.siteId?.replace(/^site\./, "")}`) errors.push(`asset/site mismatch ${asset.id}`);
if (manifest.budgets?.productionAssetEquivalent !== false || manifest.maturity?.productionAsset !== false || manifest.maturity?.playtested !== false) errors.push("prototype asset maturity is overstated");
const source = await readFile(resolve(root, manifest.generator.sourcePath));
const digest = createHash("sha256").update(source).digest("hex");
if (digest !== manifest.generator.sourceSha256) errors.push(`prototype generator hash mismatch: expected ${manifest.generator.sourceSha256}, received ${digest}`);
const locationSource = await readFile(resolve(root, manifest.locationGenerator.sourcePath));
const locationDigest = createHash("sha256").update(locationSource).digest("hex");
if (locationDigest !== manifest.locationGenerator.sourceSha256) errors.push(`prototype location generator hash mismatch: expected ${manifest.locationGenerator.sourceSha256}, received ${locationDigest}`);
if (errors.length) { for (const error of errors) console.error(`ERROR ${error}`); process.exitCode = 1; }
else console.log(`PASS 21 creature and seven location prototype assets · generators ${digest.slice(0, 12)}/${locationDigest.slice(0, 12)} · production/playtest false`);
