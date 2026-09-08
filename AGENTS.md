<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Enterprise Application Starter Playbook

These instructions apply to the entire repository. Use them as the default convention for cloned applications and new enterprise features unless a feature specification explicitly says otherwise.

## Technology and Commands

- Next.js 16 App Router, React 19, and strict TypeScript.
- Tailwind CSS 4 with shared theme tokens and component classes in `src/app/globals.css`.
- Auth.js with JWT sessions; credentials, Google, and Microsoft providers.
- Prisma 5 with SQLite for local development and PostgreSQL for production, Zod 4 validation, and `bcryptjs` password hashing.
- Vitest for unit and integration tests and ESLint for static checks.
- Use the existing npm scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `db:generate`, `db:migrate`, and `db:seed`.

Before changing Next.js code, read the relevant guide under `node_modules/next/dist/docs/`. This project may use APIs and conventions that differ from older Next.js versions.

## Working Principles

- Inspect the nearest existing feature before introducing a new pattern. The settings user-management feature is the canonical CRUD reference.
- Preserve unrelated and user-authored working-tree changes.
- Prefer small, feature-focused components and explicit types over generic CRUD frameworks.
- Keep server and client responsibilities clear. Server components and route handlers load trusted data; client components own interaction state only when necessary.
- Do not add dependencies when the existing stack can solve the problem cleanly.
- Reuse the established theme, spacing, buttons, fields, icons, empty states, and error presentation.

## Product Brand and Entry Experience

- Treat this repository as a reusable enterprise application starter. Keep product-specific public identity and entry-page copy in `src/config/app.ts`; do not scatter new brand strings through layouts and shared components.
- Keep secrets, infrastructure values, authorization policy, and private service endpoints out of `src/config/app.ts`. Use validated environment variables and server-only modules for those concerns.
- The product name and shared wordmark are `Agentic ERP`. Keep the existing `/aiappstarter-mark.svg` logo mark unless a feature specification explicitly replaces the artwork.
- Keep the root metadata title and description aligned with Agentic ERP rather than the original starter branding.
- The public landing page at `/` is a narrative surface for Agentic ERP. Its central message is that the user's team, agents, data, and knowledge work together with intelligence embedded in every workflow and interaction.
- Preserve the existing session-aware primary calls to action: authenticated users continue to `/chat`, and unauthenticated users go to `/login`.
- The landing-page header uses the shared `BrandLogo`, in-page navigation, and the theme toggle. Do not add a separate Sign in or Open workspace button to the top navigation; the hero and closing callout own those actions.
- Preserve the established bright, white presentation in light mode. Dark mode may use the landing page's deep-ink enterprise treatment. Both modes must retain readable contrast and use the shared theme tokens wherever possible.
- The landing-page footer shows `© Copyright <current year> MPTWork` on the left and `People and intelligent agents, operating as one.` on the right. Generate the year at render time; do not hard-code it.
- The empty chat workspace should use Agentic ERP language rather than generic model language. Keep its heading, supporting line, and three starter prompts focused on practical business planning, analysis, coordination, and agent-assisted ERP workflows.
- When a change affects setup, public configuration, architecture, or production assumptions, update `README.md` and the relevant guide under `docs/` in the same feature.
- Keep `.env.example` safe to commit: use public defaults or placeholders only, document every supported variable, and never include a private hostname, token, tenant, or credential.

## CRUD Architecture

Use this request flow:

1. A route handler authenticates the request and parses its input.
2. A server-only feature service performs authorization, Prisma access, transactions, and business-rule enforcement.
3. The service returns a purpose-built DTO.
4. The route handler maps expected failures to the documented HTTP status and returns JSON.
5. A client workspace consumes the DTO and owns the collection/detail/form state machine.

Do not query Prisma directly from interactive client components. Do not duplicate authorization or invariant checks in route handlers. Client checks improve the experience but never replace server enforcement.

### Server-only services

- Put database access and sensitive business logic in a module guarded by `server-only`.
- Authorize every read and mutation from the current database user and active session, not from client state or an unverified/stale claim.
- Return DTOs that expose only fields required by the UI. Never return password hashes, session tokens, provider secrets, or internal authentication material.
- Use transactions for invariants that could be bypassed by concurrent requests, such as preserving a final active administrator.
- Use clear feature names such as `ManagedUser`, `createUserInputSchema`, `updateUserInputSchema`, `listUsers`, `createUser`, and `updateUser`. Avoid speculative repository abstractions.

### Validation and responses

- Define create and update schemas with Zod and share safe validation constants where useful.
- Trim human-entered text and normalize identifiers such as email addresses before uniqueness checks and persistence.
- Keep IDs and created/updated timestamps server-owned and read-only.
- Preserve entered form values when validation or the server returns an error.
- Use consistent response semantics:
  - `400` for invalid input.
  - `401` for an unauthenticated or inactive session.
  - `403` for an authenticated user without permission.
  - `404` for a missing resource within the authorized scope.
  - `409` for uniqueness conflicts or protected business-state conflicts.
- Hash every new or changed password with the existing bcrypt approach. A blank optional edit password means unchanged.

## Canonical CRUD User Experience

Model navigation explicitly with four modes:

- `closed`: the collection table is visible.
- `view`: a read-only record occupies the full content panel.
- `create`: a blank form occupies the full content panel.
- `edit`: a form for the selected record occupies the full content panel.

The collection and record panel are mutually exclusive. Do not split the datatable beside a detail or edit form.

### Toolbar actions

- Collection: show the primary New/Add action on the right.
- Detail: show Edit followed by an X close action on the right.
- Create and edit: show Cancel, Reset, and Save/Create in the top toolbar. Do not show the X action in form modes.
- Keep these actions in the toolbar instead of duplicating them at the form bottom.

### State behavior

- Clicking a table row opens `view`. Support Enter and Space for keyboard users.
- Add/New opens `create` with documented defaults.
- Edit copies the saved record into an isolated draft.
- Cancel in `edit` discards all draft changes and returns to the saved detail.
- Cancel in `create` discards the draft and returns to the collection.
- Reset remains in the current form mode. In `edit`, restore the saved record; in `create`, restore creation defaults.
- A successful save refreshes the collection, selects the saved record, and opens its detail view.
- Disable repeated submissions while a save or delete is in flight.
- Confirm before discarding dirty changes through navigation, Escape, or panel dismissal. An explicit Cancel may discard immediately when the control clearly communicates that behavior.
- Put destructive actions in a visually distinct danger zone at the bottom of the edit form and require confirmation.

### Singleton and Profile CRUD

Use a reduced state machine for singleton resources such as the current user's Profile:

- Open in a read-only detail view by default.
- The detail toolbar shows Edit followed by an X close action on the right.
- Edit replaces the detail content in the same panel and shows Cancel, Reset, and Save in the top toolbar. Do not show X while editing.
- Cancel discards the draft and returns to the saved detail view.
- Reset stays in edit mode and restores the saved values.
- Save persists the changes, refreshes the saved data, and returns to detail view.
- Confirm before another navigation action discards a dirty draft.
- Do not provide create, add, or delete actions for a singleton Profile.

For the current Profile implementation:

- Every active authenticated user may edit its own display name, email address, and color theme; this is not an administrator-only operation.
- Validate and normalize name and email with the shared Zod rules. Return inline field errors without clearing the draft.
- Persist name and email through `PATCH /api/profile`. Authorize the target from `getActiveSession`; never accept a user ID from the client for self-service updates.
- Apply a theme draft through `next-themes` only after Save. Cancel and Reset must not apply the draft theme.
- Model-provider details are informational and remain read-only because their configuration and secrets are server-managed.
- When an email changes, update email-keyed chat ownership in the same database transaction so the user's chat history remains accessible.
- After Save, update the account-menu identity immediately and refresh server-rendered session data.
- Use `400` for invalid profile fields, `401` for an inactive session, and `409` for an email conflict.

## Layout and Navigation

- Full-page workspaces use `h-dvh overflow-hidden` so the document itself does not scroll.
- Keep the desktop sidebar fixed in the workspace layout and use a drawer on smaller screens.
- Make the right panel `relative`, with its toolbar separated from an independently scrollable content region.
- Keep collection headers and important toolbar controls visible while their content scrolls.
- Use horizontal overflow for tables on narrow widths instead of crushing columns.
- The settings sidebar has no logo. Its first control is a Back icon with a `Back` label; use browser history when it can return to the page that opened settings and fall back to `/chat`.
- Profile is a view component, not a `/profile` route. It overlays the active workspace's right panel and follows the singleton CRUD flow: detail by default, Edit then X in the detail toolbar, and Cancel/Reset/Save in edit mode.
- Profile is always available from the account menu, including on chat. Settings is visible only to administrators.

## Tables, Forms, and Styling

- Provide loading, empty, error, and retry states for every asynchronously loaded collection.
- Make the whole row discoverably interactive when row selection is the primary action.
- Use semantic table markup, real buttons, associated labels, useful `aria-label` text for icon-only controls, and visible keyboard focus.
- Keep field errors next to their fields and place non-field/server errors near the form controls without clearing the draft.
- Reuse `.button-primary`, `.button-secondary`, `.field`, and the color tokens in `src/app/globals.css`.
- Use Lucide icons already present in the project. Do not add decorative imagery to utilitarian management screens.
- Support both light and dark themes with the existing tokens; do not hard-code a second visual system.
- Add search, filtering, sorting, pagination, or bulk actions only when requested. If present, keep filter state separate from the selected-record state.

## Authentication and Administrative Safety

- Include both credential users and persisted OAuth identities in user management. Never infer or auto-link an OAuth identity solely from an email collision when that would weaken account ownership.
- Disabled credential users cannot sign in, and disabled users must lose existing protected access.
- Persistent connection sessions must be validated server-side. Revocation cannot depend on the client voluntarily signing out.
- Treat user-agent and IP values as sanitized informational metadata only; never use IP addresses for authorization.
- When disabling a user, revoke active sessions in the same transaction.
- Protect the current administrator from disabling or deleting itself. Protect the final active administrator from demotion, disabling, or deletion.
- Protect the current administrative connection session from termination, while allowing termination of that administrator's other sessions.

## Prisma and Migrations

- Update `prisma/schema.prisma`, add an append-only migration, and update the project migration runner when its compatibility path requires it.
- Make migrations safe for existing data. Backfill required fields before enforcing constraints and ensure the bootstrap account remains an active administrator.
- Add indexes that correspond to actual lookup and ordering paths.
- Define relation cleanup deliberately; owned authentication/session records should normally cascade with their user.
- Keep seeds idempotent and safe to rerun.
- Run Prisma generation after schema changes and do not hand-edit generated client files.

## Verification Checklist

For a CRUD feature, verify at minimum:

- Collection → detail → edit and collection → create transitions.
- Cancel and Reset independently in create and edit modes.
- Successful save refreshes the collection and displays the saved detail.
- Validation, duplicate identifiers, optional edit secrets, and server errors preserve the draft.
- Responses omit hashes and other secrets.
- Unauthenticated and unauthorized access is rejected for every operation.
- Self-protection, final-admin protection, deletion cascades, and concurrent invariant enforcement.
- OAuth/local identity presentation and active-session behavior when relevant.
- Loading, empty, failure, and retry states.
- Keyboard focus, responsive drawer/table behavior, independent scrolling, and light/dark themes.

Run checks proportional to the change. The full verification sequence is:

```bash
npm run db:generate
npm run db:migrate
npm run typecheck
npm run lint
npm run test
npm run build
```

If the default development build engine fails because of a host-specific sandbox or process restriction, confirm that cause and use the supported webpack build as an additional diagnostic; do not hide real application build errors.
