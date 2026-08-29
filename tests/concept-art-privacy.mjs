import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { validateConceptArtPrivacy } from "../tools/assets/validate-concept-art-privacy.mjs";

const root = await mkdtemp(path.join(os.tmpdir(), "concept-art-privacy-"));
await mkdir(path.join(root, "assets/characters"), { recursive: true });
await mkdir(path.join(root, "assets/bestiary"), { recursive: true });
await mkdir(path.join(root, "design-review"), { recursive: true });
await writeFile(path.join(root, "assets/characters/clean.provenance.json"), JSON.stringify({ sha256: "a".repeat(64), path: "assets/characters/clean.png" }));

const clean = await validateConceptArtPrivacy({ rootDir: root });
assert.equal(clean.valid, true, JSON.stringify(clean.errors));

await writeFile(path.join(root, "design-review/leak.js"), "export const source = 'call_abcdefghijklmnop';\n");
const leaked = await validateConceptArtPrivacy({ rootDir: root });
assert.equal(leaked.valid, false);
assert.equal(leaked.errors.some(({ code, line }) => code === "provider_execution_id" && line === 1), true);
await rm(path.join(root, "design-review/leak.js"));

await writeFile(path.join(root, "design-review/private-keys.js"), "export const source = { driveId: 'private' };\n");
await writeFile(path.join(root, "assets/bestiary/signed.md"), "https://storage.example/art.png?x-goog-signature=private\n");
await writeFile(path.join(root, "assets/characters/path.json"), JSON.stringify({ note: "C:\\Users\\artist\\private.png" }));
const privateSurface = await validateConceptArtPrivacy({ rootDir: root });
assert.equal(privateSurface.valid, false);
assert.equal(privateSurface.errors.some(({ code }) => code === "private_identifier_key"), true);
assert.equal(privateSurface.errors.some(({ code }) => code === "signed_url"), true);
assert.equal(privateSurface.errors.some(({ code }) => code === "workstation_path"), true);

console.log("concept-art-privacy: clean content accepted and private identifiers, URLs, and paths rejected");
