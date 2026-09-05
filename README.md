# AIAppStarter

AIAppStarter is a small, secure AI chat starter built with Next.js, React, Auth.js, Prisma, and Tailwind CSS. It supports OpenAI-compatible providers and local Ollama servers.

## Prerequisites

- Node.js 20 or newer
- npm
- Optional: an OpenAI API key
- Optional: [Ollama](https://ollama.com/) and a downloaded local model

## Local setup

```bash
npm install
cp .env.example .env
```

Generate a strong Auth.js secret and put it in `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

Then initialize the database and start the app:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Development login

- Username: `admin@mptwork.local`
- Password: `admin`

This account and password are **development-only**. Change the password before sharing or deploying the app. The seed is idempotent: it creates the administrator only when absent and never overwrites a later password change.

## Model providers

Provider selection, model discovery, API keys, and upstream requests stay on the server. Missing or invalid configuration produces a safe, user-facing error in the chat interface.

### OpenAI-compatible providers

```dotenv
LLM_PROVIDER=openai
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=your_server_side_key
OPENAI_MODEL=your_model_name
```

The endpoint must implement the OpenAI-compatible `/chat/completions` and `/models` APIs. `OPENAI_API_KEY` is optional for providers that do not require authentication. When `OPENAI_MODEL` is blank, the server selects the first model returned by `/models`. Never prefix server configuration with `NEXT_PUBLIC_`.

### Ollama

Install Ollama, then download and serve a model:

```bash
ollama pull llama3.2
ollama serve
```

Configure AIAppStarter:

```dotenv
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2
```

When `OLLAMA_MODEL` is blank, the server selects the first locally available model returned by Ollama's `/api/tags` endpoint.

Restart the development server after changing environment variables.

## OAuth configuration

Google and Microsoft Entra ID sign-in use the server environment variables shown in `.env.example`. Configure these callback URLs in the provider consoles:

- Google: `/api/auth/callback/google`
- Microsoft: `/api/auth/callback/microsoft`

## Commands

```bash
npm run dev          # development server
npm run test         # unit tests
npm run typecheck    # strict TypeScript check
npm run lint         # ESLint
npm run build        # production build
npm run start        # run the production build
npm run db:generate  # generate Prisma client
npm run db:migrate   # apply the idempotent local schema bootstrap
npm run db:seed      # create the bootstrap user if absent
```

## Architecture

- `src/auth.ts` — credential authentication, safe redirects, and login throttling
- `src/app/api/chat/route.ts` — authenticated and validated chat boundary
- `src/lib/llm.ts` — streaming OpenAI-compatible and Ollama provider adapters
- `src/lib/chat-schema.ts` — input limits and Zod validation
- `src/app/(workspace)` — authenticated chat and settings pages
- `src/components` — chat, navigation, login, and theme UI
- `prisma/schema.prisma` and `prisma/seed.mjs` — local user database

The canonical initial migration SQL is checked in under `prisma/migrations`.
The `db:migrate` script applies the equivalent idempotent schema through the
Prisma client, which also makes repeated local bootstrap runs safe.

Conversation messages currently live in browser memory and disappear on refresh or when **New chat** is selected. Conversation persistence is intentionally outside this starter's scope.

## Security and production notes

- Passwords are hashed with bcrypt and model credentials remain server-side.
- Pages and the chat API independently verify the session.
- Login and chat use a basic in-memory rate limiter. It resets on process restart and does not coordinate across instances; use Redis or another shared store in a distributed deployment.
- SQLite is intended for local development. Consider managed PostgreSQL for multi-instance production use.
- Use HTTPS, rotate the bootstrap password and `AUTH_SECRET`, configure trusted hosts, review Content Security Policy requirements, and add monitoring before deployment.
- Do not commit `.env`, local databases, API keys, or OAuth credentials.
