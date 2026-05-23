import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { createDataManagementActions } from "@/main/app/data-management";

const preImportBackupPath = path.join(
  "/tmp",
  "zucchini-before-import-20260330141516789.db"
);

function createTempDataDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "zucchini-restore-"));
}

// oxlint-disable-next-line eslint/sort-keys
function createMocks() {
  const backupPath = path.join(createTempDataDir(), "backup.db");
  fs.writeFileSync(backupPath, "backup");
  const exportBackup = vi.fn(() => Promise.resolve());
  const exportCsvData = vi.fn();
  const getDatabasePath = vi.fn(() => "/tmp/zucchini.db");
  const getDatabasePreview = vi.fn(() => ({
    completedHabitCount: 12,
    focusSessionCount: 3,
    habitCount: 5,
    habitPreviewTotalCount: 1,
    habits: [
      {
        category: "productivity",
        frequency: "daily",
        id: 1,
        name: "Plan top task",
        pausedAt: null,
        selectedWeekdays: null,
        sortOrder: 0,
        targetCount: 1,
      },
    ],
    latestActivityDate: "2026-03-30",
  }));
  const replaceDatabase = vi.fn();
  const resetDatabase = vi.fn();
  const validateDatabase = vi.fn();
  const repository = {
    exportBackup,
    exportCsvData,
    getDatabasePath,
    getDatabasePreview,
    replaceDatabase,
    resetDatabase,
    validateDatabase,
  };

  const quit = vi.fn();
  const relaunch = vi.fn();
  const app = { quit, relaunch };

  const onBeforeQuit = vi.fn();

  const showOpenDialog = vi.fn(() =>
    Promise.resolve({
      canceled: false,
      filePaths: [backupPath],
    })
  );
  const showSaveDialog = vi.fn(() =>
    Promise.resolve({
      canceled: false,
      filePath: "/tmp/zucchini-backup-20260330.db",
    })
  );
  const dialog = { showOpenDialog, showSaveDialog };

  const initialize = vi.fn();
  const service = { initialize };

  const openPath = vi.fn(() => Promise.resolve(""));
  const shell = { openPath };

  const now = vi.fn(() => new Date("2026-03-30T14:15:16.789Z"));
  const todayKey = vi.fn(() => "2026-03-30");
  const clock = { now, todayKey };

  const actions = createDataManagementActions({
    app: app as never,
    clock,
    dialog: dialog as never,
    repository: repository as never,
    service,
    shell,
  });

  return {
    actions,
    app,
    backupPath,
    clock,
    dialog,
    onBeforeQuit,
    repository,
    service,
    shell,
  };
}

function createActionsWithoutRelaunch(
  mocks: ReturnType<typeof createMocks>
): ReturnType<typeof createDataManagementActions> {
  return createDataManagementActions({
    app: mocks.app as never,
    clock: mocks.clock,
    dialog: mocks.dialog as never,
    repository: mocks.repository as never,
    service: mocks.service,
    shell: mocks.shell,
    shouldRelaunchAfterDataChange: false,
  });
}

function expectImportBackupReplacedDatabase({
  backupPath,
  repository,
}: Pick<ReturnType<typeof createMocks>, "backupPath" | "repository">) {
  expect(repository.validateDatabase).toHaveBeenCalledWith(backupPath);
  expect(repository.exportBackup).toHaveBeenCalledWith(preImportBackupPath);
  expect(repository.replaceDatabase).toHaveBeenCalledWith(backupPath);
}

function expectAppQuitWithoutRelaunch({
  app,
  onBeforeQuit,
}: Pick<ReturnType<typeof createMocks>, "app" | "onBeforeQuit">) {
  expect(app.relaunch).not.toHaveBeenCalled();
  expect(onBeforeQuit).toHaveBeenCalledOnce();
  expect(app.quit).toHaveBeenCalledOnce();
}

function expectNoRestartOrImport(mocks: ReturnType<typeof createMocks>) {
  expect(mocks.repository.replaceDatabase).not.toHaveBeenCalled();
  expect(mocks.repository.exportBackup).not.toHaveBeenCalled();
  expect(mocks.app.relaunch).not.toHaveBeenCalled();
  expect(mocks.onBeforeQuit).not.toHaveBeenCalled();
  expect(mocks.app.quit).not.toHaveBeenCalled();
}

describe("createDataManagementActions()", () => {
  it("clears the live database and restarts the app", async () => {
    const { actions, app, onBeforeQuit, repository } = createMocks();

    await expect(actions.clearData(onBeforeQuit)).resolves.toBeTruthy();

    expect(repository.resetDatabase).toHaveBeenCalledOnce();
    expect(app.relaunch).toHaveBeenCalledOnce();
    expect(onBeforeQuit).toHaveBeenCalledOnce();
    expect(app.quit).toHaveBeenCalledOnce();
  });

  it("clears data without relaunching when restart is delegated to the dev launcher", async () => {
    const mocks = createMocks();
    const actions = createActionsWithoutRelaunch(mocks);

    await expect(actions.clearData(mocks.onBeforeQuit)).resolves.toBeTruthy();

    expect(mocks.repository.resetDatabase).toHaveBeenCalledOnce();
    expectAppQuitWithoutRelaunch(mocks);
  });

  it("validates a selected backup before replacing the live database", async () => {
    const { actions, app, backupPath, onBeforeQuit, repository } =
      createMocks();

    await expect(actions.importBackup(onBeforeQuit)).resolves.toBeTruthy();

    expectImportBackupReplacedDatabase({ backupPath, repository });
    const [validateCallOrder] =
      repository.validateDatabase.mock.invocationCallOrder;
    const [exportCallOrder] = repository.exportBackup.mock.invocationCallOrder;
    const [replaceCallOrder] =
      repository.replaceDatabase.mock.invocationCallOrder;

    if (
      validateCallOrder === undefined ||
      exportCallOrder === undefined ||
      replaceCallOrder === undefined
    ) {
      throw new Error("Expected validate/export/replace calls to be recorded.");
    }

    expect(validateCallOrder).toBeLessThan(exportCallOrder);
    expect(exportCallOrder).toBeLessThan(replaceCallOrder);
    expect(app.relaunch).toHaveBeenCalledOnce();
    expect(onBeforeQuit).toHaveBeenCalledOnce();
    expect(app.quit).toHaveBeenCalledOnce();
  });

  it("returns null when no latest auto backup exists", () => {
    const mocks = createMocks();
    mocks.repository.getDatabasePath.mockReturnValue(
      path.join(createTempDataDir(), "zucchini.db")
    );

    expect(mocks.actions.getLatestAutoBackupRestorePreview()).toBeNull();

    expect(mocks.repository.validateDatabase).not.toHaveBeenCalled();
  });

  it("previews the newest auto backup only", async () => {
    const mocks = createMocks();
    const dataDir = createTempDataDir();
    const backupDir = path.join(dataDir, "Backups");
    const olderBackup = path.join(
      backupDir,
      "zucchini-auto-20260329-120000.db"
    );
    const newerBackup = path.join(
      backupDir,
      "zucchini-auto-20260330-120000.db"
    );
    fs.mkdirSync(backupDir, { recursive: true });
    fs.writeFileSync(olderBackup, "older");
    fs.writeFileSync(newerBackup, "newer");
    fs.utimesSync(olderBackup, new Date("2026-03-29"), new Date("2026-03-29"));
    fs.utimesSync(newerBackup, new Date("2026-03-30"), new Date("2026-03-30"));
    mocks.repository.getDatabasePath.mockReturnValue(
      path.join(dataDir, "zucchini.db")
    );

    const preview = await mocks.actions.getLatestAutoBackupRestorePreview();

    expect(preview).toMatchObject({
      fileName: "zucchini-auto-20260330-120000.db",
      source: "auto",
    });
    expect(mocks.repository.validateDatabase).toHaveBeenCalledWith(newerBackup);
    expect(mocks.repository.getDatabasePreview).toHaveBeenCalledWith(
      newerBackup
    );
  });

  it("validates a chosen backup before returning a restore preview", async () => {
    const mocks = createMocks();

    const preview = await mocks.actions.chooseBackupForRestore();

    expect(preview).toMatchObject({
      completedHabitCount: 12,
      fileName: "backup.db",
      focusSessionCount: 3,
      habitCount: 5,
      latestActivityDate: "2026-03-30",
      source: "file",
    });
    expect(preview?.restoreId).toEqual(expect.any(String));
    expect(mocks.repository.validateDatabase).toHaveBeenCalledWith(
      mocks.backupPath
    );
    expect(mocks.repository.getDatabasePreview).toHaveBeenCalledWith(
      mocks.backupPath
    );
  });

  it("does not create a restore token when backup preview validation fails", async () => {
    const mocks = createMocks();
    mocks.repository.validateDatabase.mockImplementation(() => {
      throw new Error("invalid backup");
    });

    await expect(mocks.actions.chooseBackupForRestore()).rejects.toThrow(
      "invalid backup"
    );
    await expect(
      mocks.actions.restoreBackup("missing", mocks.onBeforeQuit)
    ).rejects.toThrow("Backup restore session expired");
    expectNoRestartOrImport(mocks);
  });

  it("restores a previewed backup after revalidating and creating a restore point", async () => {
    const mocks = createMocks();
    const actions = createActionsWithoutRelaunch(mocks);
    const preview = await actions.chooseBackupForRestore();

    if (!preview) {
      throw new Error("Expected restore preview.");
    }

    await expect(
      actions.restoreBackup(preview.restoreId, mocks.onBeforeQuit)
    ).resolves.toBeTruthy();

    expect(mocks.repository.validateDatabase).toHaveBeenCalledTimes(2);
    expectImportBackupReplacedDatabase(mocks);
    expectAppQuitWithoutRelaunch(mocks);
  });

  it("expires stale restore preview tokens", async () => {
    const mocks = createMocks();
    const actions = createActionsWithoutRelaunch(mocks);
    mocks.clock.now
      .mockReturnValueOnce(new Date("2026-03-30T14:15:16.789Z"))
      .mockReturnValueOnce(new Date("2026-03-30T14:15:16.789Z"))
      .mockReturnValue(new Date("2026-03-30T14:31:16.789Z"));
    const preview = await actions.chooseBackupForRestore();

    if (!preview) {
      throw new Error("Expected restore preview.");
    }

    await expect(
      actions.restoreBackup(preview.restoreId, mocks.onBeforeQuit)
    ).rejects.toThrow("Backup restore session expired");

    expectNoRestartOrImport(mocks);
  });

  it("does not reuse a restore token after restore validation fails", async () => {
    const mocks = createMocks();
    const preview = await mocks.actions.chooseBackupForRestore();

    if (!preview) {
      throw new Error("Expected restore preview.");
    }

    mocks.repository.validateDatabase.mockImplementation(() => {
      throw new Error("invalid backup");
    });

    await expect(
      mocks.actions.restoreBackup(preview.restoreId, mocks.onBeforeQuit)
    ).rejects.toThrow("invalid backup");
    await expect(
      mocks.actions.restoreBackup(preview.restoreId, mocks.onBeforeQuit)
    ).rejects.toThrow("Backup restore session expired");
    expectNoRestartOrImport(mocks);
  });

  it("does not replace the database for a bad restore token", async () => {
    const mocks = createMocks();

    await expect(
      mocks.actions.restoreBackup("missing", mocks.onBeforeQuit)
    ).rejects.toThrow("Backup restore session expired");

    expectNoRestartOrImport(mocks);
  });

  it("quits without relaunching when import restart is delegated to the dev launcher", async () => {
    const mocks = createMocks();
    const actions = createActionsWithoutRelaunch(mocks);

    await expect(
      actions.importBackup(mocks.onBeforeQuit)
    ).resolves.toBeTruthy();

    expectImportBackupReplacedDatabase(mocks);
    expectAppQuitWithoutRelaunch(mocks);
  });

  it("does not relaunch or replace the database when validation fails", async () => {
    const mocks = createMocks();
    mocks.repository.validateDatabase.mockImplementation(() => {
      throw new Error("invalid backup");
    });

    await expect(
      mocks.actions.importBackup(mocks.onBeforeQuit)
    ).rejects.toThrow("invalid backup");

    expectNoRestartOrImport(mocks);
  });

  it("returns false when the user cancels the open dialog", async () => {
    const mocks = createMocks();
    mocks.dialog.showOpenDialog.mockResolvedValue({
      canceled: true,
      filePaths: [],
    });

    await expect(mocks.actions.importBackup(mocks.onBeforeQuit)).resolves.toBe(
      false
    );

    expect(mocks.repository.validateDatabase).not.toHaveBeenCalled();
    expectNoRestartOrImport(mocks);
  });

  it("returns the backup file path on successful export", async () => {
    const { actions, repository } = createMocks();

    const result = await actions.exportBackup();

    expect(result).toBe("/tmp/zucchini-backup-20260330.db");
    expect(repository.exportBackup).toHaveBeenCalledWith(
      "/tmp/zucchini-backup-20260330.db"
    );
  });

  it("returns the CSV export folder path on successful export", async () => {
    const mocks = createMocks();
    const exportFolderPath = path.join(
      "/tmp",
      "exports",
      "zucchini-csv-export-20260330"
    );
    mocks.dialog.showOpenDialog.mockResolvedValue({
      canceled: false,
      filePaths: ["/tmp/exports"],
    });

    const result = await mocks.actions.exportCsvData();

    expect(result).toBe(exportFolderPath);
    expect(mocks.repository.exportCsvData).toHaveBeenCalledWith(
      exportFolderPath
    );
  });

  it("does not nest CSV exports when the selected folder already uses the default name", async () => {
    const mocks = createMocks();
    mocks.dialog.showOpenDialog.mockResolvedValue({
      canceled: false,
      filePaths: ["/tmp/exports/zucchini-csv-export-20260330"],
    });

    const result = await mocks.actions.exportCsvData();

    expect(result).toBe("/tmp/exports/zucchini-csv-export-20260330");
    expect(mocks.repository.exportCsvData).toHaveBeenCalledWith(
      "/tmp/exports/zucchini-csv-export-20260330"
    );
  });

  it("returns null when the user cancels the CSV export dialog", async () => {
    const mocks = createMocks();
    mocks.dialog.showOpenDialog.mockResolvedValue({
      canceled: true,
      filePaths: [],
    });

    const result = await mocks.actions.exportCsvData();

    expect(result).toBeNull();
    expect(mocks.repository.exportCsvData).not.toHaveBeenCalled();
  });

  it("returns null when the user cancels the save dialog", async () => {
    const mocks = createMocks();
    mocks.dialog.showSaveDialog.mockResolvedValue({
      canceled: true,
      filePath: null as never,
    });

    const result = await mocks.actions.exportBackup();

    expect(result).toBeNull();
    expect(mocks.repository.exportBackup).not.toHaveBeenCalled();
  });

  it("opens the data folder and returns its path", async () => {
    const mocks = createMocks();
    mocks.repository.getDatabasePath.mockReturnValue("/tmp/data/zucchini.db");
    mocks.shell.openPath.mockResolvedValue("");

    const result = await mocks.actions.openDataFolder();

    expect(result).toBe("/tmp/data");
    expect(mocks.repository.getDatabasePath).toHaveBeenCalled();
  });

  it("throws when the shell fails to open the data folder", async () => {
    const mocks = createMocks();
    mocks.shell.openPath.mockResolvedValue("shell error");

    await expect(mocks.actions.openDataFolder()).rejects.toThrow("shell error");
  });
});
