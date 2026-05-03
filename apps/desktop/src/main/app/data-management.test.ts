import path from "node:path";

import { createDataManagementActions } from "@/main/app/data-management";

const preImportBackupPath = path.join(
  "/tmp",
  "zucchini-before-import-20260330141516789.db"
);

// oxlint-disable-next-line eslint/sort-keys
function createMocks() {
  const exportBackup = vi.fn(() => Promise.resolve());
  const getDatabasePath = vi.fn(() => "/tmp/zucchini.db");
  const replaceDatabase = vi.fn();
  const resetDatabase = vi.fn();
  const validateDatabase = vi.fn();
  const repository = {
    exportBackup,
    getDatabasePath,
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
      filePaths: ["/tmp/backup.db"],
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

function expectImportBackupReplacedDatabase(
  repository: ReturnType<typeof createMocks>["repository"]
) {
  expect(repository.validateDatabase).toHaveBeenCalledWith("/tmp/backup.db");
  expect(repository.exportBackup).toHaveBeenCalledWith(preImportBackupPath);
  expect(repository.replaceDatabase).toHaveBeenCalledWith("/tmp/backup.db");
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
    const { actions, app, onBeforeQuit, repository } = createMocks();

    await expect(actions.importBackup(onBeforeQuit)).resolves.toBeTruthy();

    expectImportBackupReplacedDatabase(repository);
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

  it("quits without relaunching when import restart is delegated to the dev launcher", async () => {
    const mocks = createMocks();
    const actions = createActionsWithoutRelaunch(mocks);

    await expect(
      actions.importBackup(mocks.onBeforeQuit)
    ).resolves.toBeTruthy();

    expectImportBackupReplacedDatabase(mocks.repository);
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
