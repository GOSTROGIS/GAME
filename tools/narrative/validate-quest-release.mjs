#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { EXPANSION_QUESTS } from "../../packages/content/src/narrative.data.js";
import { OPERATIONAL_READ_KIND, classifyStateRead } from "../../packages/content/src/quest-wave-04.runtime.js";

const LEDGER_URL = new URL("../../packages/content/src/quest-release-ledger.json", import.meta.url);
const HEX_256 = /^[a-f0-9]{64}$/;
const QUEST_WAVE_04_RUNTIME_SHA256 = "8a59a9bf876d22986e4d9ff801a3ddf35d52444beca5102cc7742e4d53f1b18e";
const BATCH_ID = /^quest-batch-(\d{4})$/;
const EVIDENCE_PATH = /^design-review\/quest-release-evidence\/quest-batch-\d{4}\.(packet|collision|state)\.json$/;
const PORTFOLIOS = Object.freeze([
  "main_cosmic",
  "faction_schism",
  "character_guest_follower",
  "regional",
  "settlement",
  "profession_systemic",
  "world_state_reaction",
  "relic_creature_ecology",
]);

const duplicateValues = (values) => {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
};

const issue = (path, code, detail) => ({ path, code, detail });
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const sameJson = (left, right) => JSON.stringify(left) === JSON.stringify(right);

export async function validateQuestRelease({ ledgerUrl = LEDGER_URL, requireTarget = false } = {}) {
  const ledger = JSON.parse(await readFile(ledgerUrl, "utf8"));
  const errors = [];
  const warnings = [];
  const canonicalById = new Map(EXPANSION_QUESTS.map((entry) => [entry.id, entry]));

  const readEvidence = async ({ batch, batchPath, pathField, hashField, kind }) => {
    const relativePath = batch[pathField];
    if (typeof relativePath !== "string" || !EVIDENCE_PATH.test(relativePath)) {
      errors.push(issue(`${batchPath}.${pathField}`, "invalid_evidence_path", relativePath));
      return null;
    }
    let bytes;
    try {
      bytes = await readFile(new URL(`../../${relativePath}`, import.meta.url));
    } catch (error) {
      errors.push(issue(`${batchPath}.${pathField}`, "missing_evidence_file", error.code ?? error.message));
      return null;
    }
    const actualHash = sha256(bytes);
    if (actualHash !== batch[hashField]) {
      errors.push(issue(`${batchPath}.${hashField}`, "evidence_hash_mismatch", `${batch[hashField]}/${actualHash}`));
    }
    let document;
    try {
      document = JSON.parse(bytes.toString("utf8"));
    } catch (error) {
      errors.push(issue(`${batchPath}.${pathField}`, "invalid_evidence_json", error.message));
      return null;
    }
    if (document.schemaVersion !== 1) errors.push(issue(`${batchPath}.${pathField}.schemaVersion`, "unsupported_evidence_schema", document.schemaVersion));
    if (document.kind !== kind) errors.push(issue(`${batchPath}.${pathField}.kind`, "unexpected_evidence_kind", document.kind));
    if (document.batchId !== batch.id) errors.push(issue(`${batchPath}.${pathField}.batchId`, "evidence_batch_mismatch", document.batchId));
    return document;
  };

  if (ledger.schemaVersion !== 1) errors.push(issue("schemaVersion", "unsupported_schema", ledger.schemaVersion));
  if (ledger.releaseId !== "sable-reach-5000") errors.push(issue("releaseId", "unexpected_release", ledger.releaseId));
  if (ledger.targetAcceptedQuests !== 5_000) errors.push(issue("targetAcceptedQuests", "target_drift", ledger.targetAcceptedQuests));
  if (ledger.standardBatchSize !== 12 || ledger.finalBatchSize !== 8 || ledger.expectedBatchCount !== 417) {
    errors.push(issue("batchPolicy", "batch_math_drift", `${ledger.standardBatchSize}/${ledger.finalBatchSize}/${ledger.expectedBatchCount}`));
  }
  if (ledger.standardBatchSize * (ledger.expectedBatchCount - 1) + ledger.finalBatchSize !== ledger.targetAcceptedQuests) {
    errors.push(issue("batchPolicy", "batch_math_invalid", "Batch cardinalities do not equal the release target."));
  }
  if (ledger.minimumStatefulContinuations !== 2_000) errors.push(issue("minimumStatefulContinuations", "continuation_floor_drift", ledger.minimumStatefulContinuations));

  const portfolioTargetKeys = Object.keys(ledger.portfolioTargets ?? {});
  if (PORTFOLIOS.some((key) => !portfolioTargetKeys.includes(key)) || portfolioTargetKeys.some((key) => !PORTFOLIOS.includes(key))) {
    errors.push(issue("portfolioTargets", "portfolio_keys_drift", portfolioTargetKeys));
  }
  const portfolioTargetTotal = Object.values(ledger.portfolioTargets ?? {}).reduce((total, value) => total + value, 0);
  if (portfolioTargetTotal !== ledger.targetAcceptedQuests) errors.push(issue("portfolioTargets", "portfolio_total_mismatch", portfolioTargetTotal));

  const acceptedBatches = ledger.acceptedBatches ?? [];
  const inReviewBatches = ledger.inReviewBatches ?? [];
  const acceptedQuestRows = [];
  const acceptedBatchNumbers = [];
  const portfolioCounts = Object.fromEntries(PORTFOLIOS.map((key) => [key, 0]));

  for (const [index, batch] of acceptedBatches.entries()) {
    const path = `acceptedBatches.${index}`;
    const match = BATCH_ID.exec(batch.id ?? "");
    if (!match) errors.push(issue(`${path}.id`, "invalid_batch_id", batch.id));
    const batchNumber = match ? Number(match[1]) : NaN;
    acceptedBatchNumbers.push(batchNumber);
    if (batch.status !== "accepted") errors.push(issue(`${path}.status`, "not_accepted", batch.status));

    const expectedSize = batchNumber === ledger.expectedBatchCount ? ledger.finalBatchSize : ledger.standardBatchSize;
    if (!Array.isArray(batch.quests) || batch.quests.length !== expectedSize) {
      errors.push(issue(`${path}.quests`, "invalid_batch_size", `${batch.quests?.length ?? "missing"}/${expectedSize}`));
    }
    for (const field of ["packetSha256", "collisionReportSha256", "stateReportSha256"]) {
      if (!HEX_256.test(batch[field] ?? "")) errors.push(issue(`${path}.${field}`, "invalid_sha256", batch[field]));
    }
    for (const [questIndex, row] of (batch.quests ?? []).entries()) {
      const rowPath = `${path}.quests.${questIndex}`;
      const quest = canonicalById.get(row.id);
      if (!quest) errors.push(issue(`${rowPath}.id`, "quest_not_canonical", row.id));
      if (!PORTFOLIOS.includes(row.portfolio)) errors.push(issue(`${rowPath}.portfolio`, "unknown_portfolio", row.portfolio));
      else {
        portfolioCounts[row.portfolio] += 1;
        if (quest && quest.portfolioId !== row.portfolio) errors.push(issue(`${rowPath}.portfolio`, "canonical_portfolio_mismatch", `${row.portfolio}/${quest.portfolioId}`));
      }
      if (!row.authorRole || typeof row.authorRole !== "string") errors.push(issue(`${rowPath}.authorRole`, "missing_author_role", row.authorRole));
      if (!Array.isArray(row.reviewerRoles) || row.reviewerRoles.length !== 2 || new Set(row.reviewerRoles).size !== 2) {
        errors.push(issue(`${rowPath}.reviewerRoles`, "requires_two_independent_reviewers", row.reviewerRoles));
      } else if (row.reviewerRoles.includes(row.authorRole)) {
        errors.push(issue(`${rowPath}.reviewerRoles`, "author_self_approval", row.authorRole));
      }
      if (quest) acceptedQuestRows.push({ batch, row, quest });
    }

    const canonicalQuests = (batch.quests ?? []).map(({ id }) => canonicalById.get(id)).filter(Boolean);
    const packet = await readEvidence({ batch, batchPath: path, pathField: "packetPath", hashField: "packetSha256", kind: "quest-batch-packet" });
    if (packet) {
      const questIds = (batch.quests ?? []).map(({ id }) => id);
      if (!sameJson(packet.questIds, questIds)) errors.push(issue(`${path}.packetPath.questIds`, "packet_quest_order_mismatch", packet.questIds));
      if (!sameJson(packet.canonicalQuests, canonicalQuests)) errors.push(issue(`${path}.packetPath.canonicalQuests`, "packet_canonical_payload_mismatch", batch.id));
    }

    const collision = await readEvidence({ batch, batchPath: path, pathField: "collisionReportPath", hashField: "collisionReportSha256", kind: "semantic-collision-report" });
    if (collision) {
      if (collision.packetSha256 !== batch.packetSha256) errors.push(issue(`${path}.collisionReportPath.packetSha256`, "report_packet_hash_mismatch", collision.packetSha256));
      if (collision.verdict !== "PASS") errors.push(issue(`${path}.collisionReportPath.verdict`, "collision_review_not_passed", collision.verdict));
      const attestations = collision.reviewerAttestations ?? [];
      const passedRoles = new Set(attestations.filter(({ verdict, reviewedPayloadSha256 }) => verdict === "PASS" && HEX_256.test(reviewedPayloadSha256 ?? "")).map(({ reviewerRole }) => reviewerRole));
      const questReviews = new Map((collision.quests ?? []).map((entry) => [entry.id, entry]));
      for (const row of (batch.quests ?? [])) {
        const review = questReviews.get(row.id);
        if (!review || review.verdict !== "PASS") errors.push(issue(`${path}.collisionReportPath.quests.${row.id}`, "quest_collision_review_not_passed", review?.verdict));
        if (review && !sameJson(review.reviewerRoles, row.reviewerRoles)) errors.push(issue(`${path}.collisionReportPath.quests.${row.id}.reviewerRoles`, "reviewer_role_mismatch", review.reviewerRoles));
        for (const role of row.reviewerRoles ?? []) {
          if (!passedRoles.has(role)) errors.push(issue(`${path}.collisionReportPath.reviewerAttestations`, "missing_passing_attestation", `${row.id}/${role}`));
        }
      }
    }

    const state = await readEvidence({ batch, batchPath: path, pathField: "stateReportPath", hashField: "stateReportSha256", kind: "state-reachability-report" });
    if (state) {
      if (state.packetSha256 !== batch.packetSha256) errors.push(issue(`${path}.stateReportPath.packetSha256`, "report_packet_hash_mismatch", state.packetSha256));
      if (state.verdict !== "PASS") errors.push(issue(`${path}.stateReportPath.verdict`, "state_review_not_passed", state.verdict));
      const stateRows = new Map((state.quests ?? []).map((entry) => [entry.id, entry]));
      for (const quest of canonicalQuests) {
        const stateRow = stateRows.get(quest.id);
        if (!stateRow || stateRow.verdict !== "PASS") errors.push(issue(`${path}.stateReportPath.quests.${quest.id}`, "quest_state_review_not_passed", stateRow?.verdict));
        if (stateRow && !sameJson(stateRow.stateReads, quest.stateReads ?? [])) errors.push(issue(`${path}.stateReportPath.quests.${quest.id}.stateReads`, "state_read_evidence_mismatch", quest.id));
        if (stateRow && !sameJson(stateRow.stateWrites, quest.stateWrites ?? [])) errors.push(issue(`${path}.stateReportPath.quests.${quest.id}.stateWrites`, "state_write_evidence_mismatch", quest.id));
        if (stateRow) {
          const reads = quest.stateReads ?? [];
          const proofs = stateRow.readProofs ?? [];
          if (proofs.length !== reads.length) errors.push(issue(`${path}.stateReportPath.quests.${quest.id}.readProofs`, "state_read_proof_count_mismatch", `${proofs.length}/${reads.length}`));
          reads.forEach((read, readIndex) => {
            const proof = proofs[readIndex];
            let classification;
            try {
              classification = classifyStateRead(read);
            } catch (error) {
              errors.push(issue(`${path}.stateReportPath.quests.${quest.id}.stateReads.${readIndex}`, "invalid_state_read_runtime_contract", error.message));
              return;
            }
            if (classification.kind === OPERATIONAL_READ_KIND) {
              if (classification.definition.questId !== quest.id
                || proof?.readKind !== OPERATIONAL_READ_KIND
                || proof?.definitionQuestId !== quest.id
                || proof?.domain !== read.domain
                || proof?.runtimeContractSha256 !== QUEST_WAVE_04_RUNTIME_SHA256) {
                errors.push(issue(`${path}.stateReportPath.quests.${quest.id}.readProofs.${readIndex}`, "operational_state_proof_mismatch", read.key));
              }
            } else if (!proof?.writerQuestId || (proof.readKind !== undefined && proof.readKind !== "narrative-state-v1")) {
              errors.push(issue(`${path}.stateReportPath.quests.${quest.id}.readProofs.${readIndex}`, "narrative_state_proof_mismatch", read.key));
            }
          });
        }
      }
    }
  }

  const duplicateBatchNumbers = duplicateValues(acceptedBatchNumbers.filter(Number.isFinite));
  if (duplicateBatchNumbers.length) errors.push(issue("acceptedBatches", "duplicate_batch_number", duplicateBatchNumbers));
  const sortedBatchNumbers = [...acceptedBatchNumbers].sort((a, b) => a - b);
  sortedBatchNumbers.forEach((batchNumber, index) => {
    if (batchNumber !== index + 1) errors.push(issue(`acceptedBatches.${index}.id`, "batch_sequence_gap", batchNumber));
  });

  const acceptedQuestIds = acceptedQuestRows.map(({ row }) => row.id);
  const duplicateQuestIds = duplicateValues(acceptedQuestIds);
  if (duplicateQuestIds.length) errors.push(issue("acceptedBatches.quests", "duplicate_quest_id", duplicateQuestIds));

  const supportOwners = acceptedQuestRows.flatMap(({ quest }) => quest.supportingCharacterIds ?? []);
  const duplicateSupportOwners = duplicateValues(supportOwners);
  if (duplicateSupportOwners.length) errors.push(issue("acceptedBatches.quests", "duplicate_exclusive_support", duplicateSupportOwners));
  acceptedQuestRows.forEach(({ row, quest }) => {
    if ((quest.supportingCharacterIds ?? []).length < 1) errors.push(issue(`quests.${row.id}.supportingCharacterIds`, "missing_exclusive_support", row.id));
    if (quest.schemaVersion === 9) {
      const structure = quest.signatureRewardStructure;
      if (!structure || !sameJson(structure.itemIds, quest.rewardItemIds ?? [])) {
        errors.push(issue(`quests.${row.id}.signatureRewardStructure`, "signature_reward_structure_mismatch", structure));
      } else if (structure.portableSignatureItemId !== null && !(quest.rewardItemIds ?? []).includes(structure.portableSignatureItemId)) {
        errors.push(issue(`quests.${row.id}.signatureRewardStructure.portableSignatureItemId`, "signature_reward_portable_item_mismatch", structure.portableSignatureItemId));
      } else if (structure.portableSignatureItemId === null && !structure.noPortableSignatureReason) {
        errors.push(issue(`quests.${row.id}.signatureRewardStructure.noPortableSignatureReason`, "missing_nonportable_signature_reason", row.id));
      }
    } else if ((quest.rewardItemIds ?? []).length !== 1) {
      errors.push(issue(`quests.${row.id}.rewardItemIds`, "signature_reward_cardinality", quest.rewardItemIds));
    }
  });

  const signatureRewardIds = acceptedQuestRows.flatMap(({ quest }) => quest.rewardItemIds ?? []);
  const duplicateRewardIds = duplicateValues(signatureRewardIds);
  if (duplicateRewardIds.length) errors.push(issue("acceptedBatches.quests", "duplicate_signature_reward", duplicateRewardIds));

  const statefulContinuationCount = acceptedQuestRows.filter(({ quest }) => (quest.stateReads ?? []).length > 0).length;
  const unledgeredCanonicalQuestIds = [...canonicalById.keys()].filter((id) => !acceptedQuestIds.includes(id));
  if (unledgeredCanonicalQuestIds.length) {
    warnings.push(issue("canonicalQuests", "not_release_attested", unledgeredCanonicalQuestIds));
  }

  const inReviewQuestIds = [];
  for (const [index, batch] of inReviewBatches.entries()) {
    const path = `inReviewBatches.${index}`;
    if (!BATCH_ID.test(batch.id ?? "")) errors.push(issue(`${path}.id`, "invalid_batch_id", batch.id));
    if (batch.status === "accepted") errors.push(issue(`${path}.status`, "accepted_batch_in_review_queue", batch.id));
    const ids = (batch.quests ?? []).map((row) => row.id);
    if (!ids.length || ids.length > ledger.standardBatchSize) errors.push(issue(`${path}.quests`, "invalid_open_batch_size", ids.length));
    ids.forEach((id) => {
      if (!canonicalById.has(id)) errors.push(issue(`${path}.quests`, "quest_not_canonical", id));
      inReviewQuestIds.push(id);
    });
    if (ids.some((id) => acceptedQuestIds.includes(id))) errors.push(issue(`${path}.quests`, "quest_already_release_attested", ids));
  }
  const duplicateInReviewIds = duplicateValues(inReviewQuestIds);
  if (duplicateInReviewIds.length) errors.push(issue("inReviewBatches.quests", "duplicate_in_review_quest", duplicateInReviewIds));

  if (requireTarget) {
    if (acceptedQuestIds.length !== ledger.targetAcceptedQuests) errors.push(issue("acceptedBatches", "release_target_not_met", `${acceptedQuestIds.length}/${ledger.targetAcceptedQuests}`));
    if (acceptedBatches.length !== ledger.expectedBatchCount) errors.push(issue("acceptedBatches", "batch_target_not_met", `${acceptedBatches.length}/${ledger.expectedBatchCount}`));
    if (canonicalById.size !== ledger.targetAcceptedQuests) errors.push(issue("canonicalQuests", "canonical_target_not_met", `${canonicalById.size}/${ledger.targetAcceptedQuests}`));
    if (unledgeredCanonicalQuestIds.length) errors.push(issue("canonicalQuests", "unattested_canonical_quests", unledgeredCanonicalQuestIds));
    if (statefulContinuationCount < ledger.minimumStatefulContinuations) errors.push(issue("acceptedBatches", "stateful_continuation_floor_not_met", `${statefulContinuationCount}/${ledger.minimumStatefulContinuations}`));
    for (const key of PORTFOLIOS) {
      if (portfolioCounts[key] !== ledger.portfolioTargets[key]) errors.push(issue(`portfolioTargets.${key}`, "portfolio_target_not_met", `${portfolioCounts[key]}/${ledger.portfolioTargets[key]}`));
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats: {
      canonicalAuthoredQuests: canonicalById.size,
      releaseAttestedQuests: acceptedQuestIds.length,
      acceptedBatches: acceptedBatches.length,
      inReviewBatches: inReviewBatches.length,
      inReviewQuests: inReviewQuestIds.length,
      expectedBatches: ledger.expectedBatchCount,
      targetAcceptedQuests: ledger.targetAcceptedQuests,
      statefulContinuations: statefulContinuationCount,
      minimumStatefulContinuations: ledger.minimumStatefulContinuations,
      portfolioCounts,
    },
  };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file:///${process.argv[1].replaceAll("\\", "/")}`));
if (isMain) {
  const result = await validateQuestRelease({ requireTarget: process.argv.includes("--require-target") });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.ok) process.exitCode = 1;
}
