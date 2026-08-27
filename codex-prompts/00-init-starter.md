Build a complete, functional Node.js-based chat web application in this
directory. The visual experience should be inspired by modern AI chat
applications, but do not copy ChatGPT branding, logos, or proprietary assets.

You are authorized to create and edit files, install normal project
dependencies, initialize the database, and run non-destructive validation
commands. Do not deploy the application or create external cloud resources.
If a small implementation detail is unspecified, choose a sensible default
and continue.

TECHNOLOGY

Use:

- Next.js 15+ with the App Router
- TypeScript in strict mode
- React
- Tailwind CSS
- Auth.js/NextAuth for authentication
- Prisma with SQLite for local development
- Zod for server-side request validation
- The official OpenAI Node SDK for OpenAI requests
- Ollama's local HTTP API for Ollama requests
- next-themes for light/dark theme handling
- Lucide React for icons
- Vitest for focused unit tests
- ESLint and TypeScript validation

Keep API keys, password hashes, and provider configuration on the server.
Never expose them through client components or public environment variables.

PRODUCT REQUIREMENTS

1. HOME PAGE

Create a responsive public home page at `/`.

The top navigation bar must contain:

- A simple application wordmark on the left
- A light/dark theme toggle
- A login icon or Login button on the right

The hero section must contain:

- A concise headline describing the chat application
- Supporting text
- A primary "Get started" or "Sign in" button
- A secondary button or link to learn more
- A restrained visual treatment suitable for a professional application

The page must work in light and dark modes and on mobile and desktop.

2. AUTHENTICATION

Create a login page at `/login`.

Support these conceptual authentication methods:

- Username/password
- Google OAuth
- Microsoft OAuth

For this initial version, only username/password authentication is enabled.

Display Google and Microsoft sign-in buttons, but render them disabled and
visually greyed out. Include a small "Coming soon" or "Not configured" label.
Disabled buttons must not initiate authentication.

Use this local bootstrap account:

- Username/email: admin@mptwork.local
- Initial development password: admin
- Display name: Administrator

Do not compare or store the password as plain text at runtime.

Create a database seed script that:

- Creates the bootstrap user when it does not exist
- Hashes the password with bcrypt or argon2
- Is safe to run multiple times
- Does not overwrite a changed password on later seed runs

Clearly mark the default password as development-only in the README.
Recommend changing it before any shared or production deployment.

Use a database-backed user model. Treat the username as an email-formatted
login identifier.

Implement:

- Secure password verification on the server
- Session handling
- Logout
- Generic invalid-credentials errors that do not disclose whether a user exists
- Protection of `/chat` and `/settings`
- Redirect unauthenticated users to `/login`
- Redirect authenticated users away from `/login` to `/chat`
- A safe `callbackUrl` policy that only permits local application paths

Include placeholder Google and Microsoft provider environment variables in
`.env.example`, but do not enable the providers yet.

3. CHAT PAGE

Create an authenticated chat page at `/chat`.

Layout:

- Collapsible responsive sidebar
- New chat button
- Placeholder conversation-history area
- Main message area
- User and assistant message styling
- Multiline composer
- Send button
- Enter sends and Shift+Enter inserts a newline
- Loading state while awaiting a reply
- Useful empty state
- Accessible labels and keyboard behavior

The first version does not need persistent conversation history. Keep current
messages in client state. Make this limitation explicit in the README.

Create a server endpoint such as `/api/chat`. The browser must never call
OpenAI or Ollama directly.

Define a small provider-neutral server interface such as:

    generateReply(messages): Promise<string>

Implement three adapters:

- OpenAI
- Ollama
- Echo fallback

Provider selection rules:

- If `LLM_PROVIDER=openai` and all required OpenAI configuration is present,
  call OpenAI.
- If `LLM_PROVIDER=ollama` and all required Ollama configuration is present,
  call Ollama.
- If `LLM_PROVIDER` is absent, invalid, or its required configuration is
  incomplete, use echo mode.
- Echo mode returns the latest user message in a clearly identified response,
  for example: `Echo: <message>`.
- Do not silently switch from a configured provider to another real provider.
- A runtime provider error should return a friendly error; it should not leak
  keys, URLs, stack traces, or internal response bodies.
- Put provider selection in a pure function that can be unit tested.

OpenAI configuration:

- `LLM_PROVIDER=openai`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Use the official OpenAI Node SDK and the Responses API. Extract text safely
from the response. Do not invent a default API key.

Ollama configuration:

- `LLM_PROVIDER=ollama`
- `OLLAMA_BASE_URL`
- `OLLAMA_MODEL`

Call Ollama through its server-side HTTP API. Permit a local base URL such as
`http://127.0.0.1:11434`, but keep the URL configurable.

Validate chat input with Zod:

- Require at least one message
- Permit only `user` and `assistant` roles from the browser
- Reject blank user messages
- Apply sensible message-count and character-length limits
- Return proper 400, 401, and 500-series responses
- Require authentication on the chat endpoint

Streaming is optional for this boilerplate. Prefer a reliable non-streaming
implementation unless streaming can be implemented cleanly.

4. SIDEBAR USER MENU

At the bottom of the authenticated sidebar, show:

- The authenticated user's display name
- Their username/email
- A user avatar icon or generated initials

Clicking the user area must open an accessible popup/dropdown menu.

The initial menu contains:

- Settings
- Log out

Settings should be the first/default application menu item and link to
`/settings`.

Close the menu when:

- An item is selected
- Escape is pressed
- The user clicks outside the menu

5. SETTINGS PAGE

Create a protected `/settings` page.

For the boilerplate it should include:

- Account display name
- Account username/email
- Current provider mode: OpenAI, Ollama, or Echo
- Theme control
- A note explaining that secrets and model settings are configured through
  server environment variables

Never display secret environment-variable values.

6. DARK MODE

Implement light, dark, and system theme modes using `next-themes`.

Requirements:

- Theme toggle available in the public navigation
- Theme control accessible from authenticated pages
- Persist the selected theme
- Avoid a visible hydration/theme flash
- All screens, menus, inputs, buttons, borders, and error states must remain
  legible in both themes

7. USER EXPERIENCE AND ACCESSIBILITY

Use semantic HTML and accessible controls.

Include:

- Visible focus styles
- Keyboard-accessible navigation and menus
- Labels for form fields
- `aria-label` for icon-only controls
- Disabled styling and semantics for unavailable OAuth buttons
- Mobile sidebar behavior
- Loading, empty, and error states
- No horizontal overflow at common mobile widths

Keep the design quiet, polished, and professional. Avoid excessive gradients,
glass effects, oversized text, and unnecessary animations.

8. SECURITY AND OPERATIONS

Add:

- `.env.example`
- `.gitignore` rules for `.env*`, while retaining `.env.example`
- Server-only environment validation
- Password hashing
- Auth checks at page and API boundaries
- Safe error messages
- Input-size limits
- A basic in-memory development rate limiter for the login and chat endpoints,
  clearly documented as insufficient for distributed production deployment
- Security headers that are safe for the chosen implementation

Do not commit secrets or a populated production database.

9. TESTING

Add focused tests covering at least:

- Password verification succeeds and fails correctly
- Provider selection chooses echo when configuration is missing
- Provider selection chooses OpenAI only when its required configuration exists
- Provider selection chooses Ollama only when its required configuration exists
- Invalid provider values select echo
- Echo returns the latest user message
- Chat input validation rejects empty and oversized input
- Protected chat requests reject unauthenticated access

If practical, add a small Playwright smoke test for:

- Logging in with the bootstrap account
- Reaching the chat page
- Sending a message in echo mode
- Opening the sidebar user menu
- Navigating to Settings
- Toggling dark mode

10. DOCUMENTATION

Create a useful README that contains:

- Project overview
- Prerequisites
- Installation commands
- Environment setup
- Database initialization and seed commands
- Development command
- Default development login
- OpenAI configuration example
- Ollama installation/model/configuration example
- Echo-mode behavior
- Test, lint, typecheck, and production-build commands
- Security and production-hardening notes
- Explanation that OAuth buttons are intentionally disabled
- A short section explaining how to enable Google and Microsoft OAuth later

Provide `.env.example` similar to:

    AUTH_SECRET=
    DATABASE_URL="file:./dev.db"

    LLM_PROVIDER=
    OPENAI_API_KEY=
    OPENAI_MODEL=

    OLLAMA_BASE_URL=
    OLLAMA_MODEL=

    GOOGLE_CLIENT_ID=
    GOOGLE_CLIENT_SECRET=

    MICROSOFT_ENTRA_ID_CLIENT_ID=
    MICROSOFT_ENTRA_ID_CLIENT_SECRET=
    MICROSOFT_ENTRA_ID_TENANT_ID=

Use the environment variable names expected by the actual implementation.
Generate a secure local `AUTH_SECRET` during setup if appropriate, but never
print or commit real secrets.

IMPLEMENTATION PROCESS

Before making changes:

1. Inspect the directory.
2. Briefly state the proposed architecture and file layout.
3. Identify any existing files that must be preserved.

Then implement the application completely.

After implementation:

1. Install dependencies.
2. Generate the Prisma client.
3. Apply the local database migration.
4. Run the seed.
5. Run focused tests.
6. Run the full test suite.
7. Run TypeScript checking.
8. Run ESLint.
9. Run a production build.
10. Fix errors caused by the implementation and rerun the failed checks.

Do not stop after merely generating files. Continue until the application
builds and the relevant tests pass, or report a concrete external blocker.

FINAL RESPONSE

Summarize:

- What was built
- Important files
- How authentication works
- How provider selection works
- Exact commands to start the application
- Default development login
- Validation results
- Any remaining limitations

ACCEPTANCE CRITERIA

The task is complete only when:

- The home, login, chat, and settings pages render
- Unauthenticated users cannot access chat or settings
- `admin@mptwork.local` / `admin` works after seeding
- Google and Microsoft buttons are visible but disabled
- Echo chat works with no LLM configuration
- OpenAI and Ollama can be selected through server configuration
- User name and Settings appear in the sidebar menu
- Logout works
- Dark mode works and persists
- Secrets remain server-side
- Tests, typecheck, lint, and production build pass