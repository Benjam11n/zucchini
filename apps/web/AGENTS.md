# AGENTS.md

## Web App Overview

- `apps/web` is a small static React/Vite marketing site.
- It is intentionally separate from the Electron app runtime.
- The current scope is marketing, product framing, and download entry points.

## Web Workflow Rules

- Run web commands from the repository root with:
  `pnpm --dir apps/web ...`
- Common validations:
  `pnpm run lint:web`
  `pnpm run build:web`
  `pnpm --dir apps/web react-doctor`
- Run `pnpm run format` from the workspace root before finalizing changes.

## Web Best Practices

- Keep the site simple. It is a marketing page, not an application shell.
- Do not introduce Electron, preload, desktop state, or desktop-only shared
  code into this app.
- Prefer small components and direct composition.
- Avoid premature routing, data layers, or framework complexity.
- Keep copy and layout changes easy to follow in code.
- Reuse branding assets when helpful, but do not force a shared package for a
  handful of files.
- No over-engineering. If plain React and CSS solve it clearly, stop there.

## Design And Maintainability

- Preserve a clear visual direction without adding unnecessary technical
  complexity.
- Keep styling local and readable.
- Avoid clever abstractions for one-off sections.
- Favor clarity in markup and naming over component generalization.
- Keep download links and external URLs explicit and easy to update.

## Testing Expectations

- Build correctness is the main validation right now.
- Use `react-doctor` after meaningful React changes.
- Add tests only when page behavior becomes more interactive or stateful.
