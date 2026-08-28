-- V4 and V5 remain intact for rollback/audit. Validated old rows are
-- deterministically backfilled before the repository begins reading save_v6.
BEGIN;

ALTER TABLE characters ADD COLUMN IF NOT EXISTS save_v6 jsonb;

CREATE OR REPLACE FUNCTION sable_strip_turn_transients(source jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
STRICT
AS $$
DECLARE
  result jsonb;
  entry record;
BEGIN
  IF jsonb_typeof(source) = 'array' THEN
    SELECT COALESCE(jsonb_agg(sable_strip_turn_transients(value) ORDER BY ordinality), '[]'::jsonb)
      INTO result
      FROM jsonb_array_elements(source) WITH ORDINALITY AS values_with_order(value, ordinality);
    RETURN result;
  END IF;
  IF jsonb_typeof(source) <> 'object' THEN
    RETURN source;
  END IF;

  result := '{}'::jsonb;
  FOR entry IN SELECT key, value FROM jsonb_each(source) ORDER BY key LOOP
    IF entry.key <> ALL (ARRAY[
      'activeEncounter', 'activeEncounters', 'turnEncounter', 'turnEncounters', 'encounterState',
      'cooldown', 'cooldowns', 'combatCooldowns', 'cooldownWindow', 'cooldownWindows', 'cooldownEndsAt',
      'attackCooldown', 'dodgeCooldown', 'invulnerable', 'invulnerabilityWindow', 'invulnerabilityWindows',
      'invulnerabilityWindowMs', 'invulnerabilityEndsAt', 'hitFlash', 'intent', 'intents', 'intentMoveId',
      'enemyIntent', 'enemyIntents', 'realtimeIntent', 'realtimeEnemyIntent', 'realtimeEnemyIntents',
      'actionStartedAt', 'windupEndsAt', 'impactAt', 'recoveryEndsAt'
    ]) THEN
      result := result || jsonb_build_object(entry.key, sable_strip_turn_transients(entry.value));
    END IF;
  END LOOP;
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION sable_jsonb_number(source jsonb, fallback_value numeric)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE WHEN jsonb_typeof(source) = 'number' THEN (source #>> '{}')::numeric ELSE fallback_value END
$$;

CREATE OR REPLACE FUNCTION sable_jsonb_nonnegative_number_map(source jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE entry record;
BEGIN
  IF jsonb_typeof(source) <> 'object' THEN RETURN false; END IF;
  FOR entry IN SELECT value FROM jsonb_each(source) LOOP
    IF jsonb_typeof(entry.value) <> 'number' OR (entry.value #>> '{}')::numeric < 0 THEN RETURN false; END IF;
  END LOOP;
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION sable_jsonb_object_array(source jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE entry jsonb;
BEGIN
  IF jsonb_typeof(source) <> 'array' THEN RETURN false; END IF;
  FOR entry IN SELECT value FROM jsonb_array_elements(source) LOOP
    IF jsonb_typeof(entry) <> 'object' THEN RETURN false; END IF;
  END LOOP;
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION sable_jsonb_unique_nonempty_string_array(source jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE total integer; distinct_total integer;
BEGIN
  IF jsonb_typeof(source) <> 'array' THEN RETURN false; END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(source) AS entries(value)
    WHERE jsonb_typeof(value) <> 'string' OR length(value #>> '{}') = 0
  ) THEN RETURN false; END IF;
  SELECT count(*), count(DISTINCT value) INTO total, distinct_total FROM jsonb_array_elements(source) AS entries(value);
  RETURN total = distinct_total;
END $$;

CREATE OR REPLACE FUNCTION sable_build_save_v6(
  character_id_value uuid,
  account_id_value uuid,
  name_value text,
  appearance_value jsonb,
  transform_value jsonb,
  save_v4_value jsonb,
  save_v5_value jsonb,
  updated_at_value timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  source jsonb := COALESCE(save_v5_value, save_v4_value, '{}'::jsonb);
  legacy_payload jsonb;
  payload jsonb;
  character_value jsonb;
  appearance_v2 jsonb;
  spatial_value jsonb;
  location_value jsonb;
  respawn_value jsonb;
  respawn_spatial jsonb;
  player_value jsonb;
  vitals_value jsonb;
  world_state_value jsonb;
  progression_value jsonb;
  techniques_value jsonb;
  ledger_value jsonb;
  ledger_key text;
  discoveries_value jsonb;
  maximum_health numeric;
  maximum_stamina numeric;
  maximum_focus numeric;
  vigor numeric;
  endurance numeric;
  attunement numeric;
BEGIN
  legacy_payload := CASE WHEN jsonb_typeof(source->'legacyPayload') = 'object' THEN source->'legacyPayload' ELSE '{}'::jsonb END;
  -- Match TypeScript sourcePayload(): legacy fields are the base and wrapper
  -- fields win. The character object is merged separately below.
  payload := legacy_payload || source;
  -- V4/V5 deliberately wrapped the validated V3 payload. Merge the durable
  -- legacy character first, then let the newer wrapper's name/appearance win.
  -- This retains attributes and stable IDs instead of silently narrowing the
  -- character to the wrapper's two fields during the data migration.
  character_value := CASE WHEN jsonb_typeof(legacy_payload->'character') = 'object' THEN legacy_payload->'character' ELSE '{}'::jsonb END
    || CASE WHEN jsonb_typeof(source->'character') = 'object' THEN source->'character' ELSE '{}'::jsonb END;
  character_value := sable_strip_turn_transients(character_value)
    || jsonb_build_object('name', COALESCE(NULLIF(character_value->>'name', ''), name_value, 'The Unnamed'));
  appearance_v2 := CASE
    WHEN jsonb_typeof(payload->'appearance') = 'object' THEN payload->'appearance'
    WHEN jsonb_typeof(character_value->'appearance') = 'object' THEN character_value->'appearance'
    ELSE appearance_value
  END;

  spatial_value := CASE WHEN jsonb_typeof(source->'spatial') = 'object' THEN source->'spatial' ELSE jsonb_build_object(
    'address', jsonb_build_object(
      'coordinateSpaceId', 'hearthmere_local_meters',
      'territoryId', 'territory.graven-march',
      'siteId', 'site.hearthmere',
      'macroCellId', 'atlas.cell.r16.c12'
    ),
    'siteTransform', jsonb_build_object(
      'siteId', 'site.hearthmere',
      'atlasCoordinateSpaceId', 'veyl_local_grid_v1',
      'localCoordinateSpaceId', 'hearthmere_local_meters',
      'atlasOrigin', jsonb_build_object('easting', 6400, 'northing', 8320, 'elevation', 184),
      'localAxes', jsonb_build_object('x', 'east', 'y', 'up', 'z', 'south')
    )
  ) END;
  location_value := jsonb_build_object(
    'coordinateSpaceId', spatial_value#>>'{address,coordinateSpaceId}',
    -- characters.transform is the live durable position and may be newer than
    -- the historical wrapper snapshot.
    'transform', jsonb_build_object(
      'x', transform_value->'x',
      'y', transform_value->'y',
      'z', transform_value->'z',
      'yaw', transform_value->'yaw'
    ),
    'spatial', spatial_value
  );

  player_value := CASE WHEN jsonb_typeof(payload->'player') = 'object' THEN payload->'player' ELSE '{}'::jsonb END;
  vitals_value := CASE WHEN jsonb_typeof(payload->'vitals') = 'object' THEN payload->'vitals' ELSE '{}'::jsonb END;
  vigor := CASE WHEN jsonb_typeof(character_value#>'{attributes,vigor}') = 'number' AND sable_jsonb_number(character_value#>'{attributes,vigor}', 0) > 0 THEN sable_jsonb_number(character_value#>'{attributes,vigor}', 5) ELSE 5 END;
  endurance := CASE WHEN jsonb_typeof(character_value#>'{attributes,endurance}') = 'number' AND sable_jsonb_number(character_value#>'{attributes,endurance}', 0) > 0 THEN sable_jsonb_number(character_value#>'{attributes,endurance}', 5) ELSE 5 END;
  attunement := CASE WHEN jsonb_typeof(character_value#>'{attributes,attunement}') = 'number' AND sable_jsonb_number(character_value#>'{attributes,attunement}', 0) > 0 THEN sable_jsonb_number(character_value#>'{attributes,attunement}', 5) ELSE 5 END;
  maximum_health := CASE
    WHEN jsonb_typeof(vitals_value->'maximumHealth') = 'number' AND sable_jsonb_number(vitals_value->'maximumHealth', 0) > 0 THEN sable_jsonb_number(vitals_value->'maximumHealth', 0)
    WHEN jsonb_typeof(vitals_value->'maxHealth') = 'number' AND sable_jsonb_number(vitals_value->'maxHealth', 0) > 0 THEN sable_jsonb_number(vitals_value->'maxHealth', 0)
    WHEN jsonb_typeof(player_value->'maxHp') = 'number' AND sable_jsonb_number(player_value->'maxHp', 0) > 0 THEN sable_jsonb_number(player_value->'maxHp', 0)
    ELSE 78 + vigor * 6 END;
  maximum_stamina := CASE
    WHEN jsonb_typeof(vitals_value->'maximumStamina') = 'number' AND sable_jsonb_number(vitals_value->'maximumStamina', 0) > 0 THEN sable_jsonb_number(vitals_value->'maximumStamina', 0)
    WHEN jsonb_typeof(vitals_value->'maxStamina') = 'number' AND sable_jsonb_number(vitals_value->'maxStamina', 0) > 0 THEN sable_jsonb_number(vitals_value->'maxStamina', 0)
    WHEN jsonb_typeof(player_value->'maxStamina') = 'number' AND sable_jsonb_number(player_value->'maxStamina', 0) > 0 THEN sable_jsonb_number(player_value->'maxStamina', 0)
    ELSE 62 + endurance * 5 END;
  maximum_focus := CASE
    WHEN jsonb_typeof(vitals_value->'maximumFocus') = 'number' AND sable_jsonb_number(vitals_value->'maximumFocus', 0) > 0 THEN sable_jsonb_number(vitals_value->'maximumFocus', 0)
    WHEN jsonb_typeof(vitals_value->'maxFocus') = 'number' AND sable_jsonb_number(vitals_value->'maxFocus', 0) > 0 THEN sable_jsonb_number(vitals_value->'maxFocus', 0)
    WHEN jsonb_typeof(player_value->'maxFocus') = 'number' AND sable_jsonb_number(player_value->'maxFocus', 0) > 0 THEN sable_jsonb_number(player_value->'maxFocus', 0)
    ELSE 45 + attunement * 5 END;

  progression_value := CASE WHEN jsonb_typeof(payload->'progression') = 'object' THEN sable_strip_turn_transients(payload->'progression') ELSE '{}'::jsonb END;
  techniques_value := CASE WHEN jsonb_typeof(payload->'techniques') = 'object' THEN sable_strip_turn_transients(payload->'techniques') ELSE '{}'::jsonb END;
  FOREACH ledger_key IN ARRAY ARRAY['purchasedNodes', 'techniquePoints', 'awardedTechniqueLevels', 'milestoneStates', 'masteryStates', 'actionMastery', 'repetition'] LOOP
    ledger_value := CASE
      WHEN jsonb_typeof(techniques_value->ledger_key) = 'object' THEN techniques_value->ledger_key
      WHEN jsonb_typeof(progression_value->ledger_key) = 'object' THEN progression_value->ledger_key
      ELSE '{}'::jsonb
    END;
    techniques_value := jsonb_set(techniques_value, ARRAY[ledger_key], ledger_value, true);
  END LOOP;

  discoveries_value := CASE
    WHEN jsonb_typeof(payload->'discoveries') = 'array' THEN payload->'discoveries'
    WHEN jsonb_typeof(payload->'discovered') = 'array' THEN payload->'discovered'
    ELSE '[]'::jsonb
  END;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(discoveries_value) AS entries(value)
    WHERE jsonb_typeof(value) <> 'string' OR length(value #>> '{}') = 0
  ) THEN
    RAISE EXCEPTION 'save discoveries must contain nonempty strings';
  END IF;
  SELECT COALESCE(jsonb_agg(value ORDER BY first_ordinality), '[]'::jsonb)
    INTO discoveries_value
    FROM (
      SELECT value, min(ordinality) AS first_ordinality
      FROM jsonb_array_elements(discoveries_value) WITH ORDINALITY AS entries(value, ordinality)
      GROUP BY value
    ) AS unique_discoveries;

  world_state_value := CASE WHEN jsonb_typeof(payload->'worldState') = 'object' THEN payload->'worldState' ELSE '{}'::jsonb END;

  IF jsonb_typeof(payload#>'{respawn,transform}') = 'object' THEN
    respawn_spatial := CASE WHEN jsonb_typeof(payload#>'{respawn,spatial}') = 'object' THEN payload#>'{respawn,spatial}' ELSE spatial_value END;
    respawn_value := jsonb_build_object(
      'coordinateSpaceId', COALESCE(NULLIF(payload#>>'{respawn,coordinateSpaceId}', ''), respawn_spatial#>>'{address,coordinateSpaceId}'),
      'transform', jsonb_build_object(
        'x', payload#>'{respawn,transform,x}',
        'y', payload#>'{respawn,transform,y}',
        'z', payload#>'{respawn,transform,z}',
        'yaw', payload#>'{respawn,transform,yaw}'
      ),
      'spatial', sable_strip_turn_transients(respawn_spatial)
    );
  ELSIF jsonb_typeof(payload->'respawn') = 'object'
    AND jsonb_typeof(payload#>'{respawn,x}') = 'number'
    AND jsonb_typeof(payload#>'{respawn,y}') = 'number' THEN
    respawn_value := jsonb_build_object(
      'coordinateSpaceId', spatial_value#>>'{address,coordinateSpaceId}',
      'transform', jsonb_build_object(
        'x', LEAST(95.999, GREATEST(0, sable_jsonb_number(payload#>'{respawn,x}', 0) * 4)),
        'y', 0,
        'z', LEAST(95.999, GREATEST(0, sable_jsonb_number(payload#>'{respawn,y}', 0) * 4)),
        'yaw', 0
      ),
      'spatial', spatial_value
    );
  ELSE
    respawn_value := location_value;
  END IF;

  RETURN jsonb_build_object(
    'version', 6,
    'savedAt', to_char(updated_at_value AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'identity', jsonb_build_object('accountId', account_id_value::text, 'characterId', character_id_value::text),
    'character', character_value,
    'appearance', appearance_v2,
    'location', location_value,
    'vitals', jsonb_build_object(
      'health', GREATEST(0, LEAST(maximum_health, sable_jsonb_number(vitals_value->'health', sable_jsonb_number(player_value->'hp', maximum_health)))),
      'maximumHealth', maximum_health,
      'stamina', GREATEST(0, LEAST(maximum_stamina, sable_jsonb_number(vitals_value->'stamina', sable_jsonb_number(player_value->'stamina', maximum_stamina)))),
      'maximumStamina', maximum_stamina,
      'focus', GREATEST(0, LEAST(maximum_focus, sable_jsonb_number(vitals_value->'focus', sable_jsonb_number(player_value->'focus', maximum_focus)))),
      'maximumFocus', maximum_focus
    ),
    'skillXp', CASE
      WHEN jsonb_typeof(payload->'skillXp') = 'object' THEN sable_strip_turn_transients(payload->'skillXp')
      WHEN jsonb_typeof(payload->'skills') = 'object' THEN sable_strip_turn_transients(payload->'skills')
      WHEN jsonb_typeof(payload->'experience') = 'object' THEN sable_strip_turn_transients(payload->'experience')
      ELSE '{}'::jsonb
    END,
    'techniques', techniques_value,
    'progression', progression_value,
    'inventory', CASE WHEN jsonb_typeof(payload->'inventory') = 'object' THEN sable_strip_turn_transients(payload->'inventory') ELSE '{}'::jsonb END,
    'quests', CASE WHEN jsonb_typeof(payload->'quests') = 'object' THEN sable_strip_turn_transients(payload->'quests') ELSE '{}'::jsonb END,
    'worldEvents', CASE WHEN jsonb_typeof(payload->'worldEvents') = 'object' THEN sable_strip_turn_transients(payload->'worldEvents') ELSE '{}'::jsonb END,
    'discoveries', discoveries_value,
    'respawn', respawn_value,
    'worldState', jsonb_build_object(
      'gathered', CASE
        WHEN jsonb_typeof(world_state_value->'gathered') = 'object' THEN sable_strip_turn_transients(world_state_value->'gathered')
        WHEN jsonb_typeof(payload->'gathered') = 'object' THEN sable_strip_turn_transients(payload->'gathered')
        ELSE '{}'::jsonb
      END,
      'enemies', CASE
        WHEN jsonb_typeof(world_state_value->'enemies') = 'array' THEN sable_strip_turn_transients(world_state_value->'enemies')
        WHEN jsonb_typeof(payload->'enemies') = 'array' THEN sable_strip_turn_transients(payload->'enemies')
        ELSE '[]'::jsonb
      END
    ),
    'trackedQuestId', CASE
      WHEN jsonb_typeof(payload->'trackedQuestId') = 'string' AND length(payload->>'trackedQuestId') > 0 THEN payload->'trackedQuestId'
      WHEN jsonb_typeof(payload->'trackedQuest') = 'string' AND length(payload->>'trackedQuest') > 0 THEN payload->'trackedQuest'
      ELSE 'null'::jsonb
    END,
    'playSeconds', GREATEST(0, sable_jsonb_number(payload->'playSeconds', 0)),
    'legacyImport', CASE
      -- Pre-V6 saves used the four-salt FNV compatibility identity. Preserve
      -- that claim value and label it honestly; new application imports use SHA-256.
      WHEN jsonb_typeof(source->'importedFrom') = 'object' THEN source->'importedFrom' || jsonb_build_object('algorithm', 'legacy-fnv1a64x4-v1')
      WHEN jsonb_typeof(source->'legacyImport') = 'object' THEN source->'legacyImport'
      ELSE 'null'::jsonb
    END,
    'activeEncounterDurability', 'excluded_not_crash_recoverable'
  );
END $$;

UPDATE characters
SET save_v6 = sable_build_save_v6(id, account_id, name, appearance, transform, save_v4, save_v5, updated_at)
WHERE save_v6 IS NULL AND (save_v5 IS NOT NULL OR save_v4 IS NOT NULL);

DROP FUNCTION sable_build_save_v6(uuid, uuid, text, jsonb, jsonb, jsonb, jsonb, timestamptz);
DROP FUNCTION sable_jsonb_number(jsonb, numeric);
DROP FUNCTION sable_strip_turn_transients(jsonb);

DO $$
BEGIN
  ALTER TABLE characters DROP CONSTRAINT IF EXISTS characters_save_v6_schema;
  ALTER TABLE characters
    ADD CONSTRAINT characters_save_v6_schema
    CHECK (
      save_v6 IS NULL OR COALESCE((
        jsonb_typeof(save_v6) = 'object'
        AND (save_v6 - ARRAY[
          'version','savedAt','identity','character','appearance','location','vitals','skillXp','techniques','progression',
          'inventory','quests','worldEvents','discoveries','respawn','worldState','trackedQuestId','playSeconds',
          'legacyImport','activeEncounterDurability'
        ]::text[]) = '{}'::jsonb
        AND save_v6->'version' = '6'::jsonb
        AND jsonb_typeof(save_v6->'savedAt') = 'string'
        AND jsonb_typeof(save_v6->'identity') = 'object'
        AND (save_v6->'identity' - ARRAY['accountId','characterId']::text[]) = '{}'::jsonb
        AND jsonb_typeof(save_v6#>'{identity,accountId}') = 'string'
        AND length(save_v6#>>'{identity,accountId}') > 0
        AND save_v6#>>'{identity,accountId}' = account_id::text
        AND jsonb_typeof(save_v6#>'{identity,characterId}') = 'string'
        AND length(save_v6#>>'{identity,characterId}') > 0
        AND save_v6#>>'{identity,characterId}' = id::text
        AND jsonb_typeof(save_v6->'character') = 'object'
        AND jsonb_typeof(save_v6#>'{character,name}') = 'string'
        AND length(btrim(save_v6#>>'{character,name}')) > 0
        AND jsonb_typeof(save_v6->'appearance') = 'object'
        AND jsonb_typeof(save_v6->'location') = 'object'
        AND jsonb_typeof(save_v6#>'{location,transform}') = 'object'
        AND jsonb_typeof(save_v6#>'{location,transform,x}') = 'number'
        AND jsonb_typeof(save_v6#>'{location,transform,y}') = 'number'
        AND jsonb_typeof(save_v6#>'{location,transform,z}') = 'number'
        AND jsonb_typeof(save_v6#>'{location,transform,yaw}') = 'number'
        AND jsonb_typeof(save_v6#>'{location,coordinateSpaceId}') = 'string'
        AND save_v6#>>'{location,coordinateSpaceId}' = save_v6#>>'{location,spatial,address,coordinateSpaceId}'
        AND abs((save_v6#>>'{location,transform,x}')::numeric) <= 65536
        AND abs((save_v6#>>'{location,transform,z}')::numeric) <= 65536
        AND abs((save_v6#>>'{location,transform,y}')::numeric) <= 8192
        AND abs((save_v6#>>'{location,transform,yaw}')::numeric) <= 100000
        AND (
          save_v6#>>'{location,coordinateSpaceId}' <> 'hearthmere_local_meters' OR (
            (save_v6#>>'{location,transform,x}')::numeric >= 0 AND (save_v6#>>'{location,transform,x}')::numeric <= 95.999
            AND (save_v6#>>'{location,transform,z}')::numeric >= 0 AND (save_v6#>>'{location,transform,z}')::numeric <= 95.999
            AND (save_v6#>>'{location,transform,y}')::numeric BETWEEN -8 AND 32
          )
        )
        AND save_v6#>'{location,transform}' = transform
        AND jsonb_typeof(save_v6->'vitals') = 'object'
        AND jsonb_typeof(save_v6#>'{vitals,health}') = 'number'
        AND jsonb_typeof(save_v6#>'{vitals,maximumHealth}') = 'number'
        AND jsonb_typeof(save_v6#>'{vitals,stamina}') = 'number'
        AND jsonb_typeof(save_v6#>'{vitals,maximumStamina}') = 'number'
        AND jsonb_typeof(save_v6#>'{vitals,focus}') = 'number'
        AND jsonb_typeof(save_v6#>'{vitals,maximumFocus}') = 'number'
        AND (save_v6#>>'{vitals,maximumHealth}')::numeric > 0
        AND (save_v6#>>'{vitals,maximumStamina}')::numeric > 0
        AND (save_v6#>>'{vitals,maximumFocus}')::numeric > 0
        AND (save_v6#>>'{vitals,health}')::numeric BETWEEN 0 AND (save_v6#>>'{vitals,maximumHealth}')::numeric
        AND (save_v6#>>'{vitals,stamina}')::numeric BETWEEN 0 AND (save_v6#>>'{vitals,maximumStamina}')::numeric
        AND (save_v6#>>'{vitals,focus}')::numeric BETWEEN 0 AND (save_v6#>>'{vitals,maximumFocus}')::numeric
        AND jsonb_typeof(save_v6->'skillXp') = 'object'
        AND sable_jsonb_nonnegative_number_map(save_v6->'skillXp')
        AND jsonb_typeof(save_v6->'techniques') = 'object'
        AND jsonb_typeof(save_v6#>'{techniques,purchasedNodes}') = 'object'
        AND jsonb_typeof(save_v6#>'{techniques,techniquePoints}') = 'object'
        AND jsonb_typeof(save_v6#>'{techniques,awardedTechniqueLevels}') = 'object'
        AND jsonb_typeof(save_v6#>'{techniques,milestoneStates}') = 'object'
        AND jsonb_typeof(save_v6#>'{techniques,masteryStates}') = 'object'
        AND jsonb_typeof(save_v6#>'{techniques,actionMastery}') = 'object'
        AND jsonb_typeof(save_v6#>'{techniques,repetition}') = 'object'
        AND jsonb_typeof(save_v6->'progression') = 'object'
        AND jsonb_typeof(save_v6->'inventory') = 'object'
        AND sable_jsonb_nonnegative_number_map(save_v6->'inventory')
        AND jsonb_typeof(save_v6->'quests') = 'object'
        AND jsonb_typeof(save_v6->'worldEvents') = 'object'
        AND jsonb_typeof(save_v6->'discoveries') = 'array'
        AND sable_jsonb_unique_nonempty_string_array(save_v6->'discoveries')
        AND jsonb_typeof(save_v6->'respawn') = 'object'
        AND jsonb_typeof(save_v6#>'{respawn,transform}') = 'object'
        AND jsonb_typeof(save_v6#>'{respawn,transform,x}') = 'number'
        AND jsonb_typeof(save_v6#>'{respawn,transform,y}') = 'number'
        AND jsonb_typeof(save_v6#>'{respawn,transform,z}') = 'number'
        AND jsonb_typeof(save_v6#>'{respawn,transform,yaw}') = 'number'
        AND jsonb_typeof(save_v6#>'{respawn,coordinateSpaceId}') = 'string'
        AND save_v6#>>'{respawn,coordinateSpaceId}' = save_v6#>>'{respawn,spatial,address,coordinateSpaceId}'
        AND abs((save_v6#>>'{respawn,transform,x}')::numeric) <= 65536
        AND abs((save_v6#>>'{respawn,transform,z}')::numeric) <= 65536
        AND abs((save_v6#>>'{respawn,transform,y}')::numeric) <= 8192
        AND abs((save_v6#>>'{respawn,transform,yaw}')::numeric) <= 100000
        AND (
          save_v6#>>'{respawn,coordinateSpaceId}' <> 'hearthmere_local_meters' OR (
            (save_v6#>>'{respawn,transform,x}')::numeric >= 0 AND (save_v6#>>'{respawn,transform,x}')::numeric <= 95.999
            AND (save_v6#>>'{respawn,transform,z}')::numeric >= 0 AND (save_v6#>>'{respawn,transform,z}')::numeric <= 95.999
            AND (save_v6#>>'{respawn,transform,y}')::numeric BETWEEN -8 AND 32
          )
        )
        AND jsonb_typeof(save_v6->'worldState') = 'object'
        AND jsonb_typeof(save_v6#>'{worldState,gathered}') = 'object'
        AND jsonb_typeof(save_v6#>'{worldState,enemies}') = 'array'
        AND sable_jsonb_object_array(save_v6#>'{worldState,enemies}')
        AND jsonb_typeof(save_v6->'playSeconds') = 'number'
        AND (jsonb_typeof(save_v6->'trackedQuestId') = 'string' OR save_v6->'trackedQuestId' = 'null'::jsonb)
        AND (
          save_v6->'legacyImport' = 'null'::jsonb OR (
            jsonb_typeof(save_v6->'legacyImport') = 'object'
            AND save_v6#>'{legacyImport,schemaVersion}' = '3'::jsonb
            AND jsonb_typeof(save_v6#>'{legacyImport,importedAt}') = 'string'
            AND jsonb_typeof(save_v6#>'{legacyImport,fingerprint}') = 'string'
            AND save_v6#>>'{legacyImport,fingerprint}' ~ '^[0-9a-f]{64}$'
            AND save_v6#>>'{legacyImport,algorithm}' IN ('sha256', 'legacy-fnv1a64x4-v1')
            AND legacy_import_fingerprint IS NOT NULL
            AND save_v6#>>'{legacyImport,fingerprint}' = btrim(legacy_import_fingerprint)
          )
        )
        AND save_v6->>'activeEncounterDurability' = 'excluded_not_crash_recoverable'
        AND NOT (save_v6 ? 'accountId')
        AND NOT (save_v6 ? 'characterId')
        AND NOT (save_v6 ? 'activeEncounter')
        AND NOT (save_v6 ? 'activeEncounters')
      ), false)
    );
END $$;

CREATE TABLE IF NOT EXISTS turn_command_ledger (
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  command_id varchar(160) NOT NULL CHECK (length(command_id) > 0),
  canonical_body text NOT NULL CHECK (length(canonical_body) > 0),
  result jsonb NOT NULL,
  committed_at timestamptz NOT NULL,
  PRIMARY KEY (character_id, command_id)
);

CREATE TABLE IF NOT EXISTS turn_encounter_outcome_ledger (
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  encounter_id varchar(160) NOT NULL CHECK (length(encounter_id) > 0),
  canonical_outcome text NOT NULL CHECK (length(canonical_outcome) > 0),
  result jsonb NOT NULL,
  committed_at timestamptz NOT NULL,
  PRIMARY KEY (character_id, encounter_id)
);

CREATE TABLE IF NOT EXISTS turn_legacy_import_claims (
  fingerprint char(64) PRIMARY KEY CHECK (fingerprint ~ '^[0-9a-f]{64}$'),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  character_id uuid NOT NULL UNIQUE REFERENCES characters(id) ON DELETE RESTRICT,
  claimed_at timestamptz NOT NULL
);

-- Harden the pre-turn import path too: a legacy payload may never be replayed
-- into another account even before all callers move to the claim table.
CREATE UNIQUE INDEX IF NOT EXISTS characters_legacy_import_fingerprint_global_idx
  ON characters (legacy_import_fingerprint)
  WHERE legacy_import_fingerprint IS NOT NULL;

INSERT INTO turn_legacy_import_claims (fingerprint, account_id, character_id, claimed_at)
SELECT legacy_import_fingerprint, account_id, id, COALESCE(legacy_imported_at, updated_at, created_at)
FROM characters
WHERE legacy_import_fingerprint IS NOT NULL
ON CONFLICT DO NOTHING;

COMMIT;
