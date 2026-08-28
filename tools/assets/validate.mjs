#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { loadWorldContent, validateWorldContent } from "./lib/world-content.mjs";

function parseArgs(argv) {
  const options = { json: false, strictProduction: false, rootDir: resolve(dirname(fileURLToPath(import.meta.url)), "../.."), overrides: {} };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--json") options.json = true;
    else if (argument === "--strict-production") options.strictProduction = true;
    else if (argument === "--root") options.rootDir = resolve(argv[++index]);
    else if (["--assets", "--licenses", "--scene"].includes(argument)) options.overrides[argument.slice(2)] = argv[++index];
    else throw new Error(`Unknown argument ${argument}`);
  }
  return options;
}

function printHuman(result) {
  const mark = result.valid ? "PASS" : "FAIL";
  console.log(`${mark} Hearthmere world-content validation`);
  console.log(`  scene ${result.summary.sceneId} · ${result.summary.chunks} chunks · ${result.summary.assets} assets · ${result.summary.instances} instances`);
  console.log(`  navigation ${result.summary.navCells} cells / ${result.summary.navLinks} links · ${result.summary.colliders} colliders · ${result.summary.occluders} occluders`);
  console.log(`  atmosphere ${result.summary.lights} lights · ${result.summary.vfxZones} VFX zones · ${result.summary.audioZones} audio zones`);
  console.log(`  provenance ${result.summary.provenanceSources} sources / ${result.summary.licenses} licenses`);
  for (const warning of result.warnings) console.log(`WARN [${warning.code}] ${warning.path}: ${warning.message}`);
  for (const error of result.errors) console.error(`ERROR [${error.code}] ${error.path}: ${error.message}`);
}

try {
  const options = parseArgs(process.argv.slice(2));
  const manifests = await loadWorldContent(options.rootDir, options.overrides);
  const result = await validateWorldContent(manifests, { rootDir: options.rootDir, strictProduction: options.strictProduction });
  if (options.json) console.log(JSON.stringify(result, null, 2)); else printHuman(result);
  if (!result.valid) process.exitCode = 1;
} catch (error) {
  console.error(`Hearthmere asset validation could not run: ${error.message}`);
  process.exitCode = 1;
}
