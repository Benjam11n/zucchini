# AGENTS.md

## Project Overview

- Zucchini is a local-first desktop habit tracker built with Electron,
  React, and TypeScript.
- Core product areas include today tracking, streaks, reminders, focus
  sessions, history, weekly review, settings, tray behavior, and app updates.
- User data is stored locally in SQLite; the app is designed to work without a
  cloud backend.

## Stable Workflow Rules

- Use `bun` from the repository root for project commands.
- Never start the development server unless the user explicitly asks for it.
- Prefer small, typed changes that preserve existing layer boundaries.
- Run `bun run format` before finalizing code changes.
- After meaningful changes, run the relevant validation commands, typically
  `bun run lint`, `bun run test`, and `bun run knip`.

## Architecture

- `src/main`: Electron main process, app lifecycle, native integrations, IPC
  handlers, reminders, persistence, updater, tray, and window management.
- `src/preload`: typed preload bridge that exposes a narrow renderer API via
  `contextBridge`.
- `src/shared`: shared domain models, contracts, utilities, and security logic
  used across main and renderer.
- `src/renderer`: React UI, feature screens, controller/state orchestration,
  and shared presentation components.

## Tech Stack

- Electron for the desktop shell and native capabilities.
- React 19 for the renderer UI.
- Zustand for client-side renderer state.
- SQLite via `better-sqlite3`, with Drizzle ORM and migrations in main-process
  infrastructure.
- Vite and `tsdown` for builds, with Tailwind CSS v4 for styling.
- Vitest and Testing Library for automated tests.

## Codebase Practices

- Keep business rules in `src/shared` or `src/main`; keep renderer code focused
  on UI, interaction flow, and local view state.
- Treat the preload layer as the only renderer boundary to privileged Electron
  APIs; do not import Electron directly into renderer code.
- Prefer explicit shared domain and contract types over duplicating shapes in
  feature code.
- Follow the existing path alias convention using `@/` for `src`.
- Do not introduce barrel files or re-export index layers; import from the
  owning module directly.
- Use Effect where the existing main-process code already relies on it for
  side-effect and error handling clarity.
- Favor small modules with clear responsibilities over broad utility files or
  feature files that mix domain rules, persistence, and UI concerns.
- Make invalid states hard to represent by validating external inputs at the
  boundary and keeping internal types explicit.
- Prefer straightforward control flow and well-named functions over clever
  abstractions; optimize for readability and maintainability first.
- Keep side effects at the edges of the system and keep pure transformation
  logic easy to test in isolation.

## Electron Practices

- Keep `contextIsolation`-style boundaries intact by exposing only narrow,
  typed preload APIs to the renderer.
- Validate IPC inputs and outputs at the main-process boundary before they
  reach application services or persistence code.
- Preserve the existing browser-window security posture: deny unexpected window
  creation, block untrusted navigation, and keep the renderer sandboxed from
  direct Node or Electron access.
- Maintain a strict Content Security Policy and avoid introducing remote code,
  new external origins, or unnecessary renderer privileges.
- Keep filesystem, OS integration, notifications, updater, and tray behavior in
  the main process or dedicated infrastructure modules, not in renderer code.
- Dispose of long-lived resources explicitly, especially database connections,
  timers, subscriptions, and native window or tray lifecycles.

## Testing

- Keep tests deterministic and focused on domain behavior, IPC contracts,
  repositories, and UI behavior.
- Prefer adding or updating targeted Vitest coverage alongside behavior changes.
- Do not leave `.only` or `.skip` in committed tests.
