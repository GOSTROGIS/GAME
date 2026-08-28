import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?:([A-Za-z]):)/, "$1:")), "../..");
const result = spawnSync(process.execPath, [path.join(root, "tools/assets/validate-bridge.mjs"), "--metadata-only", "--strict-production"], { cwd: root, encoding: "utf8" });
assert.equal(result.status, 1, "bridge strict-production validation must stay red while prototypes remain");
assert.match(result.stderr, /120 prototype assets remain red/);
assert.equal((result.stderr.match(/ERROR \[production_gate\]/g) ?? []).length, 120);
console.log("PASS bridge production gate rejects all 96 derivatives and 24 representative seed prototypes");
