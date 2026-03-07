# AGENTS.md

## Project Overview

- Zucchini is a local-first Electron habit tracker with a React renderer and TypeScript across the stack.
- It tracks daily habits, streaks, freezes, reminders, and history, with data persisted locally in SQLite.
- The codebase is split across Electron main, preload, shared domain logic, and renderer UI layers.

## Workflow Commands

- Use `bun` at the repo root for all tasks.
- Common scripts: `bun run dev`, `bun run build`, `bun run test`, `bun run lint`, `bun run format`, `bun run typecheck`, `bun run knip`, `bun run react-doctor`.
- Packaging scripts: `bun run package` and `bun run dist:desktop`.
- Run scripts from the repo root only.

## Code Quality & Formatting

- Run `bun run format` before finalizing changes to keep Ultracite checks green.
- Run `bun run lint`, `bun run test`, and `bun run knip` after meaningful changes.
- Follow the repo formatter defaults: 80-column width, 2-space indentation, semicolons, double quotes, trailing commas where valid.
- Keep changes small, typed, and consistent with the existing layer boundaries.

## Technologies & Practices

- Use TypeScript with strict typing; prefer explicit domain types in `src/shared`.
- Use Effect where it improves clarity around side effects and failure handling, especially in main-process code.
- Keep renderer code focused on UI and state flow; keep business rules in shared or main-process modules.
- Use the preload bridge for renderer-to-main communication instead of exposing Electron APIs directly.
- Persist local app data through SQLite via the repository layer.

## Testing

- Use Vitest for unit tests.
- Keep tests deterministic and focused on domain behavior and service logic.
- Do not leave `.only` or `.skip` in committed tests.
