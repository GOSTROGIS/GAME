import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { basename, join } from "node:path";
import { test } from "node:test";

const root = new URL("../", import.meta.url);

test("static server streams files and returns metadata without a body for HEAD", async (t) => {
  const reservation = createServer();
  reservation.listen(0, "127.0.0.1");
  await once(reservation, "listening");
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  const server = spawn(process.execPath, ["serve.mjs"], {
    cwd: root,
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  t.after(async () => {
    if (server.exitCode === null) {
      const exited = once(server, "exit");
      server.kill();
      await exited;
    }
  });
  await Promise.race([
    once(server.stdout, "data"),
    once(server, "exit").then(([code]) => { throw new Error(`Server exited: ${code}`); }),
  ]);
  const base = `http://127.0.0.1:${port}`;
  const fixtureDirectory = await mkdtemp(new URL(".serve-test-", root));
  t.after(() => rm(fixtureDirectory, { recursive: true, force: true }));
  const largeAsset = Buffer.alloc(2 * 1024 * 1024, 42);
  await writeFile(join(fixtureDirectory, "asset.glb"), largeAsset);
  const assetUrl = `${base}/${basename(fixtureDirectory)}/asset.glb`;
  const asset = await fetch(assetUrl);
  assert.equal(asset.status, 200);
  assert.equal(asset.headers.get("content-type"), "model/gltf-binary");
  assert.equal(asset.headers.get("content-length"), String(largeAsset.length));
  assert.deepEqual(Buffer.from(await asset.arrayBuffer()), largeAsset);
  const interrupted = await fetch(assetUrl);
  assert.equal(interrupted.status, 200);
  await interrupted.body.cancel();
  const expected = await readFile(new URL("index.html", root));
  const get = await fetch(base);
  assert.equal(get.status, 200);
  assert.equal(get.headers.get("content-type"), "text/html; charset=utf-8");
  assert.equal(get.headers.get("cache-control"), "no-cache");
  assert.equal(get.headers.get("content-length"), String(expected.length));
  assert.deepEqual(Buffer.from(await get.arrayBuffer()), expected);
  const head = await fetch(base, { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(head.headers.get("content-length"), String(expected.length));
  assert.equal(await head.text(), "");
  const missing = await fetch(`${base}/not-a-real-game-file`);
  assert.equal(missing.status, 404);
  assert.equal(await missing.text(), "Not found");
  const malformed = await fetch(`${base}/%ZZ`);
  assert.equal(malformed.status, 404);
});
