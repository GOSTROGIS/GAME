import { createHash } from "node:crypto";

export const quantize = (value, places = 3) => {
  if (!Number.isFinite(value)) throw new Error(`non-finite number: ${value}`);
  const factor = 10 ** places;
  const result = Math.round((value + Number.EPSILON) * factor) / factor;
  return Object.is(result, -0) ? 0 : result;
};

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]),
    );
  }
  return typeof value === "number" ? quantize(value, 6) : value;
}

export const canonicalJson = (value, spacing = 0) =>
  `${JSON.stringify(canonicalize(value), null, spacing)}${spacing ? "\n" : ""}`;

export const sha256 = (value) =>
  createHash("sha256").update(typeof value === "string" || Buffer.isBuffer(value) ? value : canonicalJson(value)).digest("hex");

export const sanitizeId = (value) => {
  let result = String(value).toLowerCase().replaceAll("~", "-dup");
  result = result.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  result = result.replace(/-\d{2,6}$/, "");
  return result.slice(0, 78) || "asset";
};

export function within(root, candidate) {
  const normalizedRoot = root.toLowerCase().replace(/[\\/]+$/, "");
  const normalizedCandidate = candidate.toLowerCase();
  return normalizedCandidate === normalizedRoot || normalizedCandidate.startsWith(`${normalizedRoot}\\`) || normalizedCandidate.startsWith(`${normalizedRoot}/`);
}
