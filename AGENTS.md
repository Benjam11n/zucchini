# AGENTS.md

## Scope

- Zucchini is a local-first habit tracker built as an Electron desktop app.
- Zucchini is a pnpm monorepo.
- `apps/desktop` = Electron app. See `apps/desktop/AGENTS.md`.
- `apps/web` = marketing/download site. See `apps/web/AGENTS.md`.
- Keep apps separate. Do not share code unless duplication becomes real maintenance cost.

## Communication

- Use `caveman` skill for user-facing replies. Default intensity: `ultra`.
- Suspend caveman when user asks for normal/formal/more detailed writing.
- Keep code, commits, PR text, docs, and durable artifacts normal.

## Workflow

- Use Node from `.nvmrc`: `source "$HOME/.nvm/nvm.sh" && nvm use` when available.
- Run commands from repo root with `pnpm`.
- Prefer root scripts: `dev:desktop`, `dev:web`, `build:desktop`, `build:web`, `check`.
- Do not start dev servers unless user explicitly asks.
- Before finalizing code changes: `pnpm run format`.
- After meaningful changes: run relevant validation; for broad changes run `pnpm run check`.

## Checks

- `pnpm run check` = lint, Fallow dead-code, Fallow dupes, desktop typecheck, desktop tests, web build.
- Treat Fallow as intelligence. Do not delete/fix findings without checking ownership, dynamic loading, and app boundaries.

## Code Defaults

- Root package is ESM: use `.mjs` or native ESM for root scripts/config.
- Prefer small, typed, direct changes over broad refactors.
- Avoid barrel files and broad re-export layers.
- Keep invalid states hard to represent with explicit types and boundary validation.
- Keep side effects at system edges; keep pure logic easy to test.
- Do not keep shims or backward-compatibility code only for backward compatibility.
- Prefer semantic markup and accessible labels over lint suppression.

## UI Defaults

- Clean, minimal, modern UI.
- Few cards; no card-wrapping every section.
- Fewer clicks, obvious primary actions, inline controls.
- Use existing desktop shadcn UI and theme tokens before bespoke styling.
