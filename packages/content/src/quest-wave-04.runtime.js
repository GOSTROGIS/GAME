export const OPERATIONAL_READ_KIND = 'operational-state-v1';
export const SUPPORT_DEPTH_VARIANT = 'equivalent-depth-without-secret-v1';
export const NARRATIVE_READ_MODES = Object.freeze(['all-values', 'value-precondition']);

const nonEmpty = value => typeof value === 'string' && value.trim().length > 0;
const exactArray = (left, right) => Array.isArray(left) && left.length === right.length && left.every((value, index) => value === right[index]);
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const normalizedEnum = value => String(value ?? '').normalize('NFKC').trim().toLowerCase();
const clone = value => structuredClone(value);

const definitions = [
  {
    questId: 'faction_living_appeal_aftercare',
    domain: 'living_aftercare_operation',
    key: 'living_predefined_use_eligibility',
    mode: 'living_actor_record_only',
    values: ['eligible', 'revoked', 'expired'],
    inputShape: '{ actorKind: "living", authorizationStatus: "eligible" | "revoked" | "expired" }',
  },
  {
    questId: 'faction_living_appeal_aftercare',
    domain: 'living_aftercare_operation',
    key: 'staff_interrupt_readiness',
    mode: 'six_physical_cutoffs',
    values: ['ready', 'isolated', 'repair_due'],
    inputShape: '{ cutoffs: [six values from "ready" | "isolated" | "repair_due"] }',
  },
  {
    questId: 'faction_living_appeal_aftercare',
    domain: 'living_aftercare_operation',
    key: 'living_appeal_capacity',
    mode: 'occupied_threshold_and_exit',
    values: ['available', 'queued', 'protected_return'],
    inputShape: '{ occupied: integer, capacity: positive integer, protectedExitOpen: boolean, returnConfirmed: boolean }',
  },
  {
    questId: 'character_the_face_noon_borrowed',
    domain: 'authority',
    key: 'seraphel_material_load_state',
    mode: 'three_bounded_material_loads',
    values: ['compression_within_limit', 'torsion_within_limit', 'thermal_within_limit', 'any_load_outside_limit'],
    inputShape: '{ loadKind: "compression" | "torsion" | "thermal", withinLimit: boolean }',
  },
  {
    questId: 'character_the_face_noon_borrowed',
    domain: 'authority',
    key: 'four_mortal_witness_exit_states',
    mode: 'all_four_independent_exits',
    values: ['all_open', 'one_withdrawn', 'fallback_route_active', 'test_aborted'],
    inputShape: '{ exits: [four booleans], fallbackRouteActive: boolean, testAborted: boolean }',
  },
  {
    questId: 'character_the_face_noon_borrowed',
    domain: 'authority',
    key: 'contrition_refusal_pressure',
    mode: 'read_only_encounter_pressure',
    values: ['absent', 'gathering', 'threshold_reached'],
    inputShape: '{ level: nonnegative integer, gatheringThreshold: integer, refusalThreshold: integer }',
  },
  {
    questId: 'regional_the_fog_came_to_collect_our_outlines',
    domain: 'infrastructure',
    key: 'living_borrower_ledger',
    mode: 'named_living_borrowers_only',
    values: ['balanced', 'borrower_missing', 'creditor_missing'],
    inputShape: '{ allParticipantsNamedLiving: true, missingBorrowerIds: string[], missingCreditorIds: string[] }',
  },
  {
    questId: 'regional_the_fog_came_to_collect_our_outlines',
    domain: 'infrastructure',
    key: 'single_escrow_body_state',
    mode: 'exactly_one_body',
    values: ['present', 'held', 'returned'],
    inputShape: '{ escrowBodyIds: [one nonempty id], state: "present" | "held" | "returned" }',
  },
  {
    questId: 'regional_the_fog_came_to_collect_our_outlines',
    domain: 'infrastructure',
    key: 'four_leg_positions',
    mode: 'exactly_four_bank_positions',
    values: ['all_four_bound', 'one_bank_unbound', 'exchange_frozen'],
    inputShape: '{ positions: [four booleans], exchangeFrozen: boolean }',
  },
];

export const OPERATIONAL_MODE_DEFINITIONS = Object.freeze(definitions.map(row => Object.freeze({ ...row, values: Object.freeze([...row.values]) })));
const byMode = new Map(OPERATIONAL_MODE_DEFINITIONS.map(row => [row.mode, row]));

export const RUNTIME_CONTRACT_SPEC = Object.freeze({
  schemaVersion: 1,
  contractId: 'quest-wave-04-v11-runtime-contract',
  supportCharacters: {
    canonicalArcField: 'questArcIds',
    rejectedLegacyArcField: 'questIds',
    deterministicLegacyAdapter: 'normalizeSupportCharacterRecord',
    noSecretVariant: SUPPORT_DEPTH_VARIANT,
    noSecretRequiredFields: ['desire', 'fear', 'contradiction', 'ownedDecision', 'dialogueProfile.register', 'dialogueProfile.taboo', 'dialogueProfile.signature'],
    implicitSecretInferenceForbidden: true,
  },
  stateReads: {
    narrative: {
      discriminator: 'implicit-only-when-mode-is-narrative',
      allowedModes: NARRATIVE_READ_MODES,
      domainSource: 'quest.stateDomain',
      operationalFieldsForbidden: ['readKind', 'domain'],
    },
    operational: {
      discriminatorField: 'readKind',
      discriminatorValue: OPERATIONAL_READ_KIND,
      requiredFields: ['readKind', 'domain', 'key', 'mode', 'values'],
      closedModeVocabulary: OPERATIONAL_MODE_DEFINITIONS.map(row => row.mode),
      modeDefinitions: OPERATIONAL_MODE_DEFINITIONS.map(row => ({ ...row, values: [...row.values] })),
      normalizer: 'normalizeOperationalSnapshot',
      interpreter: 'interpretStateRead',
      unknownModesRejected: true,
      crossKindModesRejected: true,
    },
  },
});

export function normalizeSupportCharacterRecord(record) {
  assert(record && typeof record === 'object' && nonEmpty(record.id), 'support_record_invalid');
  const hasLegacy = Object.hasOwn(record, 'questIds');
  const hasCanonical = Object.hasOwn(record, 'questArcIds');
  assert(!(hasLegacy && hasCanonical), `support_arc_fields_ambiguous:${record.id}`);
  assert(hasLegacy || hasCanonical, `support_arc_field_missing:${record.id}`);
  const ids = hasCanonical ? record.questArcIds : record.questIds;
  assert(Array.isArray(ids) && ids.length > 0 && ids.every(nonEmpty) && new Set(ids).size === ids.length, `support_arc_ids_invalid:${record.id}`);
  const normalized = clone(record);
  normalized.questArcIds = [...ids];
  delete normalized.questIds;
  return normalized;
}

export function validateSupportCharacterDepth(record) {
  assert(record && typeof record === 'object' && nonEmpty(record.id), 'support_depth_record_invalid');
  if (nonEmpty(record.secret)) {
    assert(!Object.hasOwn(record, 'depthVariant'), `secret_record_must_not_claim_no_secret_variant:${record.id}`);
    return { variant: 'explicit-secret-v1', valid: true };
  }
  assert(record.depthVariant === SUPPORT_DEPTH_VARIANT, `missing_explicit_depth_variant:${record.id}`);
  for (const field of ['desire', 'fear', 'contradiction', 'ownedDecision']) assert(nonEmpty(record[field]), `missing_depth_field:${record.id}:${field}`);
  for (const field of ['register', 'taboo', 'signature']) assert(nonEmpty(record.dialogueProfile?.[field]), `missing_depth_field:${record.id}:dialogueProfile.${field}`);
  const depthText = [record.desire, record.fear, record.contradiction, record.ownedDecision, ...Object.values(record.dialogueProfile)].join(' ');
  assert(!/\b(?:tbd|todo|unknown|generic|filler|secret pending|none)\b/i.test(depthText), `generic_depth_filler_rejected:${record.id}`);
  return { variant: SUPPORT_DEPTH_VARIANT, valid: true };
}

export function classifyStateRead(row) {
  assert(row && typeof row === 'object' && nonEmpty(row.key) && nonEmpty(row.mode) && Array.isArray(row.values) && row.values.length > 0, 'state_read_shape_invalid');
  assert(row.values.every(nonEmpty) && new Set(row.values).size === row.values.length, `state_read_values_invalid:${row.key}`);
  if (!Object.hasOwn(row, 'readKind')) {
    assert(NARRATIVE_READ_MODES.includes(row.mode), `undiscriminated_custom_mode_rejected:${row.mode}`);
    assert(!Object.hasOwn(row, 'domain'), `narrative_domain_must_come_from_quest:${row.key}`);
    return { kind: 'narrative-state-v1', definition: null };
  }
  assert(row.readKind === OPERATIONAL_READ_KIND, `unknown_state_read_kind:${row.readKind}`);
  assert(!NARRATIVE_READ_MODES.includes(row.mode), `operational_row_cannot_use_narrative_mode:${row.mode}`);
  const definition = byMode.get(row.mode);
  assert(definition, `unknown_operational_mode:${row.mode}`);
  assert(row.domain === definition.domain && row.key === definition.key && exactArray(row.values, definition.values), `operational_row_contract_mismatch:${row.mode}`);
  return { kind: OPERATIONAL_READ_KIND, definition };
}

export function normalizeOperationalSnapshot(row, snapshot) {
  const { definition } = classifyStateRead(row);
  assert(definition, 'operational_definition_missing');
  if (typeof snapshot === 'string') {
    const value = normalizedEnum(snapshot);
    assert(definition.values.includes(value), `operational_enum_outside_closed_vocabulary:${row.mode}:${value}`);
    return value;
  }
  assert(snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot), `operational_snapshot_invalid:${row.mode}`);
  switch (row.mode) {
    case 'living_actor_record_only': {
      assert(snapshot.actorKind === 'living', 'living_actor_record_requires_living_actor');
      const value = normalizedEnum(snapshot.authorizationStatus);
      assert(definition.values.includes(value), 'living_actor_authorization_invalid');
      return value;
    }
    case 'six_physical_cutoffs': {
      assert(Array.isArray(snapshot.cutoffs) && snapshot.cutoffs.length === 6, 'six_cutoffs_exact_count_required');
      const values = snapshot.cutoffs.map(normalizedEnum);
      assert(values.every(value => definition.values.includes(value)), 'six_cutoffs_value_invalid');
      if (values.includes('repair_due')) return 'repair_due';
      if (values.includes('isolated')) return 'isolated';
      return 'ready';
    }
    case 'occupied_threshold_and_exit': {
      const { occupied, capacity, protectedExitOpen, returnConfirmed } = snapshot;
      assert(Number.isInteger(occupied) && occupied >= 0 && Number.isInteger(capacity) && capacity > 0, 'appeal_capacity_counts_invalid');
      assert(typeof protectedExitOpen === 'boolean' && typeof returnConfirmed === 'boolean', 'appeal_capacity_exit_flags_invalid');
      assert(!(returnConfirmed && !protectedExitOpen), 'protected_return_requires_open_exit');
      if (returnConfirmed) return 'protected_return';
      if (!protectedExitOpen || occupied >= capacity) return 'queued';
      return 'available';
    }
    case 'three_bounded_material_loads': {
      assert(['compression', 'torsion', 'thermal'].includes(snapshot.loadKind) && typeof snapshot.withinLimit === 'boolean', 'material_load_snapshot_invalid');
      return snapshot.withinLimit ? `${snapshot.loadKind}_within_limit` : 'any_load_outside_limit';
    }
    case 'all_four_independent_exits': {
      assert(Array.isArray(snapshot.exits) && snapshot.exits.length === 4 && snapshot.exits.every(value => typeof value === 'boolean'), 'four_exit_snapshot_invalid');
      assert(typeof snapshot.fallbackRouteActive === 'boolean' && typeof snapshot.testAborted === 'boolean', 'four_exit_flags_invalid');
      if (snapshot.testAborted) return 'test_aborted';
      if (snapshot.fallbackRouteActive) return 'fallback_route_active';
      const closed = snapshot.exits.filter(value => !value).length;
      if (closed === 0) return 'all_open';
      assert(closed === 1, 'four_exit_state_allows_only_one_withdrawal_before_fallback_or_abort');
      return 'one_withdrawn';
    }
    case 'read_only_encounter_pressure': {
      const { level, gatheringThreshold, refusalThreshold } = snapshot;
      assert(Number.isInteger(level) && level >= 0 && Number.isInteger(gatheringThreshold) && gatheringThreshold > 0 && Number.isInteger(refusalThreshold) && refusalThreshold > gatheringThreshold, 'encounter_pressure_thresholds_invalid');
      if (level >= refusalThreshold) return 'threshold_reached';
      if (level >= gatheringThreshold) return 'gathering';
      return 'absent';
    }
    case 'named_living_borrowers_only': {
      assert(snapshot.allParticipantsNamedLiving === true, 'borrower_ledger_requires_named_living_participants');
      assert(Array.isArray(snapshot.missingBorrowerIds) && Array.isArray(snapshot.missingCreditorIds) && snapshot.missingBorrowerIds.every(nonEmpty) && snapshot.missingCreditorIds.every(nonEmpty), 'borrower_ledger_missing_ids_invalid');
      assert(!(snapshot.missingBorrowerIds.length && snapshot.missingCreditorIds.length), 'borrower_and_creditor_missing_is_ambiguous');
      if (snapshot.missingBorrowerIds.length) return 'borrower_missing';
      if (snapshot.missingCreditorIds.length) return 'creditor_missing';
      return 'balanced';
    }
    case 'exactly_one_body': {
      assert(Array.isArray(snapshot.escrowBodyIds) && snapshot.escrowBodyIds.length === 1 && nonEmpty(snapshot.escrowBodyIds[0]), 'exactly_one_escrow_body_required');
      const value = normalizedEnum(snapshot.state);
      assert(definition.values.includes(value), 'escrow_body_state_invalid');
      return value;
    }
    case 'exactly_four_bank_positions': {
      assert(Array.isArray(snapshot.positions) && snapshot.positions.length === 4 && snapshot.positions.every(value => typeof value === 'boolean') && typeof snapshot.exchangeFrozen === 'boolean', 'four_bank_positions_invalid');
      if (snapshot.exchangeFrozen) return 'exchange_frozen';
      const unbound = snapshot.positions.filter(value => !value).length;
      if (unbound === 0) return 'all_four_bound';
      assert(unbound === 1, 'more_than_one_unbound_bank_requires_frozen_exchange');
      return 'one_bank_unbound';
    }
    default:
      throw new Error(`unreachable_operational_mode:${row.mode}`);
  }
}

export function interpretStateRead(row, stateByDomain, context = {}) {
  const classification = classifyStateRead(row);
  const domain = classification.kind === OPERATIONAL_READ_KIND ? row.domain : context.questStateDomain;
  assert(nonEmpty(domain), `state_read_domain_missing:${row.key}`);
  const raw = stateByDomain?.[domain]?.[row.key];
  assert(raw !== undefined, `state_read_value_missing:${domain}:${row.key}`);
  if (classification.kind === OPERATIONAL_READ_KIND) {
    const value = normalizeOperationalSnapshot(row, raw);
    return { readKind: OPERATIONAL_READ_KIND, domain, key: row.key, value, satisfied: true };
  }
  const value = normalizedEnum(raw);
  assert(row.values.includes(value), `narrative_value_outside_closed_vocabulary:${row.key}:${value}`);
  if (row.mode === 'value-precondition') {
    const expectedValue = normalizedEnum(context.expectedValue);
    assert(row.values.includes(expectedValue), `narrative_precondition_invalid:${row.key}`);
    return { readKind: 'narrative-state-v1', domain, key: row.key, value, satisfied: value === expectedValue };
  }
  return { readKind: 'narrative-state-v1', domain, key: row.key, value, satisfied: true };
}

export function validateForcedTerminalBinding(companionContract, quest, phaseGraph) {
  assert(companionContract?.exit && quest && phaseGraph, 'forced_terminal_binding_inputs_missing');
  const binding = companionContract.exit.forcedTerminalBinding;
  assert(binding?.schemaVersion === 1 && binding.bindingKind === 'existing-owning-quest-outcome-to-phase-terminal', 'forced_terminal_binding_shape_invalid');
  assert(binding.questId === companionContract.questId && binding.questId === quest.id && binding.phaseGraphId === phaseGraph.id, 'forced_terminal_binding_owner_mismatch');
  assert(companionContract.exit.forcedOutcomeLock === binding.outcomeId, 'forced_outcome_lock_binding_mismatch');
  assert(quest.outcomes.length === 4 && quest.outcomes.filter(value => value === binding.outcomeId).length === 1, 'forced_outcome_must_be_one_existing_four_outcomes');
  assert(quest.stateWrites.length === 1 && quest.stateWrites[0].values.filter(value => value === binding.outcomeId).length === 1, 'forced_outcome_missing_from_state_write');
  assert(phaseGraph.nodes.some(node => node.id === binding.terminalPhaseId), 'forced_terminal_node_missing');
  assert(phaseGraph.edges.some(edge => edge.from === binding.fromPhaseId && edge.to === binding.terminalPhaseId && edge.kind === binding.transitionKind), 'forced_terminal_transition_missing');
  assert(!phaseGraph.edges.some(edge => edge.from === binding.terminalPhaseId), 'forced_terminal_must_be_sink');
  assert(nonEmpty(binding.causalProof), 'forced_terminal_causal_proof_missing');
  return { outcomeId: binding.outcomeId, terminalPhaseId: binding.terminalPhaseId, valid: true };
}
