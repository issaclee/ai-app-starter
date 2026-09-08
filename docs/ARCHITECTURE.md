# Architecture

## Design goals

The starter favors explicit feature boundaries over a generic enterprise framework:

- Server components and route handlers establish trusted request context.
- Server-only services own authorization, database access, transactions, and business invariants.
- Route handlers validate transport input and map expected failures to HTTP responses.
- Client components own interaction state, not authority.
- Purpose-built DTOs expose only the data each UI needs.

## Request flows

Authenticated CRUD:

```text
Client workspace
  → route handler
  → active-session validation
  → server-only feature service
  → Prisma transaction/query
  → safe DTO
  → JSON response
```

Chat:

```text
ChatInterface
  → authenticated chat route
  → Zod message validation
  → server-only provider adapter
  → streamed response
  → user-owned chat persistence
```

Authentication:

```text
Auth.js provider
  → local credential check or persisted OAuth identity
  → JWT with stable user and connection-session IDs
  → getActiveSession()
  → current database status and revocation check
```

## Directory map

- `src/app/` — App Router pages, layouts, metadata, and HTTP route handlers.
- `src/app/(workspace)/` — authenticated chat and settings routes.
- `src/components/` — interactive workspaces and shared UI.
- `src/config/app.ts` — public, clone-friendly product configuration.
- `src/lib/` — validation, server services, provider adapters, persistence, and utilities.
- `src/auth.ts` — Auth.js providers, callbacks, JWT shaping, and logout revocation.
- `src/types/` — framework and library type augmentation.
- `prisma/` — schema, migrations, compatibility runner, and seed.
- `tests/` — Vitest unit and integration coverage.
- `codex-prompts/` — repeatable feature implementation briefs.
- `docs/` — setup, architecture, customization, and production guidance.

## Authentication and sessions

Credentials, Google, and Microsoft identities resolve to a persisted local `User`. OAuth identities use provider account IDs; the application does not infer account ownership solely from an email collision.

Auth.js uses JWT transport, while `ConnectionSession` provides persistent server-side revocation. `getActiveSession()` is the canonical protected-request boundary. It verifies that the user is active and the connection is present, unexpired, and not revoked, then refreshes activity on a throttled interval.

New protected pages and APIs should call that helper or a feature service that calls it. Never authorize from client state or an unverified JWT claim alone.

## Data model

The development schema contains:

- `User` for local application identity, role, status, and password hash.
- `ExternalIdentity` for OAuth provider ownership.
- `ConnectionSession` for revocable authenticated connections.
- `Chat` and `ChatMessage` for ordered, user-owned conversation history.

SQLite keeps local setup small. Production database migration is an explicit deployment decision; see [Production readiness](PRODUCTION.md).

## Extending the application

For a new enterprise resource:

1. Define focused Zod input schemas and safe DTO types.
2. Add the Prisma model and an append-only migration.
3. Implement a server-only service that owns authorization and invariants.
4. Expose narrow route handlers with consistent status codes.
5. Build the collection/detail/create/edit state machine in a feature component.
6. Add tests for validation, authorization, conflicts, invariants, and UI state behavior.
7. Update the relevant documentation and prompt brief.

Use the user-management feature as the canonical CRUD reference. Do not create a generic repository or CRUD engine unless multiple completed features demonstrate the same stable abstraction.

## Error semantics

- `400` — invalid input.
- `401` — missing, expired, revoked, or inactive session.
- `403` — authenticated but unauthorized.
- `404` — resource not found within the authorized scope.
- `409` — uniqueness or protected-state conflict.

Unexpected failures should be logged server-side and returned as safe, non-sensitive messages.
