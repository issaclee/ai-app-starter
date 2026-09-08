# Prompt: Build the Agentic ERP Landing and Workspace Entry Experience

Use this prompt as a step-by-step implementation brief for the current repository. Follow `AGENTS.md`, inspect the existing application before editing, and preserve unrelated working-tree changes. Implement the feature within the current Next.js architecture instead of creating a parallel site or replacing the authenticated workspace.

## Goal

Transform the public home page into a polished Agentic ERP landing experience and align the empty chat workspace with the same product story.

The core message is:

> Get started with Agentic ERP. Your team, your agents, your data, and your knowledge—working together. Intelligence built into every workflow and interaction helps your business operate at its best.

Keep the original logo artwork, change the shared logo wordmark to `Agentic ERP`, retain the original bright light-mode character, and provide the approved deep-ink treatment in dark mode.

Work through the following steps in order.

## 1. Inspect the current application and framework guidance

1. Read `AGENTS.md`, `package.json`, `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `src/components/brand-logo.tsx`, `src/components/theme-toggle.tsx`, `src/components/chat-interface.tsx`, and the workspace chat route.
2. Read the relevant Next.js 16 documentation under `node_modules/next/dist/docs/` before modifying App Router pages, metadata, links, fonts, or server/client boundaries.
3. Inspect the current Git diff before editing. Preserve all unrelated and user-authored changes, especially authentication and session-management work.
4. Reuse the existing package manager, dependencies, Lucide icons, theme provider, theme tokens, and shared components. Do not add a UI kit or image dependency.

## 2. Preserve the application flow

1. Keep `/` as a server-rendered page that reads the active session through the established `getActiveSession` helper.
2. Derive one session-aware workspace destination:
   - Authenticated users go to `/chat`.
   - Unauthenticated users go to `/login`.
3. Use that destination for the hero and closing calls to action.
4. Do not change login, chat persistence, provider selection, workspace navigation, authorization, or API behavior as part of this feature.

## 3. Update the shared brand

1. Continue using `/aiappstarter-mark.svg` as the logo artwork. Do not redraw or replace the original mark.
2. Update the shared `BrandLogo` wordmark from `AIAppStarter` to `Agentic ERP`.
3. Update the screen-reader label and landing-page home-link label to `Agentic ERP`.
4. Keep `showWordmark`, `size`, and `className` behavior intact so the shared logo remains compatible with every existing placement.
5. Update root metadata so the default title, title template, and description describe Agentic ERP.

## 4. Build the landing-page header

1. Use the shared `BrandLogo` at the left.
2. Add concise in-page links for Platform, How it works, and Trust on desktop.
3. Keep the existing theme toggle at the right.
4. Do not add a Sign in, Log in, Open workspace, or other workspace button to the top navigation. The primary actions belong in the hero and closing callout.
5. Ensure the header works in both themes and remains compact on mobile.

## 5. Build the Agentic ERP hero

1. Lead with the eyebrow `Intelligence, built into the work`.
2. Use the headline `Get started with Agentic ERP.`
3. Use this supporting message, with punctuation corrected for readability:

   `Your team, your agents, your data, and your knowledge—working together. Intelligence built into every workflow and interaction helps your business operate at its best.`

4. Add a session-aware primary call to action:
   - `Enter your workspace` for an authenticated user.
   - `Get started` for an unauthenticated user.
5. Add a secondary `Explore the platform` anchor linking to the platform section.
6. Show the concise trust points `Human-led`, `Connected by design`, and `Secure by default`.
7. Keep the hero immediately recognizable in the first viewport without adding a marketing carousel, form, or unrequested route.

## 6. Create the workflow visualization

Build a code-native, non-interactive operations panel beside the hero copy. It should demonstrate how Agentic ERP connects business work without pretending to be a functional dashboard.

Include:

- `Operations intelligence` as the panel title.
- A live `Rebalance supply plan` workflow.
- Demand data, a planning agent, and the operations team as coordinated steps.
- A clear approval/review state.
- A small completion signal showing time saved.

Use semantic markup, CSS, existing tokens, and Lucide icons. Do not add decorative bitmap imagery or hand-drawn representational SVG artwork.

## 7. Explain the connected operating layer

Add a Platform section that presents four concise pillars:

1. Your team — people remain in control.
2. Your agents — routine work moves forward with coordination.
3. Your data — decisions use current business context.
4. Your knowledge — policies and institutional experience become reusable guidance.

Use focused cards with concrete business language. Avoid generic AI claims, invented customer metrics, testimonials, pricing, or integrations that the product does not provide.

## 8. Explain the operating loop

Add a How it works section with three stages:

1. `Sense` — understand the request, context, and business state.
2. `Coordinate` — bring the right people, agents, and systems together.
3. `Act` — move work forward with controls and an audit trail.

Keep the section compact and readable rather than turning it into a second dashboard.

## 9. Add the trust callout and footer

1. Add a Trust callout focused on governed data, accountable people, and visible agent actions.
2. Include one session-aware `Start now` call to action in that callout.
3. In the footer, show `© Copyright <current year> MPTWork` on the left. Compute the current year during render rather than hard-coding it.
4. Show `People and intelligent agents, operating as one.` on the right.
5. Do not repeat an `Agentic ERP` wordmark or product-name label in the footer.
6. Stack the footer text cleanly on narrow screens and place it left/right on wider screens.

## 10. Support the approved light and dark themes

1. Preserve the original bright, white visual character in light mode:
   - White or token-based backgrounds.
   - Dark foreground text.
   - Existing purple brand accents.
   - Light borders and restrained shadows.
2. Preserve the approved deep-ink hero, header, workflow console, violet glow, and high-contrast type in dark mode.
3. Use `.dark` variants or theme-aware custom properties so the same markup supports both modes.
4. Keep shared application theme tokens stable unless a token change is explicitly intended for every workspace screen.
5. Maintain visible focus states, readable contrast, reduced-motion behavior, and usable text at narrow widths.

## 11. Align the empty chat workspace

In the empty state of `ChatInterface`, replace generic model-oriented copy with Agentic ERP language:

- Heading: `How can your business move forward?`
- Supporting line: `Plan, analyze, and coordinate work across your people, agents, data, and knowledge.`
- Starter prompts:
  1. `Plan an inventory replenishment workflow`
  2. `Draft a month-end close checklist`
  3. `Design an agent for customer order exceptions`

Keep the existing prompt-button behavior: selecting a starter fills and focuses the composer. Do not automatically submit it.

## 12. Verify the complete feature

Check that:

- The original logo mark remains unchanged and the wordmark reads Agentic ERP everywhere the shared component appears.
- The top navigation contains no sign-in or workspace button.
- Hero and closing actions route correctly for authenticated and unauthenticated users.
- In-page navigation reaches Platform, How it works, and Trust.
- The light theme retains the original bright presentation.
- The dark theme retains the approved deep-ink presentation.
- The landing page is readable and well arranged on mobile and desktop.
- The footer contains the dynamic copyright on the left, the operating tagline on the right, and no repeated Agentic ERP label.
- The empty chat heading, tagline, and all three starter prompts match the required copy.
- Prompt buttons still populate and focus the chat composer.
- Metadata describes Agentic ERP.
- No authentication, API, persistence, or chat-history behavior regressed.

Run checks proportional to the change:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

If the default development build fails only because the host blocks a required Turbopack process or port, confirm that cause and run the supported webpack build as an additional diagnostic. Fix genuine application errors and rerun the affected checks. Finish with a concise summary of the changed files and verification results. Do not deploy or commit unless explicitly requested.
