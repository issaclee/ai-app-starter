# Agentic ERP Enterprise App Starter

A secure, opinionated foundation for building authenticated enterprise AI applications with Next.js 16, React 19, strict TypeScript, Auth.js, Prisma, Zod, Tailwind CSS, and Vitest.

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

- Node.js 20 or newer.
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
npm run db:migrate   # apply the idempotent schema bootstrap
npm run db:seed      # seed the bootstrap administrator
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

## Important production limits

SQLite and the in-memory rate limiter are development defaults. Before running multiple instances, move to a managed production database, use a shared rate-limit store, establish migrations and backups, configure trusted origins and OAuth callbacks, add monitoring, and rotate all bootstrap credentials. See [Production readiness](docs/PRODUCTION.md).

## License

No license is included by default. Choose and add the license appropriate for your organization before distributing a cloned project.
