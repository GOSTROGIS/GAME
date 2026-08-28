type Labels = Record<string, string>;

const keyFor = (name: string, labels: Labels): string => `${name}|${Object.entries(labels).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join(",")}`;
const escape = (value: string): string => value.replaceAll("\\", "\\\\").replaceAll("\n", "\\n").replaceAll('"', '\\"');

export class MetricsRegistry {
  #counters = new Map<string, { name: string; labels: Labels; value: number }>();
  #gauges = new Map<string, { name: string; labels: Labels; value: number }>();

  increment(name: string, labels: Labels = {}, amount = 1): void {
    const key = keyFor(name, labels); const entry = this.#counters.get(key) ?? { name, labels, value: 0 };
    entry.value += amount; this.#counters.set(key, entry);
  }
  set(name: string, value: number, labels: Labels = {}): void { this.#gauges.set(keyFor(name, labels), { name, labels, value }); }
  render(): string {
    const entries = [...this.#counters.values(), ...this.#gauges.values()];
    return `${entries.map(({ name, labels, value }) => `${name}${formatLabels(labels)} ${value}`).join("\n")}\n`;
  }
}

function formatLabels(labels: Labels): string {
  const values = Object.entries(labels);
  return values.length ? `{${values.map(([key, value]) => `${key}="${escape(value)}"`).join(",")}}` : "";
}

export const metrics = new MetricsRegistry();
