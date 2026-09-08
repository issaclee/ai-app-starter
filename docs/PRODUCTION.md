# Production Readiness

This repository is a strong application foundation, but its local defaults are not a substitute for production infrastructure. Complete and record each decision below before deployment.

## Identity and secrets

- Generate a unique high-entropy `AUTH_SECRET` per environment.
- Remove or rotate the seeded administrator password before any shared deployment.
- Store model keys, OAuth secrets, and database credentials in the platform secret manager.
- Register exact HTTPS OAuth callback URLs for every environment.
- Restrict trusted hosts and redirects to owned origins.
- Establish a documented key and secret rotation process.

`AUTH_URL` is the public, browser-visible application origin, not an internal Docker address. For `https://erp.example.com`, register these exact redirect URIs when the corresponding providers are enabled:

```text
https://erp.example.com/api/auth/callback/google
https://erp.example.com/api/auth/callback/microsoft
```

For a local container published on port 3000, use `http://localhost:3000` and the same callback paths. Do not use `app:3000`, a container IP, or `host.docker.internal` for OAuth callbacks.

## Database and migrations

- The universal application image contains separately generated SQLite and PostgreSQL Prisma clients. Set `DATABASE_PROVIDER` and the matching `DATABASE_URL` together at runtime; changing only the URL is not supported.
- Apply PostgreSQL migrations through the dedicated one-shot service. It acquires an advisory lock, validates recorded checksums, and commits one append-only migration at a time before application startup.
- Keep SQLite and PostgreSQL model definitions structurally equivalent whenever the data model changes, and add provider-appropriate migrations to both histories.
- Back up the database, define retention, and test restoration.
- Review indexes against actual query and ordering paths.
- Run migrations as a controlled release step, not opportunistically from every application instance.

### Compose deployment

Create the private runtime environment file and replace all placeholders. `AUTH_SECRET`, database credentials, provider keys, and OAuth secrets must be generated per environment and must never be committed.

```bash
cp .env.production.example .env.production
```

Set `DATABASE_URL` to the external PostgreSQL connection URL. The URL must be reachable from inside the application container and should include the TLS parameters required by the provider. External PostgreSQL is the default: leave `COMPOSE_PROFILES` empty so the bundled database service remains disabled.

Keep `DATABASE_PROVIDER=postgresql`. Configure `AUTH_URL`, one model provider, and any enabled OAuth client credentials in the same private file. Percent-encode reserved characters in PostgreSQL usernames and passwords before placing them in the URL.

Build the immutable `APP_IMAGE`, run the migration service against the external database, and start the application:

```bash
docker compose --env-file .env.production \
  -f docker-compose-psql.yaml -f docker-compose.build.yaml \
  up --build -d
```

The build override only supplies the Docker build definition. The base `docker-compose-psql.yaml` is intentionally image-only, so a previously built or registry-pulled image runs with:

```bash
docker compose --env-file .env.production -f docker-compose-psql.yaml up -d
```

The migration runner uses the same `DATABASE_URL`, retries the external connection, and must finish successfully before the application starts. The optional dependency on the disabled `postgres` service is skipped.

For local or single-host testing, set `COMPOSE_PROFILES=bundled-database`, configure `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD`, and use `postgres:5432` as the hostname in `DATABASE_URL`. This explicitly enables the PostgreSQL 16 service and its named volume.

Inspect health and logs with:

```bash
docker compose --env-file .env.production -f docker-compose-psql.yaml ps
docker compose --env-file .env.production -f docker-compose-psql.yaml logs app migrate
```

`GET /api/health` returns `200` only when the process can query its database. Put the application behind a TLS-terminating reverse proxy; do not publish PostgreSQL directly.

### Single-container SQLite deployment

The default `docker-compose.yaml` packages the application and SQLite persistence without a database service:

```bash
cp .env.sqlite.example .env.sqlite
docker compose --env-file .env.sqlite up -d --build
```

`docker-compose-sqlite.yaml` defines the same stack under an explicit filename:

```bash
docker compose --env-file .env.sqlite \
  -f docker-compose-sqlite.yaml up -d --build
```

The `initialize` one-shot container applies the compatibility schema and local seed before the app starts. Both services mount the `sqlite-data` named volume at `/app/data`, and `DATABASE_PROVIDER=sqlite` selects the SQLite client from the same image used by PostgreSQL deployments. The `.env.sqlite` file configures the image tag, published port, callback origin, authentication, model provider, and OAuth integrations.

This mode is suitable for evaluation and one application instance only. Its fallback `AUTH_SECRET` and `admin@mptwork.local` / `admin` credentials are development conveniences and must be replaced before sharing. Do not scale the app service horizontally against SQLite. `docker compose -f docker-compose-sqlite.yaml down` preserves its database; `down --volumes` deletes it.

### Administrator provisioning

No production default account is created automatically. After migrations, set a unique `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_NAME`, and password of at least 12 characters, then run:

```bash
docker compose --env-file .env.production -f docker-compose-psql.yaml \
  run --rm --no-deps app \
  node prisma/bootstrap-admin.mjs
```

The command deliberately enforces active administrator state and replaces that account's password, so it can also perform a controlled credential rotation. Remove the password from the environment file after provisioning when your secret-delivery mechanism permits it.

### Optional SQLite import

Migrate the empty PostgreSQL target first. From a source checkout with Node dependencies installed, provide an absolute SQLite file URL and a reachable PostgreSQL URL:

```bash
DATABASE_PROVIDER=postgresql \
SQLITE_DATABASE_URL="file:/absolute/path/to/dev.db" \
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public" \
npm run db:import:sqlite
```

The importer generates both provider clients, refuses a target containing any application records, and copies all users, identities, connection sessions, chats, messages, IDs, timestamps, and password hashes in one transaction. It never changes the SQLite source. Immediately run the administrator bootstrap command afterward so imported development credentials are not exposed.

## Distributed runtime

- Replace the in-memory rate limiter with a shared store before running multiple instances.
- Validate that session revocation and activity updates remain consistent under concurrency.
- Configure request, response, and upstream-model timeouts.
- Set body-size and streaming limits at the application and proxy layers.
- Verify that the deployment runtime supports every Node.js dependency used for PDF, Word, authentication, Prisma, and model streaming.

## Application security

- Enforce HTTPS and secure cookies.
- Add a Content Security Policy tailored to the final hosting and OAuth requirements.
- Keep security headers in `next.config.ts` and validate them at the edge.
- Review authorization for every new route and service.
- Log administrative and destructive actions with actor, target, outcome, and timestamp.
- Avoid logging prompts, model responses, tokens, credentials, password material, or unnecessary personal data.
- Run dependency, secret, and source scanning in CI.
- Define data retention and deletion policies for chats, identities, sessions, and audit records.

## Reliability and observability

- Add structured server logs with request correlation IDs.
- Monitor authentication failures, rejected authorizations, model latency/errors, route error rates, and database saturation.
- Add health and readiness checks appropriate to the hosting platform.
- Define alerts, incident ownership, escalation, rollback, and status communication.
- Test degraded behavior when the model provider, OAuth provider, or database is unavailable.

## Delivery pipeline

At minimum, CI should install from the lockfile and run:

```bash
npm run db:generate
npm run typecheck
npm run lint
npm run test
npm run build
npm run db:generate
docker compose --env-file .env.production \
  -f docker-compose-psql.yaml -f docker-compose.build.yaml build
```

Use protected environments for migrations and deployment. Build one immutable artifact, promote that artifact between environments, and keep production secrets out of build logs.

## Release checklist

- [ ] Product configuration and metadata are final.
- [ ] Default credentials are removed or rotated.
- [ ] Production database and migrations are tested.
- [ ] The deployed image digest and `APP_IMAGE` tag are recorded.
- [ ] The application and PostgreSQL health checks pass.
- [ ] Shared rate limiting is configured.
- [ ] OAuth origins and callbacks are exact.
- [ ] HTTPS, cookies, trusted hosts, CSP, and security headers are verified.
- [ ] Backups and restore procedures are tested.
- [ ] Logs, metrics, alerts, and incident ownership are active.
- [ ] Privacy, retention, deletion, and audit requirements are documented.
- [ ] Typecheck, lint, tests, build, and smoke tests pass.
- [ ] Rollback steps are rehearsed.

Security, compliance, availability, and privacy requirements vary by organization and jurisdiction. Have the appropriate internal owners review the final system rather than treating this checklist as certification.
