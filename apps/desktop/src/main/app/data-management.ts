/**
 * Data export/import and backup management.
 *
 * Provides actions for exporting the SQLite database as a timestamped backup,
 * importing (replacing) the database from a backup file, and opening the
 * app's data folder in the system file explorer. Import prompts an app
 * restart to apply the restored data.
 */
import path from "node:path";

import type { App, Dialog, Shell } from "electron";

import type { Clock } from "@/main/app/clock";
import type { HabitsApplicationService } from "@/main/features/habits/habits-application-service";
import type { SqliteAppRepository } from "@/main/infra/persistence/sqlite-app-repository";

interface CreateDataManagementActionsOptions {
  appLike: Pick<App, "quit" | "relaunch">;
  clock: Pick<Clock, "todayKey">;
  dialogLike: Pick<Dialog, "showOpenDialog" | "showSaveDialog">;
  repository: Pick<
    SqliteAppRepository,
    "exportBackup" | "getDatabasePath" | "replaceDatabase" | "validateDatabase"
  >;
  service: Pick<HabitsApplicationService, "initialize">;
  shellLike: Pick<Shell, "openPath">;
}

export function createDataManagementActions({
  appLike,
  clock,
  dialogLike,
  repository,
  service,
  shellLike,
}: CreateDataManagementActionsOptions) {
  async function openDataFolder(): Promise<string> {
    service.initialize();

    const dataFolderPath = path.dirname(repository.getDatabasePath());
    const errorMessage = await shellLike.openPath(dataFolderPath);

    if (errorMessage.length > 0) {
      throw new Error(errorMessage);
    }

    return dataFolderPath;
  }

  async function exportBackup(): Promise<string | null> {
    service.initialize();

    const { canceled, filePath } = await dialogLike.showSaveDialog({
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

  async function importBackup(onBeforeQuit: () => void): Promise<boolean> {
    const { canceled, filePaths } = await dialogLike.showOpenDialog({
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

    // CHECK: import currently replaces the live database in place and relies on
    // relaunch to recover. Should we create an automatic rollback backup first
    // or require an explicit confirmation step before this becomes user-facing?
    repository.validateDatabase(selectedBackupPath);
    repository.replaceDatabase(selectedBackupPath);
    appLike.relaunch();
    onBeforeQuit();
    appLike.quit();
    return true;
  }

  return {
    exportBackup,
    importBackup,
    openDataFolder,
  };
}
