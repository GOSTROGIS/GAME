#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  EXPANSION_QUESTS,
  questSimilarity,
  validateNarrativeExpansion,
} from "../../packages/content/src/narrative.data.js";

const HEX_256 = /^[a-f0-9]{64}$/;
const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const EVIDENCE_DIR = resolve(ROOT, "design-review/quest-release-evidence");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const stableBytes = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");

const fail = (message) => {
  throw new Error(message);
};

const definitionPath = process.argv[2];
if (!definitionPath) fail("Usage: node tools/narrative/build-quest-batch-evidence.mjs <review-definition.json>");

const absoluteDefinitionPath = resolve(process.cwd(), definitionPath);
const definition = JSON.parse(await readFile(absoluteDefinitionPath, "utf8"));
if (definition.schemaVersion !== 1) fail("Review definition schemaVersion must be 1.");
if (!/^quest-batch-\d{4}$/.test(definition.batchId ?? "")) fail(`Invalid batch id: ${definition.batchId}`);
if (!Array.isArray(definition.questIds) || definition.questIds.length !== 12 || new Set(definition.questIds).size !== 12) {
  fail("A standard evidence packet needs exactly twelve unique quest ids.");
}

const narrativeValidation = validateNarrativeExpansion();
if (!narrativeValidation.valid) fail(`Canonical narrative is invalid: ${JSON.stringify(narrativeValidation.errors)}`);

const canonicalById = new Map(EXPANSION_QUESTS.map((quest) => [quest.id, quest]));
const canonicalQuests = definition.questIds.map((id) => canonicalById.get(id) ?? fail(`Unknown canonical quest: ${id}`));
const reviewByQuestId = new Map((definition.questReviews ?? []).map((entry) => [entry.id, entry]));
const attestationByRole = new Map((definition.reviewerAttestations ?? []).map((entry) => [entry.reviewerRole, entry]));

for (const quest of canonicalQuests) {
  const review = reviewByQuestId.get(quest.id) ?? fail(`Missing semantic review row for ${quest.id}.`);
  if (review.verdict !== "PASS") fail(`Semantic review did not pass for ${quest.id}.`);
  if (!review.authorRole || !Array.isArray(review.reviewerRoles) || review.reviewerRoles.length !== 2 || new Set(review.reviewerRoles).size !== 2) {
    fail(`Exactly two distinct reviewer roles are required for ${quest.id}.`);
  }
  if (review.reviewerRoles.includes(review.authorRole)) fail(`Author self-approval in ${quest.id}.`);
  for (const role of review.reviewerRoles) {
    const attestation = attestationByRole.get(role) ?? fail(`Missing attestation for ${role}.`);
    if (attestation.verdict !== "PASS" || !HEX_256.test(attestation.reviewedPayloadSha256 ?? "")) {
      fail(`Attestation for ${role} is not a passing, content-addressed review.`);
    }
    if (!(attestation.questIds ?? []).includes(quest.id)) fail(`${role} did not attest ${quest.id}.`);
  }
}

const packet = {
  schemaVersion: 1,
  kind: "quest-batch-packet",
  batchId: definition.batchId,
  questIds: definition.questIds,
  sourceReviewPayloads: definition.sourceReviewPayloads ?? [],
  canonicalQuests,
};
const packetBytes = stableBytes(packet);
const packetSha256 = sha256(packetBytes);

let maxSimilarity = { score: 0, left: null, right: null };
for (const quest of canonicalQuests) {
  for (const other of EXPANSION_QUESTS) {
    if (quest.id === other.id) continue;
    const score = questSimilarity(quest, other);
    if (score > maxSimilarity.score) maxSimilarity = { score, left: quest.id, right: other.id };
  }
}

const collisionReport = {
  schemaVersion: 1,
  kind: "semantic-collision-report",
  batchId: definition.batchId,
  packetSha256,
  verdict: "PASS",
  corpusQuestCount: EXPANSION_QUESTS.length,
  machineChecks: {
    canonicalNarrativeValidator: "PASS",
    maxPairwiseShingleSimilarity: maxSimilarity,
    note: "Shingle similarity is warning evidence only; the listed non-author semantic attestations control admission.",
  },
  reviewerAttestations: definition.reviewerAttestations,
  quests: canonicalQuests.map((quest) => {
    const review = reviewByQuestId.get(quest.id);
    return {
      id: quest.id,
      verdict: "PASS",
      authorRole: review.authorRole,
      reviewerRoles: review.reviewerRoles,
      distinctDramaticWork: review.distinctDramaticWork ?? quest.authorshipProof.forbiddenSubstitution,
      canonicalForbiddenSubstitution: quest.authorshipProof.forbiddenSubstitution,
    };
  }),
};
const collisionBytes = stableBytes(collisionReport);

const stateOwnerByKey = new Map(EXPANSION_QUESTS.flatMap((quest) => (quest.stateWrites ?? []).map((write) => [write.key, { quest, write }])));
const stateRows = canonicalQuests.map((quest) => {
  const stateReads = quest.stateReads ?? [];
  const readProofs = stateReads.map((read) => {
    const owner = stateOwnerByKey.get(read.key) ?? fail(`No writer exists for ${quest.id} read ${read.key}.`);
    const writerValues = owner.write.values;
    const coveredValues = read.values;
    if (!coveredValues.every((value) => writerValues.includes(value))) fail(`${quest.id} reads an impossible value from ${read.key}.`);
    if (read.mode === "all-values" && JSON.stringify(coveredValues) !== JSON.stringify(writerValues)) {
      fail(`${quest.id} does not cover all ordered values from ${read.key}.`);
    }
    return {
      key: read.key,
      mode: read.mode,
      writerQuestId: owner.quest.id,
      writerValues,
      admittedValues: coveredValues,
      verdict: "PASS",
    };
  });
  return {
    id: quest.id,
    verdict: "PASS",
    stateReads,
    stateWrites: quest.stateWrites ?? [],
    readProofs,
  };
});
const stateReport = {
  schemaVersion: 1,
  kind: "state-reachability-report",
  batchId: definition.batchId,
  packetSha256,
  verdict: "PASS",
  quests: stateRows,
};
const stateBytes = stableBytes(stateReport);

await mkdir(EVIDENCE_DIR, { recursive: true });
const outputs = [
  [`${definition.batchId}.packet.json`, packetBytes],
  [`${definition.batchId}.collision.json`, collisionBytes],
  [`${definition.batchId}.state.json`, stateBytes],
];
for (const [name, bytes] of outputs) {
  const outputPath = resolve(EVIDENCE_DIR, name);
  if (dirname(outputPath) !== EVIDENCE_DIR) fail(`Refusing to write outside evidence directory: ${name}`);
  await writeFile(outputPath, bytes);
}

process.stdout.write(`${JSON.stringify({
  batchId: definition.batchId,
  packetSha256,
  collisionReportSha256: sha256(collisionBytes),
  stateReportSha256: sha256(stateBytes),
  questCount: canonicalQuests.length,
  maxSimilarity,
}, null, 2)}\n`);
