# Production Hardening

## Purpose And Scope

This document tracks the highest-impact production-readiness work that should
land before spending more time on smaller performance cleanups.

The focus here is operational safety and failure handling for a local-first
desktop app:

1. Single-instance enforcement
2. Crash containment for renderer and main
3. Safe backup import with validation and rollback

This guide is intentionally implementation-focused. It describes the current
risk, the target behavior, the maintainable implementation shape, and the
expected test coverage for each item.

## Why The Priority Order Is `1 -> 3 -> 2`

This order is based on user impact and blast radius:

- Single-instance enforcement is first because two live app processes can race
  against the same local runtime and database.
- Crash containment is second because a renderer crash or uncaught main-process
  failure currently has no dedicated recovery UX.
- Safe backup import is third because the current flow is risky, but it is a
  lower-frequency action than normal app launch and day-to-day usage.

## 1. Single-Instance Enforcement

### Current Risk

- Zucchini does not currently acquire Electron's single-instance lock.
- A user can launch two app processes against the same local app data folder.
- That can lead to duplicate reminder scheduling, updater inconsistencies, and
  SQLite contention against the same `zucchini.db`.

### Desired Behavior

- Only one Zucchini process owns the local runtime at a time.
- A second launch must activate the existing main window instead of starting a
  second runtime.
- If the main window is minimized, the existing instance restores it.
- If the main window does not exist yet, the existing instance creates it.
- The focus widget must not be prioritized on second launch.
- Command-line arguments from the second launch are ignored for now.

### Implementation Design

- Add `src/main/app/single-instance.ts`.
- Keep the module small and testable with two exported functions:
  - `acquireSingleInstanceLock(appLike): boolean`
  - `registerSecondInstanceHandler(appLike, showMainWindow): void`
- Reshape `src/main/main.ts` so startup runs through `bootstrapApp()`.
- Acquire the single-instance lock as early as possible.
- If the lock is not acquired:
  - call `app.quit()`
  - do not bootstrap the runtime
- If the lock is acquired:
  - register the `second-instance` handler
  - bootstrap the rest of the app normally
- In `main.ts`, pass a wrapper to the second-instance handler that waits for
  `app.whenReady()` before trying to reveal or create the main window.

### Testing Strategy

- Add `src/main/app/single-instance.test.ts`.
- Cover:
  - lock success returns `true`
  - lock failure returns `false`
  - the registered `second-instance` handler calls `showMainWindow`
  - second-instance registration only happens on the primary-instance path

### Rollout Notes

- This change should be isolated to the Electron main process.
- No renderer contracts or preload APIs change.
- Existing startup behavior should remain the same for the first instance.

### Non-Goals

- Deep-link handling
- File-open launch routing
- Widget-specific activation rules on second launch

## 2. Crash Containment For Renderer And Main

### Current Risk

- The renderer has boot-time loading and error states, but no dedicated React
  error boundary for unexpected render failures.
- The main process does not centralize `uncaughtException` or
  `unhandledRejection` handling.
- A production failure can currently surface as a white screen, abrupt quit, or
  noisy console-only failure.

### Desired Behavior

- Renderer crashes should show a clear fallback instead of leaving the user on a
  broken window.
- Main-process fatal errors should follow one consistent shutdown path.
- The app should log the original error, show a safe user-facing message when
  possible, and exit instead of continuing in an unknown state.

### Implementation Design

Renderer:

- Add `src/renderer/app/app-error-boundary.tsx`.
- Wrap both the main app branch and the widget branch in
  `src/renderer/app/app-root.tsx`.
- Use a fallback that:
  - explains the app hit an unexpected error
  - offers `Reload app`
  - stays distinct from boot/data-load error messaging

Main:

- Add `src/main/app/fatal-error.ts`.
- Register `process.on("uncaughtException", ...)` and
  `process.on("unhandledRejection", ...)` from `src/main/main.ts`.
- Keep all fatal-error behavior in one helper that:
  - logs the original error
  - shows a safe error dialog if Electron is ready
  - exits non-zero after cleanup

### Testing Strategy

- Add renderer tests that verify the error boundary fallback renders when a
  child throws.
- Verify the reload action triggers a window reload path.
- Add main-process unit tests for fatal-error normalization and exit behavior.

### Rollout Notes

- Start with local logging only.
- Do not add crash reporting or remote telemetry in this pass.

### Non-Goals

- Remote crash collection
- Recovery of in-flight work after a fatal main-process exception
- Complex per-error routing

## 3. Safe Backup Import With Validation And Rollback

### Current Risk

- Backup import currently overwrites the live database directly after file
  selection.
- There is no staged validation, integrity check, schema verification, or
  rollback path.
- A corrupt or incompatible backup can leave the app unable to boot.

### Desired Behavior

- Zucchini must never replace the live database with an invalid backup.
- Validation failures must leave the current live database untouched.
- If the swap fails after the live database is moved aside, the original
  database must be restored automatically.

### Implementation Design

- Introduce a main-only helper such as `src/main/app/backup-import.ts`.
- Replace the direct overwrite flow with a staged restore pipeline:
  1. User selects a backup file.
  2. Copy it to a staging file inside the app data directory.
  3. Open the staged DB with a temporary client/repository.
  4. Run integrity validation on the staged DB.
  5. Run schema initialization or migrations on the staged DB.
  6. Verify the staged DB can build a valid app state through the normal
     service layer.
  7. Close staged DB handles.
  8. Close live DB handles.
  9. Rename the live DB to a rollback file in the same directory.
  10. Atomically replace the live DB with the staged DB.
  11. Relaunch the app.
  12. Restore the rollback copy if the replacement step fails.

### Public Interface Changes

Update the backup import IPC contract from a boolean to a structured result.

Current:

```ts
importBackup(): Promise<boolean>
```

Planned:

```ts
type BackupImportResult =
  | { status: "cancelled" }
  | { status: "failed"; message: string }
  | { status: "relaunching" };

importBackup(): Promise<BackupImportResult>
```

This keeps renderer behavior explicit once validation failures and recovery
paths are introduced.

### Testing Strategy

- Cancelled import returns `cancelled`.
- Corrupt DB returns `failed` and leaves the live DB unchanged.
- Older-but-migratable backups succeed through staging.
- Swap failures restore the original DB.
- Successful import returns `relaunching`.

### Rollout Notes

- Keep the entire validation and swap flow in the main process.
- Do not expose file-system details to the renderer.

### Non-Goals

- Syncing backups to cloud storage
- Cross-device restore flows
- Incremental backup diffing

## Assumptions And Defaults

- The document lives at `docs/operations/production-hardening.md`.
- `docs/README.md` links to this guide.
- Item 1 is implemented immediately after this document lands.
- Items 2 and 3 remain documented and unstarted in this pass.
- No telemetry or external crash reporting is introduced.
- Backup validation stays entirely in the main process.
