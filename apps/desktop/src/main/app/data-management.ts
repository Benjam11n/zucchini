/**
 * Data export/import and backup management.
 *
 * Provides actions for exporting the SQLite database as a timestamped backup,
 * importing (replacing) the database from a backup file, clearing local app
 * data, and opening the app's data folder in the system file explorer.
 * Destructive actions prompt an app restart to apply the updated data.
 */
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  getAutoBackupDirectory,
  listAutoBackupFiles,
} from "@/main/app/auto-backup";
import type {
  DataManagementAppPort,
  DataManagementClockPort,
  DataManagementDialogPort,
  DataManagementRepositoryPort,
  DataManagementServicePort,
  DataManagementShellPort,
} from "@/main/app/ports";
import type { BackupRestorePreview } from "@/shared/contracts/habits-api";

const RESTORE_TOKEN_TTL_MS = 15 * 60 * 1000;

interface CreateDataManagementActionsOptions {
  app: DataManagementAppPort;
  clock: DataManagementClockPort;
  dialog: DataManagementDialogPort;
  repository: DataManagementRepositoryPort;
  shouldRelaunchAfterDataChange?: boolean;
  service: DataManagementServicePort;
  shell: DataManagementShellPort;
}

export function createDataManagementActions({
  app,
  clock,
  dialog,
  repository,
  shouldRelaunchAfterDataChange = !process.env["VITE_DEV_SERVER_URL"],
  service,
  shell,
}: CreateDataManagementActionsOptions) {
  const restoreSources = new Map<
    string,
    { expiresAt: number; sourcePath: string }
  >();

  function pruneExpiredRestoreSources(): void {
    const now = clock.now().getTime();

    for (const [restoreId, restoreSource] of restoreSources) {
      if (restoreSource.expiresAt <= now) {
        restoreSources.delete(restoreId);
      }
    }
  }

  function buildPreImportBackupPath(): string {
    const timestamp = clock.now().toISOString().replaceAll(/\D/g, "");
    return path.join(
      path.dirname(repository.getDatabasePath()),
      `zucchini-before-import-${timestamp}.db`
    );
  }

  function createRestorePreview(
    sourcePath: string,
    source: BackupRestorePreview["source"]
  ): BackupRestorePreview {
    pruneExpiredRestoreSources();
    repository.validateDatabase(sourcePath);

    const fileStats = fs.statSync(sourcePath);
    const databasePreview = repository.getDatabasePreview(sourcePath);
    const restoreId = randomUUID();
    restoreSources.set(restoreId, {
      expiresAt: clock.now().getTime() + RESTORE_TOKEN_TTL_MS,
      sourcePath,
    });

    return {
      ...databasePreview,
      fileName: path.basename(sourcePath),
      filePath: sourcePath,
      modifiedAt: fileStats.mtime.toISOString(),
      restoreId,
      sizeBytes: fileStats.size,
      source,
    };
  }

  function findLatestAutoBackupPath(): string | null {
    const backupDirectory = getAutoBackupDirectory(
      repository.getDatabasePath()
    );

    if (!fs.existsSync(backupDirectory)) {
      return null;
    }

    const backups = listAutoBackupFiles(backupDirectory);

    return backups[0]?.filePath ?? null;
  }

  async function openDataFolder(): Promise<string> {
    service.initialize();

    const dataFolderPath = path.dirname(repository.getDatabasePath());
    const errorMessage = await shell.openPath(dataFolderPath);

    if (errorMessage.length > 0) {
      throw new Error(errorMessage);
    }

    return dataFolderPath;
  }

  async function exportBackup(): Promise<string | null> {
    service.initialize();

    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: path.basename(
        `zucchini-backup-${clock.todayKey().replaceAll("-", "")}.db`
      ),
      filters: [
        {
          extensions: ["db", "sqlite", "sqlite3"],
          name: "Zucchini backups",
        },
      ],
      title: "Export Zucchini backup",
    });

    if (canceled || !filePath) {
      return null;
    }

    await repository.exportBackup(filePath);
    return filePath;
  }

  async function exportCsvData(): Promise<string | null> {
    service.initialize();

    const exportFolderName = `zucchini-csv-export-${clock.todayKey().replaceAll("-", "")}`;
    const { canceled, filePaths } = await dialog.showOpenDialog({
      buttonLabel: "Export CSV",
      defaultPath: exportFolderName,
      properties: ["openDirectory", "createDirectory"],
      title: "Export Zucchini CSV data",
    });

    const [parentFolderPath] = filePaths;

    if (canceled || !parentFolderPath) {
      return null;
    }

    const exportFolderPath =
      path.basename(parentFolderPath) === exportFolderName
        ? parentFolderPath
        : path.join(parentFolderPath, exportFolderName);
    repository.exportCsvData(exportFolderPath);
    return exportFolderPath;
  }

  async function importBackup(onBeforeQuit: () => void): Promise<boolean> {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      filters: [
        {
          extensions: ["db", "sqlite", "sqlite3"],
          name: "Zucchini backups",
        },
      ],
      properties: ["openFile"],
      title: "Import Zucchini backup",
    });

    const [selectedBackupPath] = filePaths;

    if (canceled || !selectedBackupPath) {
      return false;
    }

    repository.validateDatabase(selectedBackupPath);
    await repository.exportBackup(buildPreImportBackupPath());
    repository.replaceDatabase(selectedBackupPath);

    if (shouldRelaunchAfterDataChange) {
      app.relaunch();
    }

    onBeforeQuit();
    app.quit();
    return true;
  }

  async function chooseBackupForRestore(): Promise<BackupRestorePreview | null> {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      buttonLabel: "Preview backup",
      filters: [
        {
          extensions: ["db", "sqlite", "sqlite3"],
          name: "Zucchini backups",
        },
      ],
      properties: ["openFile"],
      title: "Choose Zucchini backup to restore",
    });

    const [selectedBackupPath] = filePaths;

    if (canceled || !selectedBackupPath) {
      return null;
    }

    return createRestorePreview(selectedBackupPath, "file");
  }

  function getLatestAutoBackupRestorePreview(): BackupRestorePreview | null {
    const latestAutoBackupPath = findLatestAutoBackupPath();

    if (!latestAutoBackupPath) {
      return null;
    }

    return createRestorePreview(latestAutoBackupPath, "auto");
  }

  async function restoreBackup(
    restoreId: string,
    onBeforeQuit: () => void
  ): Promise<boolean> {
    pruneExpiredRestoreSources();
    const restoreSource = restoreSources.get(restoreId);

    if (!restoreSource) {
      throw new Error(
        "Backup restore session expired. Choose the backup again before restoring."
      );
    }

    restoreSources.delete(restoreId);
    const { sourcePath } = restoreSource;

    repository.validateDatabase(sourcePath);
    await repository.exportBackup(buildPreImportBackupPath());
    repository.replaceDatabase(sourcePath);

    if (shouldRelaunchAfterDataChange) {
      app.relaunch();
    }

    onBeforeQuit();
    app.quit();
    return true;
  }

  function clearData(onBeforeQuit: () => void): Promise<boolean> {
    repository.resetDatabase();

    if (shouldRelaunchAfterDataChange) {
      app.relaunch();
    }

    onBeforeQuit();
    app.quit();
    return Promise.resolve(true);
  }

  return {
    chooseBackupForRestore,
    clearData,
    exportBackup,
    exportCsvData,
    getLatestAutoBackupRestorePreview,
    importBackup,
    openDataFolder,
    restoreBackup,
  };
}
