#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?:([A-Za-z]):)/, "$1:")), "../..");
const validators = [
  [path.join(root, "tools/assets/validate.mjs"), "--strict-production"],
  [path.join(root, "tools/assets/validate-bridge.mjs"), "--strict-production"],
];
let failed = false;
for (const arguments_ of validators) {
  const result = spawnSync(process.execPath, arguments_, { cwd: root, encoding: "utf8" });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) failed = true;
}
if (failed) {
  console.error("FAIL combined production gate · Hearthmere and Slipcurve bridge prototypes remain intentionally red");
  process.exitCode = 1;
} else console.log("PASS combined production gate");
