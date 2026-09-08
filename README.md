# Agentic ERP Enterprise App Starter

A secure, opinionated foundation for building authenticated enterprise AI applications with Next.js 16, React 19, strict TypeScript, Auth.js, Prisma, Zod, Tailwind CSS, and Vitest. SQLite supports fast local development, while PostgreSQL and Docker Compose provide the production deployment path.

The included Agentic ERP experience is the reference implementation. Clone the repository, update one public product configuration, then extend the existing service and route patterns for your domain.

## What is included

- Public, responsive product landing page with light and dark themes.
- Credentials, Google, and Microsoft Entra ID authentication.
- Server-validated connection sessions with revocation and activity tracking.
- Self-service profile and theme management.
- Administrator-only user CRUD and active-session management.
- Persistent, user-owned chat history.
- OpenAI-compatible and Ollama model adapters with server-only credentials.
- Markdown rendering and Markdown, PDF, and Word response export.
- Zod request validation, bcrypt password hashing, rate-limit boundaries, tests, and security headers.
- Step-by-step Codex implementation briefs in `codex-prompts/`.

## Quick start

Requirements:

- Node.js 22 or newer.
- npm.
- An optional OpenAI-compatible API or local Ollama server.

```bash
npm install
cp .env.example .env
openssl rand -base64 32
```

Put the generated value in `AUTH_SECRET`, then initialize and run the app:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The development seed creates `admin@mptwork.local` with password `admin` only when that account is absent. Change it immediately before sharing the application. Re-running the seed does not overwrite a changed password.

## Rebrand a cloned application

Start with [`src/config/app.ts`](src/config/app.ts). It centralizes the public product name, company, wordmark, route destinations, landing copy, and empty-chat starter prompts. Then replace the logo files and tune the theme tokens in `src/app/globals.css`.

Do not put credentials, internal endpoints, authorization rules, or infrastructure configuration in the public app configuration. Those belong in environment variables and server-only modules.

Follow the full [customization guide](docs/CUSTOMIZATION.md) before adding domain features.

## Configuration

Copy `.env.example` to `.env`. The application reads:

- `AUTH_SECRET` and `DATABASE_URL`.
- `DATABASE_PROVIDER` (`sqlite` locally or `postgresql` for production tooling).
- `LLM_PROVIDER` plus the selected OpenAI-compatible or Ollama settings.
- Optional Google OAuth credentials.
- Optional Microsoft Entra ID credentials.

Provider discovery, API keys, and upstream model calls stay on the server. Never use a `NEXT_PUBLIC_` prefix for secrets.

Detailed setup is in [Getting started](docs/GETTING_STARTED.md).

## Commands

```bash
npm run dev          # start local development
npm run build        # create the production build
npm run start        # run the production build
npm run typecheck    # run strict TypeScript checks
npm run lint         # run ESLint
npm run test         # run the Vitest suite once
npm run test:watch   # run Vitest in watch mode
npm run db:generate  # generate the Prisma client
npm run db:migrate   # apply migrations for the selected database provider
npm run db:seed      # seed the local SQLite bootstrap administrator
npm run db:bootstrap-admin # explicitly create or rotate a production administrator
npm run db:import:sqlite    # copy an existing SQLite database into empty PostgreSQL tables
```

Before handing off a substantial feature, run:

```bash
npm run db:generate
npm run db:migrate
npm run typecheck
npm run lint
npm run test
npm run build
```

## Documentation

- [Getting started](docs/GETTING_STARTED.md) — clone-to-running setup and environment configuration.
- [Architecture](docs/ARCHITECTURE.md) — request flows, boundaries, directories, and extension patterns.
- [Customization](docs/CUSTOMIZATION.md) — rebranding and adding enterprise features safely.
- [Production readiness](docs/PRODUCTION.md) — mandatory hardening decisions before deployment.
- [Agent instructions](AGENTS.md) — repository conventions for AI coding agents and contributors.
- [Feature prompts](codex-prompts/README.md) — ordered, repeatable implementation briefs for major starter features.

## Default Docker deployment with SQLite

The default Compose workflow builds `agentic-erp:latest`, initializes a persistent SQLite database, and starts the application on port 3000:

```bash
docker compose up -d --build
```

The explicit SQLite file provides the same stack and project name, so this command is equivalent:

```bash
docker compose -f docker-compose-sqlite.yaml up -d --build
```

Copy `.env.sqlite.example` to `.env.sqlite` to configure the host port, callback origin, private auth secret, model provider, and OAuth credentials. The database is stored in the `sqlite-data` named volume.

```bash
cp .env.sqlite.example .env.sqlite
docker compose --env-file .env.sqlite up -d --build
```

Use the browser-visible origin for OAuth. With the default port, set `AUTH_URL=http://localhost:3000` and register `http://localhost:3000/api/auth/callback/google` and `http://localhost:3000/api/auth/callback/microsoft` with their respective providers. Never register a Compose service name, container IP, or `host.docker.internal` as the browser callback origin.

After the image has been built once, `docker compose --env-file .env.sqlite up -d` runs it without requiring `--build`. Use `docker compose down` to stop it while preserving data. Adding `--volumes` permanently removes the SQLite database.

## Docker production deployment with PostgreSQL

Copy the safe production template and replace every placeholder:

```bash
cp .env.production.example .env.production
```

Set `DATABASE_URL` in `.env.production` to the externally reachable PostgreSQL connection URL. By default, Compose starts only the migration and application containers; it does not start a PostgreSQL container.

Set `AUTH_URL` to the public HTTPS application origin and register the matching `/api/auth/callback/google` and `/api/auth/callback/microsoft` redirect URIs. The database hostname must be reachable from the containers; it is unrelated to the public OAuth callback hostname.

Build, tag, migrate, and start the application against the external database:

```bash
docker compose --env-file .env.production \
  -f docker-compose-psql.yaml -f docker-compose.build.yaml \
  up --build -d
```

Provision the first administrator explicitly after the stack is healthy:

```bash
docker compose --env-file .env.production -f docker-compose-psql.yaml \
  run --rm --no-deps app \
  node prisma/bootstrap-admin.mjs
```

To run an image that was already built or pulled, omit the build override:

```bash
docker compose --env-file .env.production -f docker-compose-psql.yaml up -d
```

See [Production readiness](docs/PRODUCTION.md) for managed PostgreSQL, SQLite import, migration, health-check, and operational details.

For local or single-host testing with the optional bundled PostgreSQL container, set `COMPOSE_PROFILES=bundled-database` and change the database hostname in `DATABASE_URL` to `postgres`.

## Important production limits

SQLite and the in-memory rate limiter are development defaults. The production Compose stack in `docker-compose-psql.yaml` connects to external PostgreSQL by default and can optionally provide PostgreSQL for a single-host deployment. Multiple application instances still require a shared rate-limit store, coordinated caching, backups, a reverse proxy, monitoring, and exact OAuth/trusted-origin configuration. See [Production readiness](docs/PRODUCTION.md).

## License

No license is included by default. Choose and add the license appropriate for your organization before distributing a cloned project.
