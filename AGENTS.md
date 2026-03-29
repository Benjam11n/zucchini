# AGENTS.md

## Workspace Overview

- Zucchini is a lightweight Bun workspace monorepo.
- `apps/desktop` contains the Electron desktop app.
- `apps/web` contains the public marketing and download site.
- Keep the two apps separate unless shared code is clearly justified.

## Stable Workflow Rules

- Run commands from the repository root with `bun`.
- Prefer the root wrapper scripts when they exist:
  `bun run dev:desktop`, `bun run dev:web`, `bun run build:desktop`,
  `bun run build:web`, `bun run check`.
- Never start a development server unless the user explicitly asks for it.
- Before finalizing code changes, run `bun run format`.
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
  `apps/desktop/src/renderer/shared/ui` and default theme tokens from
  `apps/desktop/src/renderer/globals.css` before introducing bespoke styling or
  arbitrary Tailwind values.

## App Guides

- See [apps/desktop/AGENTS.md](./apps/desktop/AGENTS.md) for desktop-specific
  rules.
- See [apps/web/AGENTS.md](./apps/web/AGENTS.md) for web-specific rules.
