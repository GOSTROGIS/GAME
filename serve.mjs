import { createServer } from "node:http";
import { open, stat } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = normalize(fileURLToPath(new URL("./", import.meta.url)));
const port = Number(process.env.PORT) || 4173;
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".gltf": "model/gltf+json",
  ".glb": "model/gltf-binary",
  ".bin": "application/octet-stream",
  ".ktx2": "image/ktx2",
  ".wasm": "application/wasm",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

const server = createServer(async (request, response) => {
  let file;
  try {
    const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
    const requestPath = decodeURIComponent(url.pathname);
    let filePath = normalize(join(root, requestPath === "/" ? "index.html" : requestPath));
    if (!filePath.startsWith(root)) throw new Error("Path outside game root");
    if ((await stat(filePath)).isDirectory()) filePath = join(filePath, "index.html");
    file = await open(filePath, "r");
    const metadata = await file.stat();
    if (!metadata.isFile()) throw new Error("Not a regular file");
    response.writeHead(200, {
      "content-type": mime[extname(filePath)] || "application/octet-stream",
      "cache-control": "no-cache",
      "content-length": metadata.size,
    });
    if (request.method === "HEAD") {
      response.end();
    } else {
      // Backpressure bounds memory even when serving large assets to slow clients.
      await pipeline(file.createReadStream({ autoClose: false }), response);
    }
  } catch {
    if (response.headersSent || response.destroyed) {
      response.destroy();
      return;
    }
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  } finally {
    await file?.close().catch(() => {});
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`The Hollow March is running at http://127.0.0.1:${port}`);
  console.log("Press Ctrl+C to stop.");
});
