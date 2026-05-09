/**
 * Data export/import and backup management.
 *
 * Provides actions for exporting the SQLite database as a timestamped backup,
 * importing (replacing) the database from a backup file, clearing local app
 * data, and opening the app's data folder in the system file explorer.
 * Destructive actions prompt an app restart to apply the updated data.
 */
import path from "node:path";

import type {
  DataManagementAppPort,
  DataManagementClockPort,
  DataManagementDialogPort,
  DataManagementRepositoryPort,
  DataManagementServicePort,
  DataManagementShellPort,
} from "@/main/app/ports";

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
    clearData,
    exportBackup,
    exportCsvData,
    importBackup,
    openDataFolder,
  };
}
