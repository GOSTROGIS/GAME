#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TEXT_FILE = /\.(?:cjs|html|js|json|jsx|md|mjs|ts|tsx|txt|ya?ml)$/i;
const RULES = [
  ["provider_execution_id", /\b(?:call_[a-z0-9]{12,}|exec-[0-9a-f-]{20,})(?:\.[a-z0-9]+)?\b/gi],
  ["private_identifier_key", /\b(?:accountId|callId|driveId|externalId|folderId|providerAccountId|sessionId|signedUrl|sourceImageId|supersedesSourceImageId|supersedesRejectedSource|userName)\b["']?\s*[:=]/gi],
  ["drive_url", /https?:\/\/(?:(?:drive|docs)\.google\.com|[\w.-]*googleusercontent\.com)\/[\w?&=./%-]+/gi],
  ["signed_url", /[?&](?:x-amz-[\w-]+|x-goog-[\w-]+|credential|expires|key|sig|signature|token)=[^\s"'<>]+/gi],
  ["email_address", /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi],
  ["workstation_path", /(?:^|[\s"'`(])(?:[a-z]:[\\/]|\\\\[^\\\s]+[\\/])[^\r\n"'`<>]*/gim],
];

async function walk(directory) {
  const files = [];
  try {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const item = path.join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await walk(item));
      else if (entry.isFile() && TEXT_FILE.test(entry.name)) files.push(item);
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return files;
}

export async function validateConceptArtPrivacy({ rootDir } = {}) {
  const workspace = path.resolve(rootDir ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.."));
  const roots = [
    path.join(workspace, "assets", "characters"),
    path.join(workspace, "assets", "bestiary"),
    path.join(workspace, "assets", "world"),
    path.join(workspace, "design-review"),
  ];
  const errors = [];
  const files = (await Promise.all(roots.map(walk))).flat();
  for (const file of files) {
    const relative = path.relative(workspace, file).replaceAll(path.sep, "/");
    const text = await readFile(file, "utf8");
    for (const [code, pattern] of RULES) {
      pattern.lastIndex = 0;
      for (const match of text.matchAll(pattern)) {
        const line = text.slice(0, match.index).split("\n").length;
        errors.push({ code, path: relative, line, message: `published concept-art surface contains ${code.replaceAll("_", " ")}` });
      }
    }
  }
  return { valid: errors.length === 0, errors, summary: { filesScanned: files.length } };
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const options = { json: false };
  for (let index = 2; index < process.argv.length; index += 1) {
    const argument = process.argv[index];
    if (argument === "--json") options.json = true;
    else if (argument === "--root") options.rootDir = path.resolve(process.argv[++index]);
    else throw new Error(`Unknown argument ${argument}`);
  }
  const result = await validateConceptArtPrivacy(options);
  if (options.json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`${result.valid ? "PASS" : "FAIL"} concept-art privacy validation`);
    console.log(`  ${result.summary.filesScanned} published text files scanned`);
    for (const error of result.errors) console.error(`ERROR [${error.code}] ${error.path}:${error.line}: ${error.message}`);
  }
  if (!result.valid) process.exitCode = 1;
}
