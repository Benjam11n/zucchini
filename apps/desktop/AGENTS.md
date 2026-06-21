# AGENTS.md

## Scope

- `apps/desktop` is the Electron app.
- Main: `src/main`; preload: `src/preload`; shared contracts/domain: `src/shared`; renderer: `src/renderer`.
- Treat preload as the only renderer boundary to privileged APIs. Never import Electron in renderer.

## Workflow

- Run from repo root.
- Desktop commands: `pnpm --dir apps/desktop ...`.
- Validate meaningful desktop changes with relevant checks:
  `pnpm run lint`, `pnpm run typecheck:desktop`, `pnpm run test:desktop`, `pnpm run build:desktop`.
- For broad changes, prefer `pnpm run check`.
- Run `pnpm run format` before finalizing.

## Architecture

- Keep business logic in `src/main` or `src/shared`.
- Keep renderer focused on presentation, interaction flow, and local UI state.
- Preserve one-way renderer deps: a feature may import itself, `src/renderer/shared`, and `src/shared`; cross-feature imports need review.
- Share only neutral reusable UI/helpers through `src/renderer/shared`; do not move feature workflow/state/copy/side effects there.
- Use explicit domain types over duplicated object shapes.
- Keep modules small. Avoid convenience utilities that blur boundaries.

## Renderer Patterns

- Page props should be `{ viewModel, actions }`.
- Group actions by user intent, e.g. `actions.habits.createHabit`.
- Move nontrivial derived data, formatters, validators, mappers, and adapters out of `.tsx` into feature `lib`.
- Keep component prop interfaces beside component. Use `*.types.ts` only for shared contracts/view models/domain aliases.
- Prefer direct imports from component files. Do not add one-line component barrel files; use `index.tsx` only for grouped public APIs with multiple exports or a deliberate stable boundary.
- Use feature controller hooks for repeated local interaction orchestration.
- Keep only ephemeral UI state directly in components.

## State And Side Effects

- Classify new state as `canonical`, `cache`, or `ephemeral` before persistence.
- Store canonical state in SQLite through main process and preload/IPC.
- Renderer-persisted cache state must be non-authoritative and feature-local.
- Use `Port` interfaces only for side-effect boundaries: Electron APIs, timers, clocks, SQLite/filesystem/dialog/shell, native addons, preload IPC, browser storage.
- Keep feature-owned ports in `ports.ts`; production implementations in `adapters.ts`.
- Do not add ports for pure functions, presentational components, formatting, validation, or one-call wrappers.

## Electron Security

- Preserve `contextIsolation`, strict navigation rules, and narrow IPC contracts.
- Validate IPC inputs and outputs at main-process boundary.
- Keep filesystem, updater, notifications, tray, and OS integration in main process.
- Dispose long-lived resources explicitly.
- Avoid remote code, new external origins, and unnecessary renderer privileges.

## Tests

- Keep tests deterministic and targeted.
- Add/update tests when behavior materially changes.
- Prefer focused Vitest tests over broad E2E-style tests.
- Do not leave `.only` or `.skip`.
