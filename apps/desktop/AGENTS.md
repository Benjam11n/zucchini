# AGENTS.md

## Desktop App Overview

- `apps/desktop` is the Electron application.
- Main process code lives in `src/main`.
- The preload boundary lives in `src/preload`.
- Shared domain and contracts live in `src/shared`.
- Renderer UI lives in `src/renderer`.

## Desktop Workflow Rules

- Run desktop commands from the repository root with:
  `pnpm --dir apps/desktop ...`
- Common validations:
  `pnpm run lint`
  `pnpm run test:desktop`
  `pnpm run fallow:dead-code`
  `pnpm run build:desktop`
- Run `pnpm run format` from the workspace root before finalizing changes.

## Desktop Best Practices

- Keep business logic in `src/main` or `src/shared`.
- Keep renderer code focused on presentation, interaction flow, and local UI
  state.
- Classify new state as `canonical`, `cache`, or `ephemeral` before adding
  persistence.
- Store canonical state in SQLite through the main process and preload/IPC
  boundaries.
- Document renderer-persisted cache state as non-authoritative and keep it
  feature-local.
- Treat preload as the only renderer boundary to privileged APIs.
- Do not import Electron directly into renderer code.
- Preserve existing layer boundaries and avoid moving logic into convenience
  utilities without a strong reason.
- Prefer explicit domain types over duplicated object shapes.
- Favor small modules over large mixed-responsibility files.
- Use existing patterns before introducing new abstractions.
- Do not over-engineer. A simple function is better than a reusable framework
  unless repetition is already a problem.

## Ports And Adapters

- Use small local ports for side-effect boundaries only: Electron APIs,
  timers, clocks, SQLite/filesystem/dialog/shell, native addons, preload IPC,
  and browser storage.
- Name side-effect interfaces with a `Port` suffix, for example
  `DataManagementRepositoryPort`, `ReminderTimerPort`, or
  `AppTrayShellPort`.
- Keep feature-owned ports beside the feature in `ports.ts`; keep production
  implementations beside them in `adapters.ts`.
- Use `adapters.ts` for concrete Electron/Node/browser implementations, named
  by technology or runtime such as `electronAppTrayShell`.
- Do not add ports for pure domain functions, React presentational components,
  formatting helpers, validation helpers, or one-call wrappers with no
  meaningful behavior.
- Prefer one deep module or coordinator per capability over many shallow public
  helpers. Callers should see a small API while side-effect wiring stays hidden.

## Electron-Specific Rules

- Preserve the current security posture:
  `contextIsolation`, strict navigation rules, and narrow IPC contracts.
- Validate IPC inputs and outputs at the main-process boundary.
- Keep filesystem, updater, notifications, tray, and OS integration in the
  main process.
- Dispose of long-lived resources explicitly.
- Avoid remote code, new external origins, or unnecessary renderer privileges.

## Testing Expectations

- Keep tests deterministic and targeted.
- Add or update tests when behavior changes materially.
- Prefer focused Vitest coverage over large end-to-end style test additions.
- Do not leave `.only` or `.skip` in committed tests.
