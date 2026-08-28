import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const worldgenDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(worldgenDirectory, "..", "..");
const python = process.platform === "win32"
  ? path.join(worldgenDirectory, ".venv", "Scripts", "python.exe")
  : path.join(worldgenDirectory, ".venv", "bin", "python");

if (!existsSync(python)) {
  console.error("Sable Reach's pinned GIS environment is missing. Run `pnpm worldgen:setup` first.");
  process.exit(1);
}

const result = spawnSync(python, [path.join(worldgenDirectory, "generate.py"), ...process.argv.slice(2)], {
  cwd: projectRoot,
  env: process.env,
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
