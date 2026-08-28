/**
 * Authoring/developer-only 1,087-record catalog entry. This module is exposed
 * solely as a dynamic subpath and is never re-exported from the eager barrel.
 */
import shard00 from "../manifests/slipcurve-seeds/catalog-0000-0099.json" with { type: "json" };
import shard01 from "../manifests/slipcurve-seeds/catalog-0100-0199.json" with { type: "json" };
import shard02 from "../manifests/slipcurve-seeds/catalog-0200-0299.json" with { type: "json" };
import shard03 from "../manifests/slipcurve-seeds/catalog-0300-0399.json" with { type: "json" };
import shard04 from "../manifests/slipcurve-seeds/catalog-0400-0499.json" with { type: "json" };
import shard05 from "../manifests/slipcurve-seeds/catalog-0500-0599.json" with { type: "json" };
import shard06 from "../manifests/slipcurve-seeds/catalog-0600-0699.json" with { type: "json" };
import shard07 from "../manifests/slipcurve-seeds/catalog-0700-0799.json" with { type: "json" };
import shard08 from "../manifests/slipcurve-seeds/catalog-0800-0899.json" with { type: "json" };
import shard09 from "../manifests/slipcurve-seeds/catalog-0900-0999.json" with { type: "json" };
import shard10 from "../manifests/slipcurve-seeds/catalog-1000-1086.json" with { type: "json" };

export interface BridgeCatalogDeveloperRecord {
  readonly id: string;
  readonly classification: "accepted_seed" | "quarantined" | "rejected";
  readonly maturity: "prototype_geometry";
  readonly reason: string;
  readonly suitabilityTags?: readonly string[];
}

const shards = [shard00, shard01, shard02, shard03, shard04, shard05, shard06, shard07, shard08, shard09, shard10] as const;

export const records: readonly BridgeCatalogDeveloperRecord[] = Object.freeze(
  (shards as readonly { readonly records: readonly unknown[] }[]).flatMap((shard) => shard.records) as BridgeCatalogDeveloperRecord[],
);

if (records.length !== 1_087) throw new Error(`Slipcurve developer catalog drifted: ${records.length}`);

export default records;
