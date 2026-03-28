# Zucchini Docs

This directory holds the desktop app documentation for the monorepo.

Run desktop-specific commands from the repository root with `bun run --cwd apps/desktop ...`
or by using the root wrapper scripts such as `bun run build:desktop`.

## Guides

- [Architecture Guide](./architecture.md): newcomer-friendly explanation of the
  Electron app structure, startup flow, layer boundaries, and feature layout.
- [Development](./development.md): local setup, scripts, architecture, and
  quality checks.
- [Production Hardening](./operations/production-hardening.md): production
  safety priorities and implementation notes.
- [Release Operations](./operations/releasing.md): packaging and GitHub Release
  workflow details.
