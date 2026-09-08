# Prompt: Implement the Full Settings and User-Management Feature

Use this prompt as a step-by-step implementation brief for the current repository. Follow `AGENTS.md`, inspect the existing code before editing, and adapt names to the current structure instead of building a parallel framework.

## Goal

Implement `/settings` as an authenticated, full-page administrative workspace for user CRUD and active-session management. Preserve the app's established visual language. Keep Profile as an in-place view overlay rather than a route or a permanent section inside the settings workspace.

Work through the following steps in order. Complete and verify each layer before relying on it in the next one.

## 1. Inspect the application and current framework guidance

1. Read `AGENTS.md`, `package.json`, `prisma/schema.prisma`, the Auth.js configuration, the workspace/chat shell, existing settings code, shared styles, and nearby tests.
2. Read the relevant Next.js 16 documentation from `node_modules/next/dist/docs/` before changing routes, layouts, request APIs, or server/client boundaries.
3. Preserve unrelated changes and reuse the existing theme tokens, form classes, button classes, icons, authentication helpers, and error conventions.
4. Do not add a second state-management system, UI kit, or ORM abstraction.

## 2. Establish the data model and migration

Extend `User` with string-backed fields:

- `role`: `ADMIN` or `USER`.
- `status`: `ACTIVE` or `DISABLED`.

Persist all manageable identity types:

- Local credential users retain their password hash.
- OAuth identities are represented by an `ExternalIdentity` related to `User`, with provider and provider-account identifiers protected by a compound unique constraint.
- A user may have multiple authentication methods, but account linking must not rely on an unverified email collision.

Add `ConnectionSession`, related to `User`, with:

- Stable session ID.
- Authentication provider.
- Sanitized, length-limited user agent and IP address.
- Created, last-active, expiration, and optional revoked timestamps.
- An index supporting active-session lookup.
- Cascade deletion with its user.

Create a safe append-only migration. Backfill required fields, make existing users active, and ensure the bootstrap credential account is an active administrator. Keep seed and compatibility migration scripts idempotent, then regenerate Prisma.

## 3. Centralize authentication and connection-session validation

1. Extend JWT and application-session types with a stable connection-session ID and authentication provider.
2. Create a session ID on sign-in or while upgrading a trackable JWT, and persist the connection on its first authenticated request.
3. Persist local, Google, and Microsoft identities. Existing OAuth clients without a persisted identity must sign in again; providers cannot be enumerated and backfilled externally, so OAuth users appear in management after their next successful sign-in.
4. Reject disabled credential accounts during sign-in.
5. Implement a single server-only `getActiveSession` path that rejects missing, revoked, expired, or disabled-user sessions.
6. Throttle `lastActiveAt` writes rather than updating the database on every request.
7. Sanitize forwarded IP and user-agent input. Store IP only as informational metadata.
8. Revoke the connection record during normal logout.
9. Add an authenticated heartbeat endpoint. Poll it every 30 seconds from the chat workspace and check immediately when a hidden page becomes visible. Redirect an invalid or revoked client to login.

## 4. Build the server-only user-management service

Create one server-only layer that owns Prisma access, authorization, transactions, and DTO mapping.

The managed-user DTO must contain only safe UI fields, including:

- ID, name, normalized email, role, and status.
- Created and updated timestamps.
- Authentication-provider summaries.

Never expose password hashes, session tokens, raw provider credentials, or secrets.

Support listing, creation, update, and deletion. Validate:

- Name: trimmed, required, 1–100 characters.
- Email: trimmed, lowercase, valid, unique, and no more than 254 characters.
- Role: Admin or User.
- Status: Active or Disabled.
- Password: required for local-user creation, 8–128 characters; optional on edit, where blank means unchanged.
- IDs and timestamps: always read-only.

Authenticate administrators from the current active database record. Enforce these rules server-side:

- The current administrator cannot disable or delete itself.
- The final active administrator cannot be demoted, disabled, or deleted.
- Use a transaction for final-admin checks.
- Disabling a user revokes all active sessions in that same transaction.
- Hash every new or changed password using the existing bcrypt settings.

## 5. Add user and session APIs

Implement authenticated admin-only route handlers:

- `GET /api/settings/users`: list users.
- `POST /api/settings/users`: create a user.
- `PATCH /api/settings/users/:userId`: update a user.
- `DELETE /api/settings/users/:userId`: delete a user.
- `GET /api/settings/users/:userId/sessions`: list active, unexpired sessions.
- `DELETE /api/settings/users/:userId/sessions/:sessionId`: revoke one session belonging to that target user.

Also implement the self-service profile interface:

- `PATCH /api/profile`: update the currently authenticated user's display name and email.
- Resolve the target exclusively from `getActiveSession`; do not accept a target user ID from the request.
- Permit every active authenticated user, regardless of role.
- If the email changes, update email-keyed chat ownership in the same transaction so existing chat history remains accessible.
- Return the safe `{ name, email }` Profile DTO and never expose role, status, hashes, tokens, or provider secrets from this endpoint.

Return consistent errors:

- `400` invalid input.
- `401` unauthenticated or inactive session.
- `403` non-admin.
- `404` missing user or session within the target scope.
- `409` duplicate email, protected current session, self-protection, or final-admin conflict.

For `PATCH /api/profile`, use `400` for invalid fields, `401` for an inactive session, and `409` for a duplicate email.

The session DTO is `id`, `provider`, `client`, `ipAddress`, `createdAt`, `lastActiveAt`, `expiresAt`, and `isCurrent`. Exclude revoked and expired records. Never allow an administrator to terminate its current connection session; allow its other sessions and every other user's sessions to be terminated.

## 6. Make Profile an in-place workspace view

1. Do not create `/profile`.
2. Make Profile always available from the account popup on the chat page, not only from settings.
3. On `/chat`, selecting Profile overlays the chat right-panel content while retaining the surrounding chat workspace.
4. On `/settings`, selecting Profile overlays the settings right panel while retaining the settings sidebar.
5. Treat Profile as a singleton CRUD resource with `view` and `edit` modes only. Do not add create, new, or delete operations.
6. Open Profile in a read-only detail view by default. Its top toolbar shows Edit followed by X on the right. X closes Profile and restores the previously visible content in that workspace.
7. Edit occupies the same full right panel. Its toolbar shows only Cancel, Reset, and Save; do not show X in edit mode.
8. Cancel discards all draft changes and returns to the saved Profile detail. Reset stays in edit mode and restores the saved values. Save persists the changes, refreshes Profile, and returns to detail.
9. Preserve entered values on validation or server failure, disable repeated submissions, and confirm before another navigation action discards a dirty draft.
10. Allow every active authenticated user to edit its own display name, email, and color theme. Validate name and email with the shared user rules and normalize the email to lowercase.
11. Save name and email through `PATCH /api/profile`. Apply the theme through `next-themes` only after the server save succeeds, so Cancel and Reset never leak draft theme changes into the live application.
12. After Save, update the account-menu name/email immediately and refresh server-rendered session data before returning to read-only detail.
13. Keep Model Provider informational and read-only because model names, endpoints, and secrets are managed through server environment variables.
14. Move the existing account identity, Appearance, and Model Provider sections into this combined Profile view, with plain detail values in view mode and editable controls only in edit mode.
15. Keep Settings in the account popup for administrators only. Non-admin users manage their profile from chat and cannot open the administrative settings workspace.

## 7. Build the full-page settings workspace

Move `/settings` outside the normal chat content shell and make it an authenticated, admin-only, full-height workspace.

Sidebar requirements:

- Do not show the logo.
- Show only a back icon and the label `Back` at the top.
- Back uses browser history so it returns to the page that opened settings; fall back to `/chat` when no usable prior page exists.
- Show Users as the initially selected settings item.
- Keep the footer account control and its Profile and Log out popup actions; Profile opens the right-panel overlay from step 6.
- Use a fixed desktop sidebar and a responsive drawer on smaller screens.

Right-panel requirements:

- Use an independent scroll container so the document and sidebar stay fixed.
- Keep top toolbars and table headings visible as their content scrolls.
- Make the panel a relative positioning context so record and Profile-style overlays can occupy it fully when required.

## 8. Implement the Users collection

Load all persisted local and OAuth users. Use a responsive datatable with:

- User/name.
- Email.
- Authentication method(s).
- Role.
- Status.
- Updated timestamp.

Show a New/Add button on the right side of the top toolbar. Support the existing search and role/status filters without adding pagination, sorting, or bulk actions unless separately requested.

Clicking a row opens its record. Also support Enter and Space. Provide clear loading, empty, error, and retry states.

## 9. Implement full-panel detail mode

The detail view must occupy the entire settings right panel; do not leave the datatable visible beside it.

The detail toolbar shows, on its right side and in this order:

1. Edit.
2. X close.

The X returns to the Users datatable. It appears only in detail mode—never in edit or create mode.

Show read-only identity, access, authentication methods, ID, created timestamp, and updated timestamp. At the bottom, add the Active sessions datatable described in step 12.

## 10. Implement create and edit modes

Create and edit forms also occupy the full right panel. Their toolbar contains only:

- Cancel.
- Reset.
- Save, or Create for a new record.

Do not show the detail X action in create or edit mode.

Behavior must be exact:

- Edit starts from an isolated copy of the saved record.
- Cancel while editing discards all changes and returns to that record's read-only detail.
- Cancel while creating discards the draft and returns to the datatable.
- Reset while editing stays in edit mode and restores the saved values.
- Reset while creating stays in create mode and restores the creation defaults.
- A successful save refreshes the datatable and opens the saved record's detail.
- Inline validation and server errors do not clear entered values.
- Disable duplicate submissions while saving.
- Confirm before abandoning dirty changes through navigation, Escape, browser unloading, or another dismiss action.

## 11. Add the delete danger zone

Place deletion in a visually distinct danger zone at the very bottom of the edit form—not in the standard toolbar. Require explicit confirmation.

The UI should disable or hide illegal actions, but the server remains authoritative:

- An administrator cannot delete itself.
- An administrator cannot disable itself.
- Other administrators and non-admin users may be disabled or deleted if doing so does not remove the final active administrator.
- Owned authentication identities, connection sessions, and other intended dependent records are cleaned up according to explicit Prisma cascade/transaction behavior.

After deletion, refresh the collection and return to the datatable.

## 12. Add Active sessions to user detail

At the bottom of the read-only detail view, fetch and render an Active sessions table with:

- Client.
- IP address.
- Sign-in method.
- Started.
- Last active.
- Expires.
- Action.

Provide loading, empty, retryable error, and terminating states. Mark the administrator's current row as `Current session` and disable its termination control. Confirm before terminating another session; after success, remove it from the table. A termination must revoke server state immediately and must not depend on the remote client cooperating.

## 13. Finish accessibility and responsive behavior

- Use semantic tables, labels, and buttons.
- Give icon-only controls accessible names.
- Preserve visible focus rings and keyboard navigation.
- Make long tables horizontally scrollable on narrow screens.
- Verify sidebar drawer behavior and independent right-panel scrolling.
- Verify light and dark themes with existing tokens.
- Use existing Lucide icons and no decorative imagery.

## 14. Test the complete feature

Add or update tests for:

- Datatable → detail → edit and datatable → create transitions.
- The detail-only X placement after Edit.
- Absence of X in edit and create modes.
- Cancel and Reset semantics in both form modes.
- Profile opens in detail mode, uses Edit then X in its detail toolbar, and exposes only Cancel, Reset, and Save while editing.
- Profile Cancel, Reset, Save, dirty-draft protection, and the absence of create/delete operations.
- Profile updates are available to active admin and non-admin users, and the endpoint always targets the active session user.
- Profile name/email validation, lowercase email normalization, duplicate-email handling, and preservation of entered values after failure.
- Theme changes apply only after Save; Cancel and Reset leave the live theme unchanged.
- Email changes migrate email-keyed chat ownership transactionally and saved identity changes appear immediately in the account menu.
- Successful saves, deletion, refresh, and selected-detail behavior.
- Validation, normalized/duplicate emails, optional edit passwords, hashing, and secret omission.
- Unauthenticated and non-admin rejection for every management operation.
- Current-admin self-disable/self-delete protection and final-active-admin protection.
- Local, Google, and Microsoft persistence and display.
- Session creation, serialization, ordering, expiration/revocation filtering, and target ownership.
- Terminating another user's session and an administrator's other session.
- Rejection when terminating the current administrative session.
- Logout revocation, disabled-user revocation, heartbeat logout, activity throttling, and legacy-session handling.
- Loading, empty, failure, retry, responsive, scrolling, and keyboard/focus behavior.

Run:

```bash
npm run db:generate
npm run db:migrate
npm run typecheck
npm run lint
npm run test
npm run build
```

If a check fails, fix the underlying issue and rerun the affected check. Finish with a concise summary of changed files, migrations, security guarantees, and verification results. Do not deploy or commit unless explicitly requested.
