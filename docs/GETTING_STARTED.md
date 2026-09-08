# Getting Started

This guide takes a fresh clone from source to a working local enterprise application.

## 1. Create your project

Clone or copy this repository into a new directory. Start on a new branch and keep the starter history only if it is useful to your organization.

```bash
git clone <repository-url> <project-name>
cd <project-name>
npm install
```

Use the checked-in npm lockfile. Do not replace the package manager or bulk-upgrade dependencies during initial setup.

## 2. Configure the environment

```bash
cp .env.example .env
openssl rand -base64 32
```

Set the generated secret as `AUTH_SECRET`. Keep `.env` local and never commit it.

The default database URL is SQLite:

```dotenv
DATABASE_URL="file:./dev.db"
```

Choose one model provider.

OpenAI-compatible:

```dotenv
LLM_PROVIDER=openai
OPENAI_PROVIDER_NAME=OpenAI
OPENAI_BASE_URL="https://api.openai.com/v1"
OPENAI_API_KEY=
OPENAI_MODEL=
```

The endpoint must implement compatible `/models` and `/chat/completions` APIs. If `OPENAI_MODEL` is blank, the server selects the first discovered model.

Ollama:

```dotenv
LLM_PROVIDER=ollama
OLLAMA_PROVIDER_NAME=Ollama
OLLAMA_BASE_URL="http://127.0.0.1:11434"
OLLAMA_MODEL=llama3.2
```

Install Ollama separately and run `ollama pull llama3.2` before using that example.

## 3. Configure optional OAuth providers

Create provider applications only for the sign-in methods you intend to expose. Configure these callback paths against your local or deployed origin:

- Google: `/api/auth/callback/google`
- Microsoft Entra ID: `/api/auth/callback/microsoft`

Then populate the matching variables in `.env`. Keep client secrets server-only.

## 4. Initialize local data

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

The seed creates the development administrator only when absent:

- Email: `admin@mptwork.local`
- Password: `admin`

Change this password immediately. The seed does not reset an existing account.

## 5. Start development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in, and confirm that the landing page, chat workspace, Profile, and administrator Settings load.

## 6. Rename the product

Edit `src/config/app.ts` before changing individual components. Replace the logo artwork only after updating its path in that file. Follow [Customization](CUSTOMIZATION.md) for the full rebrand sequence.

## 7. Establish a clean baseline

Before building a feature, run:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

If the baseline fails, resolve or document it before adding product work. Do not mix dependency upgrades, broad refactors, and the first domain feature in one change.
