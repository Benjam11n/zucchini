# AGENTS.md

## Scope

- `apps/web` is the static React/Vite marketing/download site.
- Keep it separate from Electron runtime.
- Current scope: product framing, marketing, and download entry points.

## Workflow

- Run from repo root.
- Web commands: `pnpm --dir apps/web ...`.
- Validate meaningful web changes with `pnpm run lint`, `pnpm run build:web`, and `pnpm --dir apps/web react-doctor`.
- Run `pnpm run format` before finalizing.

## Architecture

- Do not introduce Electron, preload, desktop state, or desktop-only shared code.
- Prefer plain React, local CSS, small components, and direct composition.
- Avoid premature routing, data layers, or framework complexity.
- Do not create shared packages for a handful of branding files.
- Keep download links and external URLs explicit and easy to update.

## Design

- Keep site simple, readable, and marketing-focused.
- Preserve clear visual direction without technical complexity.
- Avoid clever abstractions for one-off sections.
- Favor clear markup/names over component generalization.

## Tests

- Build correctness is main validation.
- Use `react-doctor` after meaningful React changes.
- Add tests only when page behavior becomes interactive or stateful.
