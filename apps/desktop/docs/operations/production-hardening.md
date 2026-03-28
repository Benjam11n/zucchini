# Production Hardening

## 1. Safe Backup Import With Validation And Rollback

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
