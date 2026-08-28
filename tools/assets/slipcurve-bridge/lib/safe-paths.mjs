import { lstat, realpath } from "node:fs/promises";
import path from "node:path";
import { within } from "./canonical.mjs";

async function existingNonLinkChain(gameRoot, outputRoot, forbiddenReal) {
  const relative = path.relative(gameRoot, outputRoot);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error(`output root escapes GAME: ${outputRoot}`);
  let current = gameRoot;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    let info;
    try { info = await lstat(current); }
    catch (error) {
      if (error?.code === "ENOENT") break;
      throw error;
    }
    if (info.isSymbolicLink()) throw new Error(`output root or ancestor may not be a symbolic link/reparse point: ${current}`);
    const resolved = await realpath(current);
    if (!within(await realpath(gameRoot), resolved)) throw new Error(`output root resolves outside GAME: ${current}`);
    if (forbiddenReal && within(forbiddenReal, resolved)) throw new Error(`output root resolves inside the read-only source: ${current}`);
  }
}

/**
 * Refuses junction/symlink output redirection before a generator writes. Both
 * lexical and resolved paths must remain in GAME, and no existing component
 * may be a reparse point. Nonexistent tails are safe to create only below the
 * last verified ordinary directory.
 */
export async function assertSafeGameOutputRoots(gameRootInput, outputRoots, forbiddenRoot = null) {
  const gameRoot = path.resolve(gameRootInput);
  const gameInfo = await lstat(gameRoot);
  if (gameInfo.isSymbolicLink()) throw new Error("GAME root may not be a symbolic link/reparse point for asset generation");
  const gameReal = await realpath(gameRoot);
  const forbiddenReal = forbiddenRoot ? await realpath(path.resolve(forbiddenRoot)) : null;
  if (forbiddenReal && within(forbiddenReal, gameReal)) throw new Error("GAME output root may not be inside the read-only source repository");
  for (const rootInput of outputRoots) {
    const outputRoot = path.resolve(rootInput);
    if (!within(gameRoot, outputRoot)) throw new Error(`output root escapes GAME: ${outputRoot}`);
    await existingNonLinkChain(gameRoot, outputRoot, forbiddenReal);
    let outputInfo;
    try { outputInfo = await lstat(outputRoot); }
    catch (error) {
      if (error?.code === "ENOENT") continue;
      throw error;
    }
    if (outputInfo.isSymbolicLink()) throw new Error(`output root may not be a symbolic link/reparse point: ${outputRoot}`);
    const outputReal = await realpath(outputRoot);
    if (!within(gameReal, outputReal)) throw new Error(`output root resolves outside GAME: ${outputRoot}`);
    if (forbiddenReal && within(forbiddenReal, outputReal)) throw new Error(`output root resolves inside the read-only source: ${outputRoot}`);
  }
}
