# Prompt: Package Agentic ERP for SQLite and PostgreSQL Deployment

Use this prompt as a step-by-step implementation brief for the current repository. Follow `AGENTS.md`, inspect the existing application before editing, and preserve unrelated working-tree changes. The result must be one immutable application image that selects SQLite or PostgreSQL at runtime without rebuilding.

## Goal

Add a production-ready container packaging and persistence layer with these operating modes:

1. `docker compose up -d --build` builds and runs the default all-in-one SQLite stack.
2. `docker compose -f docker-compose-sqlite.yaml up -d --build` runs the equivalent explicitly named SQLite stack.
3. `docker-compose-psql.yaml` runs the same image with PostgreSQL.
4. External PostgreSQL is the production default. The PostgreSQL container is available only through the explicit `bundled-database` Compose profile.
5. Environment files configure image tags, ports, database URLs, Auth.js callback origins, OAuth providers, and model providers without baking secrets into the image.

Work through the following steps in order. Keep SQLite development behavior compatible while adding the PostgreSQL and container paths.

## 1. Inspect the repository and framework guidance

1. Read `AGENTS.md`, `package.json`, `next.config.ts`, both environment examples, the Prisma schema and migration runner, `src/lib/db.ts`, authentication configuration, server-side Prisma consumers, and current documentation.
2. Read the relevant Next.js 16 documentation under `node_modules/next/dist/docs/` before changing build output or server runtime behavior.
3. Inspect the Git diff and preserve unrelated changes.
4. Use the locked npm dependencies. Do not introduce another ORM, migration framework, or container-only package.
5. Use Node.js 22 or newer locally and use the same major version in the production image.

## 2. Define the runtime database contract

Add `DATABASE_PROVIDER` with exactly two supported values:

- `sqlite`
- `postgresql`

Default local development to `sqlite`. Require `DATABASE_PROVIDER` and `DATABASE_URL` to describe the same provider:

```dotenv
DATABASE_PROVIDER=sqlite
DATABASE_URL="file:./dev.db"
```

For PostgreSQL, require a `postgresql://` URL. Fail early with a clear error for an unsupported provider or incompatible migration URL. Do not attempt to infer the provider only from `DATABASE_URL`.

## 3. Maintain provider-specific Prisma schemas and generated clients

1. Keep `prisma/schema.prisma` as the SQLite schema.
2. Set its generator output to `prisma/generated/sqlite-client`.
3. Add a structurally equivalent PostgreSQL schema at `prisma/postgresql/schema.prisma` with its generated client under `prisma/generated/postgresql-client`.
4. Preserve model names, fields, defaults, relationships, cascade behavior, unique constraints, and indexes across both schemas.
5. Use provider-appropriate column types and SQL in migrations.
6. Ignore `prisma/generated/` in Git and ESLint. Never hand-edit generated clients.

Update `npm run db:generate` so it generates both clients in one command using harmless provider-specific placeholder URLs. Keep explicit SQLite and PostgreSQL generation aliases if useful, but ensure the universal image always contains both clients.

## 4. Select the Prisma client at runtime

Update the server-only database module to:

1. Import both generated clients.
2. Read and normalize `DATABASE_PROVIDER`.
3. Instantiate the PostgreSQL client only when the provider is `postgresql`; otherwise instantiate SQLite.
4. Preserve the development global-client cache so hot reload does not create excessive connections.
5. Export the same `prisma` interface consumed by existing services.

Generated clients expose separate Prisma error classes. Replace provider-specific `instanceof Prisma.PrismaClientKnownRequestError` checks in shared application services with a small provider-neutral helper that safely detects an error `code`, such as `P2002`. Apply it to OAuth identity linking, profile updates, and user management without changing their response behavior.

## 5. Add provider-aware database commands

Create a database command dispatcher that loads Next.js environment files and supports:

- `generate`: generate both Prisma clients.
- `migrate`: choose the SQLite or PostgreSQL runner using `DATABASE_PROVIDER`.

Retain the previous `prisma/migrate.mjs` entry point as a backward-compatible SQLite wrapper if existing documentation or scripts may call it.

Update package scripts to provide:

```text
db:generate
db:generate:sqlite
db:generate:postgresql
db:migrate
db:migrate:sqlite
db:migrate:postgresql
db:seed
db:bootstrap-admin
db:import:sqlite
```

The normal development seed remains SQLite-only and must refuse to run against PostgreSQL.

## 6. Preserve the SQLite compatibility migration

Move or retain the current idempotent SQLite schema bootstrap in `prisma/migrate-sqlite.mjs` using the generated SQLite client.

It must:

1. Create all required application tables and indexes when absent.
2. Safely add compatibility columns to existing databases.
3. Preserve foreign keys and cascade behavior.
4. Keep the local bootstrap account active and administrative.
5. Be safe to rerun.

Add `prisma/initialize-sqlite.mjs` for Compose. It must validate `DATABASE_PROVIDER=sqlite` and a `file:` database URL, apply the SQLite schema, and then run the idempotent local seed.

## 7. Add append-only PostgreSQL migrations

Create a PostgreSQL baseline migration under a timestamped directory in `prisma/postgresql/migrations/`. It must create all application tables, keys, constraints, and indexes represented by the PostgreSQL Prisma schema.

Implement a dedicated PostgreSQL migration runner that:

1. Requires a PostgreSQL URL.
2. Retries initial connections for managed databases that are still becoming available.
3. Acquires a PostgreSQL advisory lock so concurrent releases cannot migrate simultaneously.
4. Creates an `AppMigration` ledger containing migration name, SHA-256 checksum, and application timestamp.
5. Applies migration directories in lexical order.
6. Refuses to continue if an already-applied migration file has changed.
7. Applies each migration transactionally and records it only after success.
8. Releases the advisory lock and disconnects in a `finally` block.

Use explicit statement boundaries in SQL migration files so multi-statement migrations can be executed deterministically.

## 8. Add explicit production administrator provisioning

Create a provider-aware administrator bootstrap command using:

- `BOOTSTRAP_ADMIN_EMAIL`
- `BOOTSTRAP_ADMIN_NAME`
- `BOOTSTRAP_ADMIN_PASSWORD`

Normalize and validate the email, limit the name, and require a strong password of at least 12 characters. Hash with the existing bcrypt cost. Upsert the account as an active administrator so the command can also perform a controlled credential rotation. Do not create a known default administrator automatically in PostgreSQL production.

## 9. Support optional SQLite-to-PostgreSQL import

Add an explicit import workflow using:

- `SQLITE_DATABASE_URL` for the source `file:` URL.
- `DATABASE_URL` for the target PostgreSQL URL.

Generate both clients before importing. Refuse a target containing any application records. Copy users, OAuth identities, connection sessions, chats, messages, stable IDs, timestamps, and password hashes in one transaction. Never modify the SQLite source. Require PostgreSQL migrations before import and administrator bootstrap afterward.

## 10. Add a database-aware health endpoint

Add `GET /api/health` as a dynamic route. Execute a trivial database query and return:

- `200` with `{ "status": "ok" }` when the selected database is reachable.
- `503` with `{ "status": "unavailable" }` otherwise.

Do not expose connection details or raw database errors.

## 11. Produce a standalone universal Docker image

Set Next.js output to `standalone`. Add a multi-stage `Dockerfile` that:

1. Uses Node.js 22 slim and installs the native OpenSSL runtime required by Prisma.
2. Installs dependencies with `npm ci` in a dependency stage.
3. Supplies non-secret build-only SQLite placeholders.
4. Runs `npm run db:generate` before `npm run build`.
5. Copies the standalone server, static assets, public assets, both generated clients and engines, bcrypt runtime, migration scripts, seed/bootstrap scripts, and PostgreSQL migration SQL into the runner.
6. Creates `/app/data` for SQLite persistence.
7. Runs as an unprivileged user.
8. Exposes port 3000 and starts `server.js`.

Add `.dockerignore` entries for Git data, local dependencies, build outputs, test coverage, local databases, generated clients, private environment files, logs, and OS metadata. Safe example environment files may remain in the build context when required.

## 12. Make SQLite the default Compose workflow

Create `docker-compose.yaml` with SQLite as the default and create an equivalent `docker-compose-sqlite.yaml` for explicit use.

Both files must:

1. Build and tag `${APP_IMAGE:-agentic-erp:latest}` from the Dockerfile runner target.
2. Force `DATABASE_PROVIDER=sqlite` and use `file:/app/data/agentic-erp.db`.
3. Mount a named `sqlite-data` volume at `/app/data`.
4. Run a one-shot `initialize` service before the application.
5. Publish `${APP_PORT:-3000}:3000`.
6. Load `.env.sqlite` when present.
7. Include the database-aware health check.
8. Use `init`, restart policies, and `no-new-privileges` where appropriate.
9. Build the image only once; the initializer consumes the same image.

These commands must work:

```bash
docker compose up -d --build
docker compose -f docker-compose-sqlite.yaml up -d --build
```

For configurable image and port interpolation, document:

```bash
docker compose --env-file .env.sqlite up -d --build
```

Stopping without `--volumes` must preserve the SQLite database. Clearly warn that `down --volumes` deletes it.

## 13. Add the PostgreSQL production Compose workflow

Create `docker-compose-psql.yaml` using the same application image.

External PostgreSQL must be the default:

1. Start a one-shot `migrate` service using `prisma/migrate-postgresql.mjs`.
2. Start `app` only after migration succeeds.
3. Pass `DATABASE_PROVIDER=postgresql` and the external `DATABASE_URL` through `.env.production`.
4. Do not start a PostgreSQL container when `COMPOSE_PROFILES` is empty.
5. Keep an optional PostgreSQL 16 service behind the `bundled-database` profile.
6. Make the migration dependency on that optional service non-required; when enabled, wait for its health check.
7. Persist the bundled database in a named volume and never publish its port by default.
8. Add application health checks and security options.

Add `docker-compose.build.yaml` only as a build override so an already-built or registry-pulled image can run from the base PostgreSQL file without source code.

External production command:

```bash
docker compose --env-file .env.production \
  -f docker-compose-psql.yaml -f docker-compose.build.yaml \
  up -d --build
```

Run an existing image without the build override:

```bash
docker compose --env-file .env.production \
  -f docker-compose-psql.yaml up -d
```

For the optional bundled database, set `COMPOSE_PROFILES=bundled-database`, configure `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD`, and use `postgres:5432` in `DATABASE_URL`.

## 14. Provide safe environment templates

Update `.env.example` with the local SQLite provider selection. Add `.env.sqlite.example` and `.env.production.example`, ensure they are explicitly allowed by `.gitignore`, and never place working credentials in them.

The SQLite template should include:

- `APP_IMAGE` and `APP_PORT`.
- `AUTH_URL=http://localhost:3000`.
- A replace-before-sharing `AUTH_SECRET`.
- OpenAI-compatible and Ollama provider settings.
- Google and Microsoft OAuth client settings.
- `host.docker.internal` as the example host for an Ollama server running on the Docker host.

The production template should include:

- External PostgreSQL as the default with empty `COMPOSE_PROFILES`.
- `DATABASE_PROVIDER=postgresql`.
- A placeholder external `DATABASE_URL`, including provider-required TLS options.
- A public HTTPS `AUTH_URL`.
- Strong-secret placeholders and explicit administrator bootstrap values.
- Model-provider and OAuth settings.
- Bundled PostgreSQL variables documented as profile-only.

When adapting an existing private `.env` to `.env.sqlite`, copy authentication, OAuth, and model-provider values without printing them or committing the resulting private file. Preserve the SQLite-specific container values.

## 15. Document OAuth callback behavior

OAuth callbacks use the origin reachable by the user's browser and provider, not an internal container address.

For the default local container:

```text
AUTH_URL=http://localhost:3000
Google:    http://localhost:3000/api/auth/callback/google
Microsoft: http://localhost:3000/api/auth/callback/microsoft
```

If `APP_PORT` changes, use that published host port. For production, replace the origin with the public HTTPS domain. Never register `app:3000`, a container name or IP, or `host.docker.internal` as an OAuth callback.

## 16. Update documentation and repository guidance

Update all durable guidance in the same feature:

- `README.md`: quick commands for default SQLite, explicit SQLite, external PostgreSQL, optional bundled PostgreSQL, administrator provisioning, OAuth callbacks, and persistent volumes.
- `docs/GETTING_STARTED.md`: Node.js version, database-provider contract, local Docker setup, and the production handoff.
- `docs/ARCHITECTURE.md`: dual schemas/clients, runtime selection, migration ledger and locking, one universal image, and Compose responsibilities.
- `docs/PRODUCTION.md`: external database URL, TLS, secrets, callbacks, build versus run commands, migration ordering, administrator provisioning, optional import, health checks, operational limits, and release checklist.
- `AGENTS.md`: record SQLite local development and PostgreSQL production support.
- `codex-prompts/README.md`: add this deployment prompt to the cumulative sequence.

Keep `.env.example` files safe to commit and keep real `.env`, `.env.sqlite`, and `.env.production` files private.

## 17. Verify the complete feature

Run the application checks:

```bash
npm run db:generate
npm run db:migrate
npm run typecheck
npm run lint
npm run test
npm run build
```

Validate Compose without printing resolved secrets:

```bash
docker compose -f docker-compose.yaml config --quiet
docker compose -f docker-compose-sqlite.yaml config --quiet
docker compose --env-file .env.production \
  -f docker-compose-psql.yaml -f docker-compose.build.yaml \
  config --quiet
```

Confirm service selection:

- External PostgreSQL mode lists only `migrate` and `app`.
- `COMPOSE_PROFILES=bundled-database` lists `postgres`, `migrate`, and `app`.

Build the default image and smoke-test proportionally:

1. Confirm `agentic-erp:latest` builds successfully.
2. Start SQLite, wait for the initializer, verify the app becomes healthy, and confirm data survives a container recreation.
3. Run the same image digest with PostgreSQL, verify migrations complete, and verify the health endpoint.
4. Confirm invalid provider/URL combinations fail clearly.
5. Confirm OAuth uses the expected host-visible callback origin.
6. Confirm no real credentials or database files appear in Git or the Docker build context.

Turbopack may report Prisma's generated dynamic-filesystem tracing warnings. Record them separately, but do not treat a successful build warning as a failed image build. Fix genuine application, migration, or container failures and rerun the affected checks.

Finish with a concise summary of changed files, exact run commands, verification results, and any remaining operational requirements. Do not deploy, push, or commit unless explicitly requested.
