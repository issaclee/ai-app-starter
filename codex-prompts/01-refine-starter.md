Build a complete, functional Node.js AI chat application named
“AIAppStarter” in the current directory.

AIAppStarter is a clean boilerplate for building AI-powered applications.
Its interface may follow familiar modern AI-chat interaction patterns, but
must not copy ChatGPT branding, proprietary assets, or exact visual identity.

AUTONOMY

You are authorized to:

- Inspect the current directory.
- Create and edit project files.
- Install normal project dependencies.
- Initialize and seed the local database.
- Run non-destructive development and validation commands.
- Fix implementation-related test, type, lint, and build failures.

Do not:

- Deploy the application.
- Create external cloud resources.
- commit secrets, API keys, or populated databases.
- perform destructive Git or filesystem operations.
- stop after scaffolding; continue until validation passes or a concrete
  external blocker is identified.

When a minor implementation detail is unspecified, select a sensible,
secure default and continue.

TECHNOLOGY

Use:

- Node.js 20 or newer
- Next.js 15 or newer with the App Router
- React
- TypeScript in strict mode
- Tailwind CSS
- Auth.js/NextAuth
- Prisma ORM
- SQLite for local development
- Zod for server-side input validation
- bcryptjs or argon2 for password hashing
- Official OpenAI Node SDK
- Ollama’s local HTTP API
- next-themes
- lucide-react
- Vitest
- ESLint

Use the conventions and APIs appropriate for the installed Next.js version.
Read relevant locally installed Next.js documentation before relying on older
framework conventions.

Keep API keys, passwords, password hashes, model configuration, and OAuth
credentials on the server. Never expose them through client components or
NEXT_PUBLIC environment variables.

BRAND

Product name:

    AIAppStarter

Product description:

    A simple, secure starter for AI-powered applications.

Use this color system:

Primary colors:

- Primary purple: #4B49AC
- Light blue: #98BDFF

Supporting colors:

- Focus blue: #7DA0FA
- Accent purple: #7879E9
- Coral: #F3797E

Color roles:

- #4B49AC: primary actions, logo background, send button, brand identity
- #98BDFF: selected navigation, soft highlights, connected logo node
- #7DA0FA: keyboard focus indicators
- #7879E9: secondary emphasis and user identity accents
- #F3797E: error states, destructive emphasis, second logo node

Keep page backgrounds and reading surfaces quiet and neutral:

Light theme:

- Main background: #FFFFFF
- Sidebar: #F9F9F9
- Composer: #F4F4F4
- Muted surface: #ECECEC
- Primary text: #0D0D0D
- Muted text: #5D5D5D
- Border: #E5E5E5

Dark theme:

- Main background: #212121
- Sidebar: #171717
- Composer/panels: #2F2F2F
- Primary text: #ECECEC
- Muted text: #B4B4B4
- Border: #424242

Create reusable CSS theme variables rather than scattering color literals
throughout components.

LOGO AND FAVICON

Create a simple vector logo consisting of:

- A rounded-square tile filled with #4B49AC
- A large white four-point AI spark in the center
- A small #7879E9 circle in the center of the spark
- A small #98BDFF node in the upper-left
- A small #F3797E node in the lower-right
- Rounded #98BDFF connector lines between the nodes and central spark

The mark must remain recognizable at favicon size.

Create:

- A reusable React BrandLogo component
- An icon-only SVG in `public`
- A Next.js `app/icon.svg`
- A compatible `favicon.ico`
- A wordmark treatment in which “AIApp” uses the normal foreground color and
  “Starter” uses the primary brand color

Use the logo on:

- Public navigation
- Login page
- Expanded workspace sidebar
- Browser favicon and page metadata

Do not show the logo while the desktop sidebar is collapsed.

HOME PAGE

Create a responsive public home page at `/`.

Top navigation:

- AIAppStarter logo and wordmark on the left
- Light/dark theme toggle
- Login button or authenticated “Open chat” button on the right

Hero:

- Professional, restrained layout
- Headline describing a focused place to work with AI
- Short supporting text
- Primary Get Started button
- Secondary Learn More button
- Small preview of the chat interface
- Concise feature list

Use quiet spacing, strong typography, and restrained shadows.
Avoid excessive gradients, glass effects, nested cards, and unnecessary
animation.

LOGIN PAGE

Create `/login`.

Enabled authentication method:

- Username/password

Visible but disabled methods:

- Google OAuth
- Microsoft OAuth

The Google and Microsoft buttons must:

- Be visible
- Be disabled semantically
- Be visually muted
- Include “Coming soon” or “Not configured”
- Never initiate authentication

Bootstrap development user:

- Username/email: admin@mptwork.local
- Initial password: admin
- Display name: Administrator

Requirements:

- Treat the username as an email-formatted identifier.
- Store only a secure password hash.
- Never compare plain-text stored passwords.
- Seed the user only when it does not already exist.
- Make the seed idempotent.
- Never overwrite an existing user’s changed password.
- Use generic invalid-credential messages.
- Apply development login rate limiting.
- Redirect authenticated users from `/login` to `/chat`.
- Permit callback URLs only when they are safe, local application paths.

Login layout:

- Form area on the left
- Branded statement panel on desktop
- Statement text:

    A simple, secure starter for AI powered applications.

- Supporting text:

    Start in echo mode, then connect the model provider that fits your
    environment.

Include Google and Microsoft environment placeholders, but do not enable
those providers initially.

AUTHENTICATED WORKSPACE

Protect:

- `/chat`
- `/settings`
- `/api/chat`

Unauthenticated page requests must redirect to `/login`.
Unauthenticated chat API requests must return HTTP 401.

Use a responsive application shell with:

- Desktop sidebar
- Mobile navigation drawer
- Main header
- Theme toggle
- User menu

SIDEBAR

Expanded desktop sidebar:

- AIAppStarter logo and wordmark
- Collapse button
- New Chat button
- Recent/current conversation placeholder
- Authenticated user at the bottom
- User initials, display name, and username/email

User menu:

- Settings as the first/default menu item
- Log out as the second item
- Close on Escape
- Close on outside click
- Close when a menu item is selected

Collapsed desktop behavior:

- Hide the complete sidebar
- Hide the logo and wordmark
- Hide chat links and user controls
- Show only an Expand Sidebar icon in the main header
- Expanding restores the full sidebar

Do not leave a narrow icon rail when collapsed.

Mobile behavior:

- Use an overlay drawer
- Provide an accessible open/close control
- Close the drawer after navigation
- Prevent horizontal overflow

CHAT PAGE

Create `/chat`.

The first version does not need persistent conversation history.
Keep messages in React client state and document that refreshing the page
clears the conversation.

Chat area:

- Useful empty state
- User messages
- Assistant messages
- Thinking/loading state
- Friendly provider errors
- Retry action
- New Chat resets client-side messages

Message styling:

- Keep assistant messages mostly borderless
- Use readable line height
- Use a subtle neutral bubble for user messages
- Use brand colors for avatars and selected accents
- Do not place every message inside a large card

PROMPT COMPOSER

Create a ChatGPT-style floating composer near the bottom of the chat page.

Requirements:

- Rounded pill/container
- Neutral composer background
- No horizontal border dividing chat history and composer
- No textarea focus box or focus outline
- Keep an accessible focus state on other controls
- Multiline textarea
- Enter sends
- Shift+Enter inserts a newline
- Send button is circular and uses #4B49AC
- Disabled send button has reduced opacity
- Composer remains usable on mobile

Auto-growing textarea:

- Begin at one line
- Set its height to `auto` before measuring
- Expand to its `scrollHeight`
- Cap height at approximately 200px
- Enable internal vertical scrolling only after reaching the maximum
- Return to one-line height after sending or starting a new chat
- Update correctly when suggested prompts populate the composer

Do not use an effect callback that implicitly returns the result of a DOM
method.

For example, do this:

    useEffect(() => {
      element?.scrollIntoView({ behavior: "smooth" });
    }, [dependency]);

Do not do this:

    useEffect(
      () => element?.scrollIntoView({ behavior: "smooth" }),
      [dependency],
    );

Every React effect must return either:

- Nothing
- A cleanup function

It must never return a Promise or arbitrary DOM method result.

CHAT PROVIDERS

Create a server-only provider-neutral interface similar to:

    generateReply(messages): Promise<string>

Implement:

- OpenAI adapter
- Ollama adapter
- Echo adapter

Provider selection:

1. If `LLM_PROVIDER=openai` and both `OPENAI_API_KEY` and `OPENAI_MODEL`
   are present, select OpenAI.
2. If `LLM_PROVIDER=ollama` and both `OLLAMA_BASE_URL` and `OLLAMA_MODEL`
   are present, select Ollama.
3. For missing, incomplete, blank, or invalid configuration, select echo.
4. Never silently switch from one configured real provider to another.
5. If a configured provider fails at runtime, return a friendly error without
   exposing keys, URLs, stack traces, or raw provider responses.

Echo behavior:

    Echo: <latest user message>

Provider selection must be a pure function that can be unit tested.

OPENAI

Configuration:

    LLM_PROVIDER=openai
    OPENAI_API_KEY=
    OPENAI_MODEL=

Requirements:

- Use the official OpenAI Node SDK.
- Use the Responses API.
- Make requests only from the server.
- Extract output text safely.
- Treat an empty model response as an error.
- Do not invent an API key or model name.

OLLAMA

Configuration:

    LLM_PROVIDER=ollama
    OLLAMA_BASE_URL=http://127.0.0.1:11434
    OLLAMA_MODEL=

Requirements:

- Call Ollama only from the server.
- Use its chat HTTP endpoint.
- Disable streaming for the initial boilerplate unless streaming can be
  implemented reliably.
- Apply a reasonable timeout.
- Validate response success and message content.

CHAT API VALIDATION

Create `/api/chat`.

Validate input using Zod:

- Require at least one message.
- Permit only `user` and `assistant` roles from the browser.
- Require the latest message to be a nonblank user message.
- Limit total message count.
- Limit each message to a sensible maximum such as 8,000 characters.
- Reject invalid JSON.
- Return HTTP 400 for invalid input.
- Return HTTP 401 when unauthenticated.
- Return HTTP 429 when rate limited.
- Return an appropriate 500-series response for provider errors.

Never trust roles, content, or message arrays received from the browser.

SETTINGS PAGE

Create protected `/settings`.

Display:

- Account display name
- Username/email
- Current effective provider: OpenAI, Ollama, or Echo
- Light, dark, and system theme control
- Explanation that model settings and secrets use server environment variables

Never display secret values.

DARK MODE

Use next-themes.

Support:

- Light
- Dark
- System

Requirements:

- Public navigation toggle
- Authenticated header toggle
- Settings theme selector
- Persist preference
- Avoid hydration mismatch or theme flash
- Ensure all text and controls remain legible in both themes

SECURITY

Implement:

- Password hashing
- Auth checks at page and API boundaries
- Zod validation
- Safe callback URL handling
- Generic authentication errors
- Server-only secrets
- Message and request size limits
- Basic in-memory development rate limiting for login and chat
- Safe security headers
- `.env*` ignored while preserving `.env.example`
- SQLite database files ignored
- No secrets or real credentials committed

Document that the in-memory limiter is insufficient for distributed production
and should be replaced by a shared store such as Redis.

ENVIRONMENT TEMPLATE

Create `.env.example` containing:

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

Use the exact variable names expected by the implementation.

DATABASE

Use Prisma with SQLite.

Create:

- Prisma schema
- User model
- Initial migration
- Idempotent local database initialization
- Idempotent seed

User fields should include:

- ID
- Unique email
- Display name
- Password hash
- Created timestamp
- Updated timestamp

Prefer standard Prisma migration commands. If the installed Prisma schema
engine fails for environmental reasons despite a valid schema, diagnose it
before adding a documented, idempotent Prisma-client bootstrap fallback.

TESTS

Add focused Vitest tests covering:

- Correct password verification succeeds
- Incorrect password verification fails
- Missing provider configuration selects echo
- Invalid provider selects echo
- Incomplete OpenAI configuration selects echo
- Complete OpenAI configuration selects OpenAI
- Incomplete Ollama configuration selects echo
- Complete Ollama configuration selects Ollama
- Echo returns the latest user message
- Empty chat request is rejected
- Blank latest user message is rejected
- Oversized chat message is rejected
- Valid chat request is accepted
- Unauthenticated chat API request returns HTTP 401

If practical, add a browser smoke test for:

- Public home page rendering
- Login with bootstrap credentials
- Disabled Google and Microsoft buttons
- Protected chat navigation
- Sending “Hello” in echo mode
- Receiving `Echo: Hello`
- Sidebar collapse and expansion
- Logo hidden while collapsed
- Settings navigation
- Theme toggle
- Composer auto-growth with multiline input

DOCUMENTATION

Create a README covering:

- Product overview
- Technology stack
- Prerequisites
- Installation
- Environment setup
- AUTH_SECRET generation
- Prisma generation and migration
- Database seed
- Development login
- Development command
- Echo behavior
- OpenAI setup
- Ollama setup
- OAuth status
- Commands
- Architecture
- Testing
- Security notes
- Production-hardening recommendations
- Conversation persistence limitation
- In-memory rate-limit limitation

Clearly state that the default `admin` password is development-only and must
be changed before sharing or deployment.

IMPLEMENTATION PROCESS

Before editing:

1. Inspect the directory.
2. Read applicable project instructions.
3. Check Git status.
4. Identify existing files that must be preserved.
5. Briefly state the proposed architecture.

Then implement the complete application.

Validation order:

1. Install dependencies.
2. Generate Prisma client.
3. Apply the database migration.
4. Run the seed twice to verify idempotency.
5. Run focused tests.
6. Run the full test suite.
7. Run TypeScript checking.
8. Run ESLint.
9. Run a production build.
10. Perform a minimal local smoke test.
11. Fix implementation-related failures and rerun failed validation.

Do not stop merely because the files were generated.

ACCEPTANCE CRITERIA

The task is complete only when:

- Home, login, chat, and settings pages render.
- AIAppStarter branding and approved logo are present.
- The approved favicon is generated.
- The specified color palette is applied consistently.
- Light and dark themes work and persist.
- Bootstrap credentials work after seeding.
- Passwords are stored as hashes.
- Google and Microsoft controls are visible and disabled.
- Unauthenticated users cannot access chat or settings.
- The chat endpoint rejects unauthenticated requests.
- Echo mode works without model configuration.
- OpenAI and Ollama can be selected using environment variables.
- The user menu contains Settings and Log out.
- Collapsing the desktop sidebar hides the entire sidebar and logo.
- Only the expand icon remains available after collapse.
- The composer has no top divider or textarea focus box.
- The textarea grows automatically and resets after sending.
- React effects return only cleanup functions or nothing.
- Secrets remain server-side.
- Tests pass.
- TypeScript passes.
- ESLint passes.
- Production build passes.

FINAL RESPONSE

Report:

- What was built
- Important files
- Authentication behavior
- Provider-routing behavior
- Branding and logo implementation
- Exact local startup commands
- Development credentials
- Validation results
- Remaining limitations
- Any external blocker that could not be resolved
