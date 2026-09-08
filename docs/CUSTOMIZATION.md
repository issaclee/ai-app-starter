# Customization Guide

Use this sequence when turning the starter into a new enterprise product.

## 1. Change public product configuration

Edit `src/config/app.ts` first. It is safe to import from server and client components and contains no secrets.

Update:

- Product and company names.
- Public description.
- Wordmark text and logo path.
- Home, login, and workspace destinations if the route structure changes.
- Landing navigation and hero copy.
- Footer copy.
- Empty-chat heading and starter prompts.

Keep secrets, database URLs, private service addresses, entitlements, and authorization rules out of this file.

## 2. Replace brand assets

Add the new logo under `public/` and update `appConfig.logo.src`. Replace `src/app/icon.svg` and `src/app/favicon.ico` only when new final artwork is available. Preserve intrinsic dimensions and accessible text behavior in `BrandLogo`.

Do not rename or delete an asset until all references have been updated.

## 3. Adjust the theme

The shared light and dark tokens live at the top of `src/app/globals.css`. Change these tokens for application-wide branding:

- Background, foreground, panel, sidebar, composer, muted, and border.
- Brand, secondary, support, emphasis, danger, and soft brand colors.

Landing-only art direction uses `.erp-*` classes and dark-mode overrides in the same file. Keep light and dark contrast usable and preserve visible keyboard focus. Prefer tokens for shared application UI; use scoped styles only for intentional page-specific treatment.

## 4. Adapt the landing story

Keep `src/app/page.tsx` structural and move reusable product copy to `appConfig`. Rewrite or remove Agentic ERP-specific capability cards and workflow examples when the new product serves a different domain.

Do not advertise integrations, compliance, automation, or metrics that the cloned application does not actually support.

## 5. Adapt the workspace

The chat empty state reads from `appConfig.chat`. Replace its three starters with complete prompts that demonstrate real use cases for the new product.

For a different primary workspace, create a focused route under `src/app/(workspace)/`, retain the authenticated workspace layout, and update `appConfig.routes.workspace`. Do not put server credentials or database access in the client workspace.

## 6. Add a domain feature

Follow the architecture in `AGENTS.md` and `docs/ARCHITECTURE.md`:

1. Model the persisted data and migration.
2. Define validation and safe DTOs.
3. Implement authorization and business rules in a server-only service.
4. Add narrow route handlers.
5. Build the feature UI with explicit interaction states.
6. Test successful flows and protected failure paths.

Copy a nearby completed feature only as a pattern. Rename types and concepts for the domain instead of leaving generic or starter-specific terminology behind.

## 7. Review seeded data

Change the development administrator email in `prisma/seed.mjs` if appropriate. Never ship the default password. Keep seeds idempotent and safe to rerun.

## 8. Update documentation

Update:

- `README.md` for product setup and capabilities.
- `.env.example` for every required environment variable, using placeholders only.
- `AGENTS.md` for durable repository-wide conventions.
- `codex-prompts/` for repeatable, multi-step feature briefs.
- `docs/PRODUCTION.md` when infrastructure or operational assumptions change.

## 9. Verify

Run the complete verification sequence before treating the clone as a new baseline:

```bash
npm run db:generate
npm run db:migrate
npm run typecheck
npm run lint
npm run test
npm run build
```

Inspect the public landing page, login, chat, Profile, administrative user management, session revocation, responsive layouts, and both themes.
