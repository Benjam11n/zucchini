# Changelog

All notable changes to this project will be documented in this file.

## 0.1.1-beta.11 - 2026-03-28

Changes since `v0.1.1-beta.10`.

### Fixes

- Stabilize bun ci install and preload tests

## 0.1.1-beta.10 - 2026-03-28

Changes since `v0.1.1-beta.9`.

### Features

- Implement native addon existence check to gracefully handle missing notification state dependencies
- Implement in-app prerelease update detection and notifications
- Zoom into mascot images by 20%

### Fixes

- Remove window for widget and disable resizing
- Fix deferred test helper portability
- Remove lint suppressions

### Refactors

- Update activity ring radius calculation to use index-based spacing instead of container scaling
- Expand AGENTS.md with detailed architecture, tech stack, and development practices.

### Maintenance

- Update dependencies and documentation for oxlint release
- Reenable some lint rules
- Reduce unknown type usage

### Other

- Add configurable global focus timer shortcuts
- Increase opacity of background activity ring tracks for better visibility
- Change pr checks to push checks instead
- Enable jsx-no-new-function-as-prop with local suppressions
- Enable prefer-await-to-then with local suppressions
- Enable max-statements with a high threshold
- Enable class-methods-use-this
- Remove non-null, forEach, and void lint exemptions

## 0.1.1-beta.9 - 2026-03-22

Changes since `v0.1.1-beta.8`.

### Features

- Add support for skipping breaks and displaying paused time in focus sessions

### Fixes

- Adjust relative paths for window preload and app index files and update bun dependencies.

### Refactors

- Extract habit management feedback and list components for improved modularity and maintainability.
- Refactor app architecture for clearer boundaries

### Documentation

- Add detailed architecture guide and link it from the README.

### Maintenance

- Migrate type checking to tsgo, update build scripts, and clean up documentation and gitignore entries.
- Add VS Code settings for format on save and Oxc formatter for JS/TS/JSON files.
- Update dev dependencies and remove unused Babel plugins
