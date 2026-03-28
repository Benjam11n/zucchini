# Development

## Overview

Zucchini is a local-first Electron app with a React renderer, TypeScript across
the stack, and SQLite for persistence.

## Requirements

- Bun
- Node-compatible desktop environment for Electron development

## Install

Install dependencies from the repository root:

```bash
bun install
```

If this clone was installed before native notification addons were trusted by
default, rerun:

```bash
bun install
bun run --cwd apps/desktop rebuild:native
```

## Common Commands

```bash
bun run dev:desktop
bun run build:desktop
bun run --cwd apps/desktop typecheck
bun run lint:desktop
bun run test:desktop
bun run --cwd apps/desktop knip
bun run --cwd apps/desktop react-doctor
bun run --cwd apps/desktop package
bun run --cwd apps/desktop dist:desktop
```

## Project Layout

- `src/main`: Electron main process, services, repositories, notifications, and
  scheduling.
- `src/preload`: preload bridge exposed to the renderer.
- `src/shared`: shared contracts, domain rules, and utilities.
- `src/renderer`: React application, pages, features, and UI components.
- `drizzle`: database migrations and metadata.
- `build`: desktop app icons and packaging assets.

## Architecture Notes

- Keep renderer code focused on UI and state flow.
- Put business rules in `src/shared` or `src/main`.
- Use the preload bridge for renderer-to-main communication.
- Persist app data locally through SQLite and the repository layer.

## Quality Checks

Before shipping changes, run:

```bash
bun run format
bun run lint:desktop
bun run test:desktop
bun run --cwd apps/desktop knip
```

Use `bun run --cwd apps/desktop typecheck` when you want a quick
TypeScript-only validation, and `bun run --cwd apps/desktop react-doctor`
after meaningful React changes.

## Test Data Fixtures

Generate local SQLite fixtures for manual smoke testing and larger local data
loads:

```bash
bun run --cwd apps/desktop testdata:generate:medium
bun run --cwd apps/desktop testdata:generate:stress
```

You can also choose a preset explicitly:

```bash
bun run --cwd apps/desktop testdata:generate -- --preset medium --overwrite
bun run --cwd apps/desktop testdata:generate -- --preset stress --overwrite
```

Generated databases are written to:

- `src/test/fixtures/db/zucchini-medium.db`
- `src/test/fixtures/db/zucchini-stress.db`

These `.db` files are intentionally not committed to git. Regenerate them when
needed, then import them through Zucchini's existing Settings > Backups & data
flow.

- Use `medium` for everyday smoke testing and normal-scale local checks.
- Use `stress` when you want a much heavier history, review, and focus-session
  dataset.
