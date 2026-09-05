# Implement the Complete `/chat` Page

Update the `/chat` page while preserving the existing Next.js architecture, authentication, application layout, sidebar, responsive behavior, and light/dark themes.

Complete the following steps.

## Step 1: Configure supported LLM providers

Support an OpenAI-compatible provider and Ollama using server-side environment variables.

```env
# Initially selected provider: openai or ollama
LLM_PROVIDER=openai

# OpenAI-compatible provider
OPENAI_PROVIDER_NAME=vLLM
OPENAI_BASE_URL=
OPENAI_API_KEY=
OPENAI_MODEL=

# Ollama
OLLAMA_PROVIDER_NAME=Ollama
OLLAMA_BASE_URL=
OLLAMA_MODEL=
```

Requirements:

1. Keep provider URLs, API keys, and other sensitive configuration on the server.
2. Never expose API keys or base URLs to the browser.
3. Use `OPENAI_PROVIDER_NAME` and `OLLAMA_PROVIDER_NAME` as the provider dropdown labels.
4. Keep the implementation modular so additional providers can be added later.
5. Keep `.env.example` synchronized with all supported variables, but do not copy real secrets into it.

## Step 2: Check provider availability

Before adding a provider to the composer dropdown, verify that it is reachable.

### OpenAI-compatible provider

Check:

```text
GET {OPENAI_BASE_URL}/models
```

Include the configured Bearer token when `OPENAI_API_KEY` is provided.

Only add the OpenAI-compatible provider to the dropdown when:

- `OPENAI_BASE_URL` is configured.
- The `/models` endpoint responds successfully.
- A configured or discoverable model is available.

### Ollama

Check:

```text
GET {OLLAMA_BASE_URL}/api/tags
```

Only add Ollama to the dropdown when:

- `OLLAMA_BASE_URL` is configured.
- The `/api/tags` endpoint responds successfully.
- A configured or discoverable model is available.

### Availability behavior

1. Apply a reasonable timeout, such as five seconds, to availability checks.
2. Do not add unreachable providers to the dropdown.
3. If the provider selected by `LLM_PROVIDER` is unavailable, select another available provider.
4. If both providers are unavailable:
   - Display `No provider`.
   - Hide the model-name label.
   - Disable the Send button.
5. Recheck availability when the chat page is loaded or refreshed.

## Step 3: Set the default provider

Use `LLM_PROVIDER` to determine the initial dropdown selection.

Expected mapping:

```text
LLM_PROVIDER=openai  → vLLM
LLM_PROVIDER=ollama  → Ollama
```

Requirements:

1. Match the provider using its internal identifier, not its display label.
2. Display the corresponding `*_PROVIDER_NAME` value in the dropdown.
3. Do not default to the first option when the configured provider is available.
4. Prevent stale client state after `LLM_PROVIDER` changes.
5. Disable the provider dropdown while a response is being generated.

## Step 4: Support dynamic provider switching

Allow the user to select any available provider from the dropdown.

When the provider changes:

1. Update the model name displayed beside the dropdown.
2. Use the newly selected provider for subsequent requests.
3. Preserve the existing conversation.
4. Send only the provider identifier, such as `openai` or `ollama`, to the chat API.
5. Validate the identifier on the server.
6. Reject unsupported provider identifiers.
7. Resolve the selected provider’s URL, API key, and model on the server.

## Step 5: Discover and display the model name

Display the active model name after the provider dropdown.

### OpenAI-compatible provider

1. Use `OPENAI_MODEL` when it is configured.
2. If it is empty, discover the model using:

```text
GET {OPENAI_BASE_URL}/models
```

3. Display the actual model identifier returned by the API, such as:

```text
gpt-oss-20b
```

### Ollama

1. Use `OLLAMA_MODEL` when it is configured.
2. If it is empty, discover an available model using:

```text
GET {OLLAMA_BASE_URL}/api/tags
```

3. Display the actual Ollama model name.

Do not display generic labels such as:

```text
OpenAI default model
Ollama default model
```

Truncate long model names visually while exposing the complete value through a tooltip or accessible label.

## Step 6: Implement provider-specific chat requests

### OpenAI-compatible requests

Send chat requests to:

```text
{OPENAI_BASE_URL}/chat/completions
```

Requirements:

- Use `OPENAI_API_KEY` as a Bearer token when provided.
- Use the selected or discovered model.
- Request streaming responses.
- Normalize OpenAI-compatible SSE responses into a plain-text browser stream.

### Ollama requests

Send chat requests to:

```text
{OLLAMA_BASE_URL}/api/chat
```

Requirements:

- Use the selected or discovered model.
- Request streaming responses.
- Normalize Ollama NDJSON responses into a plain-text browser stream.

## Step 7: Handle provider errors

Display clear, user-friendly errors when:

- No provider is configured.
- A provider is unavailable.
- The base URL is invalid.
- Authentication is rejected.
- No model is configured or discoverable.
- The response stream is interrupted.
- The provider returns an empty response.

Do not expose API keys, internal URLs, stack traces, or raw provider errors.

## Step 8: Update the chat interface

Create a clean, ChatGPT-style interface containing:

- Scrollable conversation history
- Clearly differentiated user and assistant messages
- Automatic scrolling to the latest message
- Progressive assistant-response streaming
- Responsive desktop and mobile layouts
- Light- and dark-mode support
- A composer anchored near the bottom

Remove `AIAppStarter` from the chat header.

For an empty conversation, display a simple welcome state with optional example prompts.

## Step 9: Stream assistant responses

When the user submits a message:

1. Immediately add the user message to the conversation.
2. Add an empty assistant placeholder.
3. Display a loading state.
4. Stream assistant content progressively.
5. Scroll automatically as new content appears.
6. Restore focus to the composer when generation finishes.
7. Cancel the active request when the user starts a new chat or navigates away.

Use a friendly error if the stream is interrupted.

## Step 10: Update the message composer

Use this placeholder:

```text
How can I help?
```

Remove the composer shadow.

The composer should have two internal rows.

### Text-entry row

Include a multiline textarea that:

- Automatically grows based on its content.
- Has a sensible maximum height.
- Scrolls internally after reaching the maximum height.
- Submits with `Enter`.
- Inserts a newline with `Shift + Enter`.

### Composer footer

The footer should contain:

- A `+` button aligned left.
- Provider dropdown, model name, and Send button aligned right.

The right-side order must be:

```text
Provider dropdown → Model name → Send
```

## Step 11: Add the `+` popup menu

When the user clicks the `+` icon:

1. Open a popup above the button.
2. Show this placeholder menu item:

```text
Files and folders
```

3. Keep the item disabled or without an action.
4. Close the popup when:
   - The user clicks outside it.
   - The user presses Escape.

## Step 12: Add the provider dropdown

The dropdown should display only available providers.

With the example configuration, it can contain:

```text
vLLM
Ollama
```

Requirements:

- Use `OPENAI_PROVIDER_NAME` for the OpenAI-compatible option.
- Use `OLLAMA_PROVIDER_NAME` for the Ollama option.
- Select the option corresponding to `LLM_PROVIDER`.
- Update the adjacent model name when selection changes.
- Disable selection while a request is pending.
- Display `No provider` when no provider is available.

## Step 13: Position the Send button

Place the Send button immediately after the model name in the composer footer.

Requirements:

- Use an upward-arrow icon.
- Show a spinner while waiting for a response.
- Disable Send when:
  - The composer is empty.
  - A request is already pending.
  - No provider is available.
- Preserve keyboard submission behavior.

## Step 14: Update the disclaimer

Display this text below the composer:

```text
LLM can make mistakes. Check important information.
```

## Step 15: Add user-message actions

Each user message should provide:

- Copy
- Edit

### Copy

Copy the complete message to the clipboard and briefly show a success indicator.

### Edit

When editing a user message:

1. Replace it with an inline multiline editor.
2. Remove the editor border.
3. Automatically size the editor based on its content.
4. Apply a maximum height and internal scrolling for long messages.
5. Expand the editor leftward across the available history width.
6. Keep the user avatar visible in a dedicated right-side column.
7. Do not overlay or hide the avatar.
8. Provide Cancel and Resend buttons.
9. `Escape` cancels editing.
10. `Ctrl/Command + Enter` resends the edited message.
11. Resend removes subsequent messages and generates a new assistant response.

## Step 16: Add assistant-response actions

Each assistant response should provide:

- Edit
- Copy
- Download

Keep these actions unobtrusive and accessible on hover, keyboard focus, and mobile devices.

## Step 17: Implement assistant-response editing

When editing an assistant response:

1. Display an inline editor similar to ChatGPT.
2. Remove the editor border.
3. Automatically size it based on its content.
4. Apply a maximum height and internal scrolling.
5. Provide Visual and Markdown modes.
6. Preserve the draft when switching modes.
7. Provide Cancel and Save buttons.
8. Disable Save when the response is empty.
9. `Escape` cancels editing.
10. `Ctrl/Command + Enter` saves the edited response.

### Visual mode

Allow direct editing of rendered Markdown, including:

- Headings
- Paragraphs
- Bold and italic text
- Lists
- Links
- Inline code
- Code blocks
- Tables

Convert visual changes back to GitHub-flavored Markdown and prevent links from navigating during editing.

### Markdown mode

Display raw Markdown in an auto-growing monospaced textarea.

## Step 18: Implement response downloads

Allow assistant responses to be downloaded as:

- Markdown (`.md`)
- PDF (`.pdf`)
- Microsoft Word (`.docx`)

Preserve:

- Headings
- Paragraphs
- Bold and italic text
- Lists
- Links
- Inline and fenced code
- Blockquotes
- Tables

Markdown tables must become real PDF and Word tables with:

- Header rows
- Borders
- Cell padding
- Sensible column widths
- No clipped or overlapping text
- All rows and columns preserved

## Step 19: Persist chat history

Store user-scoped chats in the database.

Each chat should contain:

- Chat ID
- Authenticated owner
- Title
- Created timestamp
- Updated timestamp
- Ordered messages

Requirements:

1. Save new conversations.
2. Update conversations after subsequent responses.
3. Persist edited assistant responses.
4. Persist user-message resends.
5. Generate the initial title from the first user message.
6. Open saved chats at:

```text
/chat/[chatId]
```

7. Restore the complete message history when loading a saved chat.
8. Clear active state when starting a new chat.

## Step 20: Group sidebar history

Group saved chats by their updated timestamp:

```text
Current
Yesterday
Previous 30 days
```

Requirements:

- Sort chats from newest to oldest.
- Highlight the active chat.
- Make the history area scrollable.
- Support desktop and mobile layouts.
- Exclude chats older than the previous 30-day period unless another category is added.

## Step 21: Add per-chat history menus

Add a three-dot action button to each history item.

Open the menu through:

- Normal click
- Right-click on the three-dot icon

The menu should contain:

- Rename
- Delete

### Rename

- Require a non-empty title.
- Trim surrounding whitespace.
- Enforce a reasonable maximum length.
- Persist the new title.
- Update the sidebar immediately.

### Delete

- Ask for confirmation.
- Delete the chat and its messages.
- Ensure only the authenticated owner can delete it.
- Remove it from the sidebar.
- Redirect to `/chat` if the active chat is deleted.

## Step 22: Add Previous 30 Days bulk deletion

Add a three-dot action button to the `Previous 30 days` heading.

Its menu should contain:

```text
Delete all
```

When selected:

1. Ask for confirmation.
2. Delete every chat in that category.
3. Do not delete Current or Yesterday chats.
4. Restrict deletion to the authenticated owner.
5. Refresh the sidebar immediately.
6. Redirect to `/chat` if the active chat was deleted.

## Step 23: Secure the APIs

All chat and history routes must:

- Require authentication.
- Scope data to the authenticated user.
- Validate request bodies.
- Validate provider identifiers.
- Prevent cross-user reads, updates, and deletions.
- Apply rate limiting to chat generation.
- Return appropriate HTTP status codes.
- Avoid exposing sensitive configuration.

## Step 24: Validate the implementation

Add or update tests for:

- Provider selection
- Provider display-name mapping
- Default selection from `LLM_PROVIDER`
- Dynamic provider switching
- Provider availability filtering
- One-provider-unavailable behavior
- Both-providers-unavailable behavior
- Invalid provider rejection
- OpenAI-compatible model discovery
- Ollama model discovery
- Streaming normalization
- Chat-history grouping
- Chat title generation
- Markdown visual editing
- PDF and DOCX exports
- Markdown table exports

Run:

```bash
npm run db:generate
npm run db:migrate
npm run typecheck
npm run lint
npm test
npx next build --webpack
```

The implementation is complete when all checks pass and `/chat` works correctly on desktop and mobile in both light and dark modes.
