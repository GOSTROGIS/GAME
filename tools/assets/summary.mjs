#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { loadWorldContent, summarizeWorldContent, validateWorldContent } from "./lib/world-content.mjs";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const manifests = await loadWorldContent(rootDir);
const validation = await validateWorldContent(manifests, { rootDir, checkFiles: false });
const summary = summarizeWorldContent(manifests);

if (process.argv.includes("--json")) console.log(JSON.stringify({ ...summary, valid: validation.valid, errors: validation.errors.length, warnings: validation.warnings.length }, null, 2));
else {
  console.log(`${summary.sceneId}: ${summary.playableMeters.join(" x ")} metres in ${summary.chunks} chunks`);
  console.log(`${summary.assets} assets: ${Object.entries(summary.assetsByCategory).map(([category, count]) => `${count} ${category}`).join(", ")}`);
  console.log(`${summary.instances} instances, ${summary.navCells} nav cells, ${summary.navLinks} links, ${summary.interactionAnchors + summary.spawnAnchors} semantic anchors`);
  console.log(`Pipeline: ${Object.entries(summary.assetsByStatus).map(([status, count]) => `${count} ${status}`).join(", ")}`);
  console.log(`Validation: ${validation.valid ? "PASS" : "FAIL"} (${validation.errors.length} errors, ${validation.warnings.length} warnings)`);
}
