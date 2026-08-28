/** Generated runtime-pack entry. Import dynamically; never add it to src/index.ts. */
import runtimeJson from "../manifests/sable-reach.bridge-runtime.json" with { type: "json" };
import type { RuntimeAssetPackV1 } from "@hollow-march/shared";

export const SABLE_REACH_BRIDGE_RUNTIME = runtimeJson;
export const runtimeAssetPacks = runtimeJson.runtimeAssetPacks as unknown as readonly RuntimeAssetPackV1[];
