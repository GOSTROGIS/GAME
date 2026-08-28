import ts from "typescript";

export const CAPTURE_KINDS = Object.freeze({
  box: "supported",
  cyl: "supported",
  tube: "supported",
  wheel: "supported",
  wheelD: "supported",
  diskXZ: "supported",
  ringXZ: "supported",
  dome: "supported",
  mound: "supported",
  poly: "supported",
  polyO: "supported",
  polyRaw: "supported",
  quad: "supported",
  disc: "supported",
  ring: "supported",
  shadow: "ignored",
  seg: "unsupported_screen_space",
  beam: "unsupported_screen_space",
  _sp: "unsupported_screen_space",
  panel: "unsupported_panel",
  zone: "unsupported_annotation",
  ram: "unsupported_compound",
  member: "unsupported_compound",
  crawler: "unsupported_compound",
  headlight: "unsupported_screen_space",
  beacon: "unsupported_compound",
  exhaust: "unsupported_compound",
  handrail: "unsupported_compound",
  mirror: "unsupported_compound"
});

const stateExpression = "{view:(typeof VIEW==='string'?VIEW:null),sx:(typeof SXF==='number'?SXF:1),sy:(typeof SYF==='number'?SYF:1),sz:(typeof SZF==='number'?SZF:1),yaw:(typeof YAW==='number'?YAW:0),flip:(typeof FLIP==='boolean'?FLIP:false)}";

function scopeOf(node, sourceFile) {
  let cursor = node.parent;
  while (cursor && cursor !== sourceFile) {
    if (ts.isFunctionLike(cursor) && cursor.body && ts.isBlock(cursor.body)) return cursor.body;
    cursor = cursor.parent;
  }
  return sourceFile;
}

export function instrumentSource(source, fileName) {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
  const scopes = new Map();
  const visit = (node) => {
    if (ts.isFunctionDeclaration(node) && node.name) {
      const name = node.name.text;
      if (name === "add" || Object.hasOwn(CAPTURE_KINDS, name)) {
        const scope = scopeOf(node, sourceFile);
        const names = scopes.get(scope) ?? new Set();
        names.add(name);
        scopes.set(scope, names);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  const insertions = [];
  for (const [scope, names] of scopes) {
    const body = [...names].sort().map((name) => {
      const original = `__slip_original_${name.replace(/[^a-zA-Z0-9_$]/g, "_")}`;
      if (name === "add") {
        return `const ${original}=${name};${name}=function(...args){return globalThis.__SLIP_CAPTURE__.add(args,()=>${original}.apply(this,args),${stateExpression});};`;
      }
      const disposition = CAPTURE_KINDS[name];
      return `const ${original}=${name};${name}=function(...args){return globalThis.__SLIP_CAPTURE__.invoke(${JSON.stringify(name)},${JSON.stringify(disposition)},args,()=>${original}.apply(this,args),${stateExpression});};`;
    }).join("");
    const position = scope === sourceFile ? 0 : scope.getStart(sourceFile) + 1;
    insertions.push({ position, body });
  }

  insertions.sort((a, b) => b.position - a.position);
  let output = source;
  for (const insertion of insertions) {
    output = `${output.slice(0, insertion.position)}${insertion.body}${output.slice(insertion.position)}`;
  }
  return output;
}

export const captureRuntimeSource = String.raw`
(() => {
  const clone = (value, depth = 0) => {
    if (depth > 8) return "[depth-limit]";
    if (value == null || typeof value === "string" || typeof value === "boolean") return value;
    if (typeof value === "number") return Number.isFinite(value) ? value : String(value);
    if (Array.isArray(value)) return value.map((item) => clone(item, depth + 1));
    if (typeof value === "object") {
      const out = {};
      for (const key of Object.keys(value).sort()) out[key] = clone(value[key], depth + 1);
      return out;
    }
    return String(value);
  };
  globalThis.__SLIP_CAPTURE__ = {
    active: false,
    depth: 0,
    events: [],
    raw: [],
    pending: [],
    start(view) {
      this.active = true;
      this.depth = 0;
      this.events = [];
      this.raw = [];
      this.pending = [];
      this.view = view;
    },
    invoke(name, disposition, args, thunk, state) {
      if (!this.active) return thunk();
      const root = this.depth === 0;
      this.depth += 1;
      let result;
      try { result = thunk(); }
      finally { this.depth -= 1; }
      if (root) {
        if (disposition !== "ignored") this.events.push({ name, disposition, args: clone(args), state: clone(state) });
        if (typeof result === "string") this.pending.push(result);
      }
      return result;
    },
    add(args, thunk, state) {
      if (this.active && this.depth === 0) {
        const actual = args && args[0];
        const expected = this.pending.join("");
        if (typeof actual !== "string" || actual !== expected) {
          this.raw.push({
            reason: "uncaptured_raw_output",
            outputType: typeof actual,
            outputLength: typeof actual === "string" ? actual.length : null,
            prefix: typeof actual === "string" ? actual.slice(0, 48).replace(/\s+/g, " ") : null,
            state: clone(state)
          });
        }
        this.pending = [];
      }
      return thunk();
    },
    finish() {
      const result = { view: this.view, events: this.events, raw: this.raw };
      this.active = false;
      this.pending = [];
      return result;
    }
  };
})();
`;
