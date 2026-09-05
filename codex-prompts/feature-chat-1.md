# Implement the Updated `/chat` Page

Update the `/chat` page using the application’s existing Next.js architecture, authentication, sidebar, visual design, light/dark themes, and server-side security model.

Complete the work in the following steps.

## Step 1: Configure the LLM providers

Support both an OpenAI-compatible provider and Ollama.

Use these environment variables:

```env
# Initial provider: openai or ollama
LLM_PROVIDER=ollama

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

1. Use `LLM_PROVIDER` to determine the initially selected provider.
2. When `LLM_PROVIDER=openai`, initially select the provider labeled by `OPENAI_PROVIDER_NAME`.
3. When `LLM_PROVIDER=ollama`, initially select the provider labeled by `OLLAMA_PROVIDER_NAME`.
4. List every provider that has a configured base URL in the provider dropdown.
5. Allow users to switch providers dynamically before submitting a message.
6. Include the selected provider identifier in each chat request.
7. Validate provider identifiers on the server. Only allow `openai` and `ollama`.
8. Resolve URLs, API keys, and model settings exclusively on the server.
9. Never expose API keys or provider URLs to the browser.
10. Keep the provider implementation modular so additional providers can be added later.

## Step 2: Integrate the OpenAI-compatible provider

When the selected provider is `openai`:

1. Send chat requests to:

```text
{OPENAI_BASE_URL}/chat/completions
```

2. Use `OPENAI_API_KEY` as a Bearer token when it is provided.
3. Use `OPENAI_MODEL` when it contains a value.
4. If `OPENAI_MODEL` is empty, request the available models from:

```text
{OPENAI_BASE_URL}/models
```

5. Select an available model returned by the provider.
6. Display the actual model identifier returned by the API, such as:

```text
gpt-oss-20b
```

7. Stream the assistant response when the provider supports streaming.

## Step 3: Integrate Ollama

When the selected provider is `ollama`:

1. Send chat requests to:

```text
{OLLAMA_BASE_URL}/api/chat
```

2. Use `OLLAMA_MODEL` when it contains a value.
3. If `OLLAMA_MODEL` is empty, request the available models from:

```text
{OLLAMA_BASE_URL}/api/tags
```

4. Select an available model returned by Ollama.
5. Display the actual Ollama model name.
6. Stream the assistant response progressively.

## Step 4: Handle provider errors

Display clear, user-friendly errors when:

- A provider is not configured.
- The base URL is invalid.
- The provider is unavailable.
- Authentication is rejected.
- No model is configured or discoverable.
- The response stream is interrupted.
- The provider returns an empty response.

Do not expose raw provider errors, URLs, API keys, or other sensitive server configuration.

## Step 5: Update the chat-page layout

Create a clean, responsive interface similar to ChatGPT.

The page should include:

- A scrollable conversation history.
- Clearly differentiated user and assistant messages.
- Automatic scrolling to the latest message.
- A composer anchored near the bottom.
- Responsive desktop and mobile layouts.
- Full light- and dark-mode support.

Remove `AIAppStarter` from the chat header.

For an empty conversation, retain a simple welcome state and example prompts.

## Step 6: Update the message composer

Use this placeholder:

```text
How can I help?
```

Remove the composer shadow.

The composer should contain two internal rows.

### Text-entry row

The first row should contain:

- A multiline textarea.
- Automatic textarea height based on content.
- A sensible maximum height.
- Internal scrolling after reaching the maximum height.

Keyboard behavior:

- `Enter` submits the message.
- `Shift + Enter` inserts a new line.
- Do not submit empty messages.
- Disable submission while a response is pending.

### Composer footer

The footer should contain:

- A `+` action button aligned left.
- Provider dropdown, model name, and Send button aligned right.

The controls on the right must appear in this order:

```text
Provider dropdown → Model name → Send button
```

## Step 7: Add the `+` menu

When the user selects the `+` icon:

1. Open a popup menu above the icon.
2. Initially show one menu item:

```text
Files and folders
```

3. Keep this item disabled or without an action as a placeholder for future functionality.
4. Close the popup when:
   - The user clicks outside it.
   - The user presses Escape.

## Step 8: Add the provider dropdown

Place the provider dropdown in the composer footer before the model name.

The dropdown labels must use:

```text
OPENAI_PROVIDER_NAME
OLLAMA_PROVIDER_NAME
```

With the example configuration, the options should be:

```text
vLLM
Ollama
```

Default-selection behavior:

- `LLM_PROVIDER=openai` selects `vLLM`.
- `LLM_PROVIDER=ollama` selects `Ollama`.
- Changing `LLM_PROVIDER` and refreshing the application must not preserve a stale client-side selection.
- Disable the dropdown while a request is being processed.

When the selected provider changes:

1. Update the model name shown beside the dropdown.
2. Route subsequent chat requests through the selected provider.
3. Preserve the current conversation.

## Step 9: Show the actual model name

Display the active model name immediately after the provider dropdown.

Requirements:

1. Prefer the configured `OPENAI_MODEL` or `OLLAMA_MODEL`.
2. If the configured model is empty, use the provider’s model-list API.
3. Display the actual returned model identifier.
4. Do not display generic text such as:

```text
OpenAI default model
Ollama default model
```

5. If model discovery fails, display:

```text
Model unavailable
```

6. Truncate very long model names visually while making the complete name available through a tooltip or accessible label.

## Step 10: Position the Send button

Move the Send button into the composer footer.

Place it immediately after the model name:

```text
Provider → Model → Send
```

Requirements:

- Use an upward-arrow Send icon.
- Show a loading spinner while waiting for the provider.
- Disable it when the input is empty.
- Disable it while a response is pending.
- Preserve keyboard submission behavior.

## Step 11: Update the disclaimer

Show this text below the composer:

```text
LLM can make mistakes. Check important information.
```

## Step 12: Stream assistant responses

When a message is submitted:

1. Add the user message immediately.
2. Add an assistant placeholder.
3. Show an appropriate loading state.
4. Stream text progressively into the assistant message.
5. Keep the conversation scrolled to the latest content.
6. Restore input focus after the response completes.
7. Allow the active request to be cancelled if the user starts a new chat or navigates away.

## Step 13: Add user-message actions

Each user message should provide unobtrusive actions for:

- Copy
- Edit

### Copy

Copy the complete message text to the clipboard and briefly indicate success.

### Edit

When editing a user message:

1. Replace the message with an inline multiline editor.
2. Remove the editor border.
3. Make the editor auto-height.
4. Apply a maximum height and internal scrolling for long content.
5. Extend the editor leftward across the available conversation-history width.
6. Keep the user avatar visible in a dedicated right-side column.
7. Do not overlay, cover, or hide the user avatar.
8. Provide Cancel and Resend buttons.
9. `Escape` cancels editing.
10. `Ctrl/Command + Enter` resends the edited message.
11. Cancel restores the original content.
12. Resend replaces the edited message, removes subsequent messages, and generates a new assistant response.

## Step 14: Add assistant-response actions

Each assistant response should provide:

- Edit
- Copy
- Download

Keep the actions visually unobtrusive and reveal them appropriately on hover, focus, and mobile devices.

## Step 15: Implement assistant-response editing

Make the response editor similar to ChatGPT.

When Edit is selected:

1. Replace the response with an inline editor.
2. Remove the editor border.
3. Automatically size the editor based on its content.
4. Apply a maximum height and internal scrolling for long responses.
5. Provide Visual and Markdown editing modes.
6. Preserve the current draft when switching modes.
7. Provide Cancel and Save buttons.
8. Disable Save when the edited content is empty.
9. `Escape` cancels editing.
10. `Ctrl/Command + Enter` saves the response locally.

### Visual mode

Visual mode should:

- Render Markdown while remaining directly editable.
- Support headings, paragraphs, bold, italic, lists, links, code, and tables.
- Convert visual changes back into GitHub-flavored Markdown.
- Prevent links from navigating while the response is being edited.
- Preserve the caret position while typing.

### Markdown mode

Markdown mode should:

- Display the raw Markdown source.
- Use a monospaced multiline textarea.
- Automatically adjust height based on content.
- Preserve changes when switching back to Visual mode.

## Step 16: Implement response downloads

Allow assistant responses to be downloaded as:

- Markdown (`.md`)
- PDF (`.pdf`)
- Microsoft Word (`.docx`)

Preserve Markdown formatting as closely as practical, including:

- Headings
- Paragraphs
- Bold and italic text
- Ordered and unordered lists
- Links
- Inline code
- Fenced code blocks
- Blockquotes
- Tables

### Table-export requirements

Markdown tables must render as actual document tables in PDF and DOCX files.

Ensure that:

- Pipe-delimited Markdown is not exported as raw text.
- Header rows are preserved.
- Every row and column is preserved.
- Cells have readable padding and borders.
- Column widths are sensible.
- Text does not overlap or become clipped.
- Exported files open correctly in common PDF and Word viewers.

## Step 17: Persist chat history

Store chat conversations in the database.

Each chat should include:

- Unique chat ID
- Authenticated owner
- Title
- Creation timestamp
- Last-updated timestamp
- Ordered user and assistant messages

Requirements:

1. Scope all history operations to the authenticated user.
2. Save a new conversation after its first response.
3. Update the saved conversation after subsequent responses.
4. Persist edited assistant responses.
5. Persist user-message resends and the regenerated conversation.
6. Generate the initial title from the first user message.
7. Provide a dedicated URL for saved chats:

```text
/chat/[chatId]
```

8. Loading a saved-chat URL should restore its complete message history.
9. Starting a new chat should clear the active conversation state.

## Step 18: Group chat history in the sidebar

Group saved chats into:

```text
Current
Yesterday
Previous 30 days
```

Use the chat’s last-updated time for grouping.

Requirements:

- Current contains chats updated today.
- Yesterday contains chats updated during the previous calendar day.
- Previous 30 days contains chats within the preceding 30-day period, excluding Current and Yesterday.
- Sort chats by most recently updated.
- Highlight the active chat.
- Make the sidebar independently scrollable.
- Support desktop and mobile layouts.

## Step 19: Add per-chat history actions

Add a three-dot action icon to every history item.

The menu must open through:

- Normal click
- Right-click on the three-dot icon

Each chat menu should contain:

- Rename
- Delete

### Rename

- Let the user enter a new title.
- Trim surrounding whitespace.
- Require a non-empty title.
- Apply a reasonable maximum length.
- Persist the title to the database.
- Update the sidebar immediately.

### Delete

- Ask for confirmation.
- Delete the chat and all associated messages.
- Restrict deletion to the authenticated owner.
- Remove the item from the sidebar.
- If the active chat is deleted, redirect to `/chat`.

## Step 20: Add Previous 30 Days bulk deletion

Add a three-dot action icon to the `Previous 30 days` heading.

Support both click and right-click.

The menu should contain:

```text
Delete all
```

When selected:

1. Ask the user for confirmation.
2. Delete every chat displayed in the Previous 30 Days category.
3. Restrict deletion to the authenticated user.
4. Do not delete Current or Yesterday chats.
5. Update the sidebar immediately.
6. Redirect to `/chat` if the currently open chat was deleted.

## Step 21: Protect the chat APIs

All chat and history routes must:

- Require authentication.
- Use the authenticated email or user identifier for ownership.
- Prevent users from reading another user’s chats.
- Prevent users from renaming or deleting another user’s chats.
- Validate request bodies.
- Validate provider identifiers.
- Return appropriate `400`, `401`, `404`, `429`, and `502` responses.
- Avoid returning secrets or raw internal errors.

## Step 22: Update the example environment file

Keep `.env.example` synchronized with the supported configuration:

```env
# Initial provider: openai or ollama
LLM_PROVIDER=ollama

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

Do not copy actual API keys, authentication secrets, or OAuth credentials into `.env.example`.

## Step 23: Validate the implementation

Add or update tests for:

- Provider configuration selection
- Provider display-name mapping
- Default provider selection from `LLM_PROVIDER`
- Dynamic provider switching
- Rejection of invalid provider identifiers
- OpenAI-compatible model discovery
- Ollama model discovery
- Streaming response normalization
- Chat-history validation
- Chat title generation
- Current, Yesterday, and Previous 30 Days grouping
- Markdown-to-visual-editor conversion
- Markdown, PDF, and DOCX exports
- Markdown table exports

Run:

```bash
npm run db:generate
rekt
npm run db:migrate
npm run typecheck
npm run lint
npm test
npx next build --webpack
```

The work is complete when all checks pass and `/chat` works correctly on desktop and mobile in both light and dark themes.
