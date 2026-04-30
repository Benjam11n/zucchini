/**
 * Data export/import and backup management.
 *
 * Provides actions for exporting the SQLite database as a timestamped backup,
 * importing (replacing) the database from a backup file, clearing local app
 * data, and opening the app's data folder in the system file explorer.
 * Destructive actions prompt an app restart to apply the updated data.
 */
import path from "node:path";

import type { App, Dialog, Shell } from "electron";

import type { Clock } from "@/main/app/clock";
import type { HabitsApplicationService } from "@/main/features/habits/habits-application-service";
import type { SqliteAppRepository } from "@/main/infra/persistence/sqlite-app-repository";

interface CreateDataManagementActionsOptions {
  appLike: Pick<App, "quit" | "relaunch">;
  clock: Pick<Clock, "now" | "todayKey">;
  dialogLike: Pick<Dialog, "showOpenDialog" | "showSaveDialog">;
  repository: Pick<
    SqliteAppRepository,
    | "exportBackup"
    | "getDatabasePath"
    | "replaceDatabase"
    | "resetDatabase"
    | "validateDatabase"
  >;
  shouldRelaunchAfterDataChange?: boolean;
  service: Pick<HabitsApplicationService, "initialize">;
  shellLike: Pick<Shell, "openPath">;
}

export function createDataManagementActions({
  appLike,
  clock,
  dialogLike,
  repository,
  shouldRelaunchAfterDataChange = !process.env["VITE_DEV_SERVER_URL"],
  service,
  shellLike,
}: CreateDataManagementActionsOptions) {
  function buildPreImportBackupPath(): string {
    const timestamp = clock.now().toISOString().replaceAll(/\D/g, "");
    return path.join(
      path.dirname(repository.getDatabasePath()),
      `zucchini-before-import-${timestamp}.db`
    );
  }

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

    repository.validateDatabase(selectedBackupPath);
    await repository.exportBackup(buildPreImportBackupPath());
    repository.replaceDatabase(selectedBackupPath);

    if (shouldRelaunchAfterDataChange) {
      appLike.relaunch();
    }

    onBeforeQuit();
    appLike.quit();
    return true;
  }

  function clearData(onBeforeQuit: () => void): Promise<boolean> {
    repository.resetDatabase();

    if (shouldRelaunchAfterDataChange) {
      appLike.relaunch();
    }

    onBeforeQuit();
    appLike.quit();
    return Promise.resolve(true);
  }

  return {
    clearData,
    exportBackup,
    importBackup,
    openDataFolder,
  };
}
