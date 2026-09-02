export const OPERATIONAL_READ_KIND: "operational-state-v1";
export const SUPPORT_DEPTH_VARIANT: "equivalent-depth-without-secret-v1";
export const NARRATIVE_READ_MODES: readonly ["all-values", "value-precondition"];

export interface OperationalModeDefinition {
  readonly questId: string;
  readonly domain: string;
  readonly key: string;
  readonly mode: string;
  readonly values: readonly string[];
  readonly inputShape: string;
}

export const OPERATIONAL_MODE_DEFINITIONS: readonly OperationalModeDefinition[];
export const RUNTIME_CONTRACT_SPEC: Readonly<Record<string, unknown>>;
export function normalizeSupportCharacterRecord(record: Readonly<Record<string, unknown>>): Record<string, unknown> & { questArcIds: string[] };
export function validateSupportCharacterDepth(record: Readonly<Record<string, unknown>>): Readonly<{ variant: string; valid: true }>;
export function classifyStateRead(row: Readonly<Record<string, unknown>>): Readonly<{ kind: "narrative-state-v1"; definition: null } | { kind: "operational-state-v1"; definition: OperationalModeDefinition }>;
export function normalizeOperationalSnapshot(row: Readonly<Record<string, unknown>>, snapshot: unknown): string;
export function interpretStateRead(row: Readonly<Record<string, unknown>>, stateByDomain: Readonly<Record<string, Readonly<Record<string, unknown>>>>, context?: Readonly<Record<string, unknown>>): Readonly<{ readKind: string; domain: string; key: string; value: string; satisfied: boolean }>;
export function validateForcedTerminalBinding(companionContract: Readonly<Record<string, unknown>>, quest: Readonly<Record<string, unknown>>, phaseGraph: Readonly<Record<string, unknown>>): Readonly<{ outcomeId: string; terminalPhaseId: string; valid: true }>;
