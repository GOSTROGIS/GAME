import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { canonicalJson, sanitizeId, sha256, within } from "./lib/canonical.mjs";
import { instrumentSource } from "./lib/instrument.mjs";
import { primitiveSceneToGlb, writePrimitiveSceneGlb } from "./lib/glb.mjs";
import { normalizeCapture } from "./lib/normalize.mjs";
import { assertSafeGameOutputRoots } from "./lib/safe-paths.mjs";

assert.equal(sanitizeId("Tower Crane~1 · 25000"), "tower-crane-dup1");
assert.equal(canonicalJson({ z: -0, a: 1.0000001 }), '{"a":1,"z":0}');
assert.equal(sha256({ b: 2, a: 1 }), sha256({ a: 1, b: 2 }));
assert.equal(within("C:\\safe", "C:\\safe\\file"), true);
assert.equal(within("C:\\safe", "C:\\safe-escape\\file"), false);

const instrumented = instrumentSource("let VIEW='iso',SXF=1,SYF=1,SZF=1,YAW=0,FLIP=false;function box(){};function add(){}", "fixture.js");
assert.match(instrumented, /__SLIP_CAPTURE__\.invoke\("box"/);
assert.match(instrumented, /__SLIP_CAPTURE__\.add/);

const polygonCapture = (sx) => normalizeCapture({
  view: "top",
  raw: [],
  events: [{ disposition: "supported", name: "poly", args: [[[0, 0, 0], [1, 0, 0], [0, 1, 0]]], state: { sx, sy: 1, sz: 1, yaw: 0 } }],
}, `polygon-${sx}`);
const triangleNormalY = (points) => {
  const [a, b, c] = points;
  const ab = b.map((value, index) => value - a[index]);
  const ac = c.map((value, index) => value - a[index]);
  return ab[2] * ac[0] - ab[0] * ac[2];
};
assert.ok(triangleNormalY(polygonCapture(1).events[0].points) > 0, "axis swap must correct polygon winding");
assert.ok(triangleNormalY(polygonCapture(-1).events[0].points) > 0, "mirrored fit must not double-reverse polygon winding");

const scene = {
  schema: "PrimitiveSceneV1",
  events: [
    { kind: "cuboid", min: [0, 0, 0], max: [1, 2, 3] },
    { kind: "cylinder", centerBase: [2, 0, 0], axis: [0, 1, 0], radius: 0.5, height: 2 },
    { kind: "tube", from: [0, 0, 0], to: [1, 1, 1], radius: 0.1 },
    { kind: "polygon", points: [[0, 0, 0], [1, 0, 0], [0, 0, 1]] }
  ]
};
const a = primitiveSceneToGlb(scene), b = primitiveSceneToGlb(scene);
assert.ok(a.equals(b));
assert.equal(a.readUInt32LE(0), 0x46546c67);
assert.equal(a.readUInt32LE(4), 2);
const temp = await mkdtemp(path.join(os.tmpdir(), "slipcurve-bridge-"));
const output = path.join(temp, "fixture.glb");
await writePrimitiveSceneGlb(scene, output);
assert.ok((await readFile(output)).equals(a));

const pathFixture = await mkdtemp(path.join(os.tmpdir(), "slipcurve-output-root-"));
try {
  const gameRoot = path.join(pathFixture, "game");
  const outside = path.join(pathFixture, "outside");
  await mkdir(path.join(gameRoot, "assets"), { recursive: true });
  await mkdir(outside, { recursive: true });
  await assertSafeGameOutputRoots(gameRoot, [path.join(gameRoot, "assets", "safe", "runtime")]);
  const redirectedRoot = path.join(gameRoot, "assets", "redirected");
  await symlink(outside, redirectedRoot, process.platform === "win32" ? "junction" : "dir");
  await assert.rejects(assertSafeGameOutputRoots(gameRoot, [redirectedRoot]), /symbolic link|reparse point/);
} finally {
  await rm(pathFixture, { recursive: true, force: true });
}

console.log("slipcurve bridge focused tests: 16/16 passed");
