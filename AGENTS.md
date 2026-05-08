# AGENTS.md

## Workspace Overview

- Zucchini is a lightweight pnpm workspace monorepo.
- `apps/desktop` contains the Electron desktop app.
- `apps/web` contains the public marketing and download site.
- Keep the two apps separate unless shared code is clearly justified.

## Communication Defaults

- Use the `caveman` skill by default for user-facing responses in this
  workspace.
- Default intensity is `ultra`.
- If the user explicitly asks for normal writing, formal writing, or more
  explanation, suspend `caveman` until the request is complete.
- Keep code, commit messages, PR text, and other durable project artifacts in
  normal style unless the user explicitly asks otherwise.

## Stable Workflow Rules

- Use Node 24.x for this repository so local behavior matches CI.
- Run commands from the repository root with `pnpm`.
- Prefer the root wrapper scripts when they exist:
  `pnpm run dev:desktop`, `pnpm run dev:web`, `pnpm run build:desktop`,
  `pnpm run build:web`, `pnpm run check`.
- Use Fallow from the repository root:
  `pnpm run fallow`, `pnpm run fallow:dead-code`,
  `pnpm run fallow:dupes`, `pnpm run fallow:health`, and
  `pnpm run fallow:audit`.
- `pnpm run check` includes lint, Fallow dead-code, Fallow dupes, desktop
  typecheck, desktop tests, and the web build. Treat all of those as required
  checks before finalizing meaningful changes.
- Treat Fallow output as codebase intelligence first. Do not auto-delete or
  auto-fix findings without checking ownership, dynamic loading, and build
  boundaries.
- Never start a development server unless the user explicitly asks for it.
- Before finalizing code changes, run `pnpm run format`.
- After meaningful changes, run the relevant validation commands for the app
  you touched.

## Monorepo Practices

- Keep app responsibilities clear:
  desktop product logic stays in `apps/desktop`;
  website code stays in `apps/web`.
- Do not couple the web app to Electron runtime assumptions.
- Do not extract shared packages early. Duplicate small pieces first and only
  extract when duplication becomes real maintenance cost.
- Prefer small, typed, direct changes over broad refactors.
- Avoid over-engineering. Add abstraction only when it removes clear repeated
  complexity.

## Code Quality Defaults

- Optimize for maintainability and readability first.
- Prefer straightforward control flow and explicit names.
- Keep modules narrow in scope and responsibility.
- Avoid barrel files and broad re-export layers.
- Make invalid states hard to represent with explicit types and boundary
  validation.
- Keep side effects at system edges and keep pure logic easy to test.
- For desktop renderer UI, prefer existing shadcn-based components in
  `apps/desktop/src/renderer/shared/components/ui` and default theme tokens
  from `apps/desktop/src/renderer/globals.css` before introducing bespoke
  styling or arbitrary Tailwind values.

## UI Defaults

- Prefer a clean, minimal, modern UI over decorative or overly expressive
  layouts.
- Use as few cards as possible. Do not wrap every section in a card by default.
- Reduce click count and interaction steps wherever practical.
- Favor obvious primary actions, inline controls, and simple flows over nested
  menus, extra confirmations, or multi-step wizards.
- Keep visual hierarchy sharp: fewer surfaces, more spacing discipline, and
  clear typography.
- Remove non-essential UI elements if they do not help the user complete the
  task faster.

## App Guides

- See [apps/desktop/AGENTS.md](./apps/desktop/AGENTS.md) for desktop-specific
  rules.
- See [apps/web/AGENTS.md](./apps/web/AGENTS.md) for web-specific rules.
