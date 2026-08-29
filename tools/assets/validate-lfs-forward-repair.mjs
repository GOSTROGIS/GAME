#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const POINTER = /^version https:\/\/git-lfs\.github\.com\/spec\/v1\r?\noid sha256:([a-f0-9]{64})\r?\nsize (\d+)\r?\n?$/;
const HISTORICAL_LFS_EXTENSION = /\.(?:blend|flac|glb|gpkg|ktx2|tif|tiff|wav)$/i;

const issue = (items, code, filePath, message) => items.push({ code, path: filePath, message });

async function trackedPointers(rootDir) {
  const { stdout } = await execFileAsync("git", ["ls-files", "-z"], {
    cwd: rootDir,
    encoding: "buffer",
    maxBuffer: 10_000_000,
    windowsHide: true,
  });
  const paths = stdout.toString("utf8").split("\0").filter((item) => HISTORICAL_LFS_EXTENSION.test(item));
  const pointers = new Map();
  for (const filePath of paths) {
    const { stdout: text } = await execFileAsync("git", ["show", `:${filePath}`], {
      cwd: rootDir,
      encoding: "utf8",
      maxBuffer: 1_000_000,
      windowsHide: true,
    });
    const match = text.match(POINTER);
    if (match) pointers.set(filePath.replaceAll("\\", "/"), { oidSha256: match[1], bytes: Number(match[2]) });
  }
  return pointers;
}

async function localMediaDirectory(rootDir) {
  const { stdout } = await execFileAsync("git", ["rev-parse", "--git-common-dir"], { cwd: rootDir, windowsHide: true });
  return path.resolve(rootDir, stdout.trim(), "lfs", "objects");
}

async function inspectLocalObject(mediaDir, oidSha256) {
  const objectPath = path.join(mediaDir, oidSha256.slice(0, 2), oidSha256.slice(2, 4), oidSha256);
  try {
    await access(objectPath);
    const [buffer, fileStat] = await Promise.all([readFile(objectPath), stat(objectPath)]);
    return { available: true, bytes: fileStat.size, sha256: createHash("sha256").update(buffer).digest("hex") };
  } catch {
    return { available: false };
  }
}

export async function validateLfsForwardRepair({
  rootDir,
  manifestPath = "tools/assets/lfs-forward-repair.manifest.json",
  requireResolved = false,
} = {}) {
  const errors = [];
  const workspace = path.resolve(rootDir ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.."));
  let manifest;
  try {
    manifest = JSON.parse(await readFile(path.resolve(workspace, manifestPath), "utf8"));
  } catch (error) {
    return { valid: false, errors: [{ code: "invalid_lfs_repair_manifest", path: manifestPath, message: error.message }], summary: {} };
  }
  if (manifest.schema !== "LfsForwardRepairManifestV1") issue(errors, "invalid_lfs_repair_schema", manifestPath, `received ${manifest.schema ?? "no schema"}`);

  let pointers;
  let mediaDir;
  try {
    [pointers, mediaDir] = await Promise.all([trackedPointers(workspace), localMediaDirectory(workspace)]);
  } catch (error) {
    return { valid: false, errors: [{ code: "lfs_catalog_unavailable", path: manifestPath, message: error.message }], summary: {} };
  }

  const records = new Map();
  let recovered = 0;
  let unresolved = 0;
  let expectedBytes = 0;
  for (const record of manifest.records ?? []) {
    if (!record?.path || records.has(record.path)) {
      issue(errors, "duplicate_lfs_repair_record", record?.path ?? manifestPath, "record paths must be present and unique");
      continue;
    }
    records.set(record.path, record);
    expectedBytes += Number.isInteger(record.bytes) ? record.bytes : 0;
    const pointer = pointers.get(record.path);
    if (!pointer) {
      issue(errors, "stale_lfs_repair_record", record.path, "manifest path is not a current historical LFS pointer");
      continue;
    }
    if (pointer.oidSha256 !== record.oidSha256 || pointer.bytes !== record.bytes) {
      issue(errors, "lfs_repair_claim_mismatch", record.path, "manifest OID or byte count disagrees with the tracked pointer");
    }
    if (!record.forwardAction || !["unresolved_exact_payload", "recovered_exact_payload"].includes(record.status)) {
      issue(errors, "incomplete_lfs_repair_record", record.path, "record needs a supported status and forward action");
    }
    const local = await inspectLocalObject(mediaDir, record.oidSha256);
    if (local.available && (local.sha256 !== record.oidSha256 || local.bytes !== record.bytes)) {
      issue(errors, "invalid_local_lfs_object", record.path, "local media object does not satisfy the pointer claim");
    } else if (local.available) {
      recovered += 1;
      if (record.status !== "recovered_exact_payload") issue(errors, "stale_unresolved_lfs_status", record.path, "an exact local payload exists; mark this record recovered");
    } else {
      unresolved += 1;
      if (record.status === "recovered_exact_payload") issue(errors, "missing_recovered_lfs_object", record.path, "manifest claims recovery but the exact local object is absent");
      if (requireResolved) issue(errors, "unresolved_lfs_payload", record.path, "release requires an exact payload or a completed forward replacement");
    }
  }
  for (const pointerPath of pointers.keys()) {
    if (!records.has(pointerPath)) issue(errors, "missing_lfs_repair_record", pointerPath, "current historical pointer is absent from the repair manifest");
  }

  if (manifest.summary?.pointerClaims !== pointers.size || manifest.summary?.unresolved !== unresolved || manifest.summary?.exactPayloadsRecovered !== recovered || manifest.summary?.expectedBytes !== expectedBytes) {
    issue(errors, "lfs_repair_summary_mismatch", manifestPath, "summary does not match the verified pointer catalog and local-media state");
  }
  return { valid: errors.length === 0, errors, summary: { pointerClaims: pointers.size, recovered, unresolved, expectedBytes } };
}

function parseArgs(argv) {
  const options = { json: false, requireResolved: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--json") options.json = true;
    else if (argument === "--require-resolved") options.requireResolved = true;
    else if (argument === "--root") options.rootDir = path.resolve(argv[++index]);
    else if (argument === "--manifest") options.manifestPath = argv[++index];
    else throw new Error(`Unknown argument ${argument}`);
  }
  return options;
}

try {
  const options = parseArgs(process.argv.slice(2));
  const result = await validateLfsForwardRepair(options);
  if (options.json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`${result.valid ? "PASS" : "FAIL"} LFS forward-repair manifest`);
    if (result.summary.pointerClaims !== undefined) console.log(`  ${result.summary.pointerClaims} claims · ${result.summary.recovered} recovered · ${result.summary.unresolved} unresolved · ${result.summary.expectedBytes} expected bytes`);
    for (const error of result.errors) console.error(`ERROR [${error.code}] ${error.path}: ${error.message}`);
  }
  if (!result.valid) process.exitCode = 1;
} catch (error) {
  console.error(`LFS forward-repair validation could not run: ${error.message}`);
  process.exitCode = 1;
}
