import { defineConfig } from "vite";
import { cp, stat } from "node:fs/promises";
import { resolve } from "node:path";

const workspaceRoot = resolve(import.meta.dirname, "../..");
const clientOutDir = resolve(workspaceRoot, "dist/client");

export default defineConfig({
  root: workspaceRoot,
  publicDir: false,
  plugins: [{
    name: "sable-reach-bridge-runtime-assets",
    async closeBundle() {
      const source = resolve(workspaceRoot, "assets/3d/runtime/bridge");
      await stat(source);
      await cp(source, resolve(clientOutDir, "assets/3d/runtime/bridge"), { recursive: true });
    },
  }],
  server: { host: "127.0.0.1", port: 4173, strictPort: true },
  // Workspace junctions are intentionally not traversed by the dev optimizer.
  // The network adapter loads Colyseus' official self-contained browser build.
  optimizeDeps: { noDiscovery: true, include: [] },
  build: {
    outDir: clientOutDir,
    emptyOutDir: true,
    target: "es2022",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/three/")) return "three-runtime";
          if (id.includes("/node_modules/@colyseus/") || id.includes("/node_modules/ws/")) return "shared-world-client";
        },
      },
    },
  },
});
