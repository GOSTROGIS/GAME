import assert from "node:assert/strict";
import { validateQuestRelease } from "../tools/narrative/validate-quest-release.mjs";

const result = await validateQuestRelease();

assert.equal(result.ok, true, JSON.stringify(result.errors, null, 2));
assert.equal(result.stats.targetAcceptedQuests, 5_000);
assert.equal(result.stats.expectedBatches, 417);
assert.equal(result.stats.minimumStatefulContinuations, 2_000);
assert.equal(Object.values(result.stats.portfolioCounts).reduce((total, count) => total + count, 0), result.stats.releaseAttestedQuests);
assert.ok(result.stats.canonicalAuthoredQuests >= result.stats.releaseAttestedQuests);
assert.equal(result.stats.inReviewQuests, result.stats.canonicalAuthoredQuests - result.stats.releaseAttestedQuests);

console.log(
  `Quest release ledger valid: ${result.stats.canonicalAuthoredQuests} canonical authored; ${result.stats.inReviewQuests} in review; ${result.stats.releaseAttestedQuests}/${result.stats.targetAcceptedQuests} release-attested across ${result.stats.acceptedBatches}/${result.stats.expectedBatches} closed batches.`,
);
