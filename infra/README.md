# Hearthmere server foundation

The server starts on port `2567` and uses the same HTTP origin for the REST API,
Colyseus matchmaking, and WebSockets.

## Local modes

- `pnpm dev:server` uses the in-memory repository, local Colyseus presence, and
  development guest joins. It does not need Docker.
- `docker compose up --build` enables PostgreSQL durability plus Redis presence
  and matchmaking. PostgreSQL applies the ordered scripts mounted from
  `postgres/migrations/`, including retained save-v4/v5 columns, save v6, and
  the transactional turn command/outcome/import ledgers.
- Copy `infra/.env.example` into a secret-managed environment before any remote
  deployment. The included credentials are development-only.

Development magic links are returned as `devMagicLink` from
`POST /auth/request-link` and written as structured logs. Production suppresses
the URL and must supply a transactional email `MagicLinkSender` adapter.

## Protocol

- Room: `hearthmere`, maximum 50 clients, 30 Hz simulation, 20 Hz patches.
- Join options: `{ sessionToken?, characterId?, appearance? }`. Browser clients may instead
  rely on the signed `hm_session` HttpOnly cookie. Empty options are accepted
  only when `ALLOW_GUESTS=true`. Guest appearance is normalized and validated;
  authenticated joins always use the durable character appearance. Player state
  includes the bounded prototype cache fields `appearanceSignature` and
  `appearanceJson`.
- Messages: `input`, `travel`, and `action`. Accepted or rejected actions return
  `action_ack` with the authoritative server tick.
- `/bootstrap` advertises network protocol 2 and server save schema 6. The
  versioned simultaneous-plan contracts and deterministic kernel are present,
  but the room message handlers remain on the retained real-time path until the
  turn-runtime integration change lands.
- REST: `POST /auth/request-link`, `GET /auth/verify`, `GET/POST /characters`,
  `GET /bootstrap`, and `POST /characters/:id/import-legacy-v3`.

Click travel resolves through the canonical Hearthmere navigation projection,
rejects collider/out-of-nav destinations and blocked paths, and follows its
validated waypoint sequence. Direct movement is checked against the same
walkability data; client coordinates never bypass the room's authority checks.
