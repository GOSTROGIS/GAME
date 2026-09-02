import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import worldContract, { QUEST_WAVE_04_WORLD_CONTRACT } from "../packages/content/src/quest-wave-04.world.js";
import { QUEST_WAVE_04_ACCEPTANCE, QUEST_WAVE_04_SOURCE } from "../packages/content/src/quest-wave-04.data.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const fixture = JSON.parse(await readFile(new URL("./fixtures/quest-wave-04-v11.json", import.meta.url), "utf8"));
const packageJson = JSON.parse(await readFile(new URL("../packages/content/package.json", import.meta.url), "utf8"));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

const expectedExports = {
  [fixture.packageExports.lightweight]: {
    types: "./src/quest-wave-04.data.d.ts",
    import: "./dist/quest-wave-04.data.js",
  },
  [fixture.packageExports.runtime]: {
    types: "./src/quest-wave-04.runtime.d.ts",
    import: "./dist/quest-wave-04.runtime.js",
  },
  [fixture.packageExports.world]: {
    types: "./src/quest-wave-04.world.d.ts",
    import: "./dist/quest-wave-04.world.js",
  },
};
for (const [subpath, target] of Object.entries(expectedExports)) assert.deepEqual(packageJson.exports[subpath], target);

for (const target of Object.values(expectedExports)) {
  await access(resolve(root, "packages/content", target.types));
  const sourcePath = target.import.replace("./dist/", "./src/");
  await access(resolve(root, "packages/content", sourcePath));
}

const rootIndex = await readFile(new URL("../packages/content/src/index.ts", import.meta.url), "utf8");
const lightweightSource = await readFile(new URL("../packages/content/src/quest-wave-04.data.js", import.meta.url), "utf8");
const rootSpatialSource = await readFile(new URL("../packages/content/src/world-spatial.data.js", import.meta.url), "utf8");
assert.doesNotMatch(rootIndex, /quest-wave-04\.world/i, "full world contract must not be root-exported");
assert.doesNotMatch(lightweightSource, /from\s+["'][^"']*quest-wave-04-v11\.world\.json/i, "lightweight wave must not import full world data");
assert.doesNotMatch(rootSpatialSource, /from\s+["'][^"']*quest-wave-04-v11\.world\.json/i, "root world-spatial surface must use only the compact index");

const worldBinding = fixture.projections.world;
const worldBytes = await readFile(resolve(root, worldBinding.path));
assert.equal(worldBytes.length, worldBinding.bytes);
assert.equal(sha256(worldBytes), worldBinding.sha256);
assert.equal(worldContract, QUEST_WAVE_04_WORLD_CONTRACT);
assert.equal(worldContract.kind, "quest-wave-world-blockout-contract");
assert.deepEqual(worldContract.sourceBinding, fixture.source);
assert.equal(Object.isFrozen(worldContract), true);
assert.equal(Object.isFrozen(worldContract.environmentPrograms), true);

const acceptedWorld = QUEST_WAVE_04_ACCEPTANCE.derivedInterfaces.find(({ path }) => path === worldBinding.path);
assert.deepEqual(acceptedWorld, worldBinding);
assert.equal(QUEST_WAVE_04_ACCEPTANCE.maturity.productionGeometry, "unassessed");
assert.equal(QUEST_WAVE_04_ACCEPTANCE.authorityBoundary.atlasPlacement, "provisional_placement");
assert.equal(QUEST_WAVE_04_ACCEPTANCE.authorityBoundary.runtimePerformance, "unverified");
assert.equal(QUEST_WAVE_04_ACCEPTANCE.authorityBoundary.staticModels, "unassessed_unless_explicitly_linked");
assert.equal(QUEST_WAVE_04_ACCEPTANCE.authorityBoundary.animatedModels, "unassessed_unless_explicitly_linked");
assert.equal(Object.hasOwn(QUEST_WAVE_04_SOURCE, "environmentPrograms"), false, "lightweight source must omit full environment programs");
assert.equal(Object.hasOwn(QUEST_WAVE_04_SOURCE, "creatureHabitatEnvelopes"), false, "lightweight source must omit full habitat overlays");
assert.equal(Object.hasOwn(QUEST_WAVE_04_SOURCE, "existingCreatureEcologyDeepenings"), false, "lightweight source must omit full ecology deepening records");

const publishedWorld = worldBytes.toString("utf8");
assert.doesNotMatch(publishedWorld, /(?:[A-Za-z]:\\|file:\/\/|https?:\/\/|drive\.google\.com|\/Users\/|\\Users\\)/i);
assert.doesNotMatch(publishedWorld, /(?:[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|session[_-]?id|call[_-]?id|user(?:name)?[_-]?id)/i);
assert.doesNotMatch(publishedWorld, /\b(?:claude|chatgpt|openai|anthropic|gemini|midjourney)\b/i);
assert.match(publishedWorld, /"atlasPlacement": "provisional_placement"/);
assert.match(publishedWorld, /"productionGeometry": false/);
assert.match(publishedWorld, /"constructionReady": false/);

console.log(JSON.stringify({
  valid: true,
  packageExports: fixture.packageExports,
  fullWorld: worldBinding,
  fullWorldRootExported: false,
}, null, 2));
