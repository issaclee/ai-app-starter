# Codex Prompt Sequence

These files are implementation briefs, not runtime configuration. They record how the starter was built and provide repeatable instructions for extending a clone.

## Recommended order for reconstructing the reference application

1. `00-init-starter.md` — initialize the technical foundation.
2. `01-refine-starter.md` — establish the original AIAppStarter shell.
3. `feature-login-1.md` — implement the login experience.
4. `feature-chat-1.md` — implement the authenticated chat workspace.
5. `feature-settings-1.md` — add profile, user management, and connection sessions.
6. `feature-landing-page1.md` — apply the current Agentic ERP brand, landing page, and workspace entry copy.
7. `feature-deployment-1.md` — package one production image that runs with default SQLite or production PostgreSQL persistence.

The prompts are cumulative. Earlier files intentionally contain historical `AIAppStarter` references that are replaced by the final landing-page brief. Do not rerun an early prompt against a finished clone without reconciling it with the current `AGENTS.md`, `src/config/app.ts`, and later feature briefs.

## Using a prompt in a clone

1. Read `AGENTS.md` and the current source first.
2. Select the smallest prompt that matches the requested feature.
3. Treat current code and later product decisions as authoritative when an older prompt differs.
4. Preserve unrelated work and adapt paths or names to the clone.
5. Update the prompt when a durable product requirement changes.
6. Run the verification sequence requested by the prompt.

For a new enterprise product, begin rebranding in `src/config/app.ts` and follow `docs/CUSTOMIZATION.md`. Do not edit every historical prompt merely to rename the cloned product.
