CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (email = lower(email)),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS magic_link_tokens (
  token_hash char(64) PRIMARY KEY,
  email text NOT NULL CHECK (email = lower(email)),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS magic_link_expiry_idx ON magic_link_tokens (expires_at) WHERE used_at IS NULL;

CREATE TABLE IF NOT EXISTS sessions (
  token_hash char(64) PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS session_account_idx ON sessions (account_id, expires_at);

CREATE TABLE IF NOT EXISTS characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name varchar(32) NOT NULL,
  appearance jsonb NOT NULL,
  transform jsonb NOT NULL,
  public_phase_mask integer NOT NULL DEFAULT 1 CHECK (public_phase_mask >= 0),
  personal_phase_mask integer NOT NULL DEFAULT 3 CHECK (personal_phase_mask >= 0),
  save_v4 jsonb,
  legacy_import_fingerprint char(64),
  legacy_imported_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, name),
  UNIQUE (account_id, legacy_import_fingerprint)
);

CREATE TABLE IF NOT EXISTS event_ledger (
  id bigserial PRIMARY KEY,
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  idempotency_key varchar(64) NOT NULL,
  kind varchar(64) NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (character_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS audit_events (
  id bigserial PRIMARY KEY,
  account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  kind varchar(64) NOT NULL,
  subject_id text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_created_idx ON audit_events (created_at DESC);
