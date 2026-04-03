import { createDataManagementActions } from "@/main/app/data-management";

// oxlint-disable-next-line eslint/sort-keys
function createMocks() {
  const exportBackup = vi.fn(() => Promise.resolve());
  const getDatabasePath = vi.fn(() => "/tmp/zucchini.db");
  const replaceDatabase = vi.fn();
  const validateDatabase = vi.fn();
  const repository = {
    exportBackup,
    getDatabasePath,
    replaceDatabase,
    validateDatabase,
  };

  const quit = vi.fn();
  const relaunch = vi.fn();
  const appLike = { quit, relaunch };

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
  const dialogLike = { showOpenDialog, showSaveDialog };

  const initialize = vi.fn();
  const service = { initialize };

  const openPath = vi.fn(() => Promise.resolve(""));
  const shellLike = { openPath };

  const todayKey = vi.fn(() => "2026-03-30");
  const clock = { todayKey };

  const actions = createDataManagementActions({
    appLike: appLike as never,
    clock,
    dialogLike: dialogLike as never,
    repository: repository as never,
    service,
    shellLike,
  });

  return {
    actions,
    appLike,
    clock,
    dialogLike,
    onBeforeQuit,
    repository,
    service,
    shellLike,
  };
}

describe("createDataManagementActions()", () => {
  it("validates a selected backup before replacing the live database", async () => {
    const { actions, appLike, onBeforeQuit, repository } = createMocks();

    await expect(actions.importBackup(onBeforeQuit)).resolves.toBeTruthy();

    expect(repository.validateDatabase).toHaveBeenCalledWith("/tmp/backup.db");
    expect(repository.replaceDatabase).toHaveBeenCalledWith("/tmp/backup.db");
    const [validateCallOrder] =
      repository.validateDatabase.mock.invocationCallOrder;
    const [replaceCallOrder] =
      repository.replaceDatabase.mock.invocationCallOrder;

    if (validateCallOrder === undefined || replaceCallOrder === undefined) {
      throw new Error("Expected validate/replace calls to be recorded.");
    }

    expect(validateCallOrder).toBeLessThan(replaceCallOrder);
    expect(appLike.relaunch).toHaveBeenCalledOnce();
    expect(onBeforeQuit).toHaveBeenCalledOnce();
    expect(appLike.quit).toHaveBeenCalledOnce();
  });

  it("does not relaunch or replace the database when validation fails", async () => {
    const mocks = createMocks();
    mocks.repository.validateDatabase.mockImplementation(() => {
      throw new Error("invalid backup");
    });

    await expect(mocks.actions.importBackup(mocks.onBeforeQuit)).rejects.toThrow(
      "invalid backup"
    );

    expect(mocks.repository.replaceDatabase).not.toHaveBeenCalled();
    expect(mocks.appLike.relaunch).not.toHaveBeenCalled();
    expect(mocks.onBeforeQuit).not.toHaveBeenCalled();
    expect(mocks.appLike.quit).not.toHaveBeenCalled();
  });

  it("returns false when the user cancels the open dialog", async () => {
    const mocks = createMocks();
    mocks.dialogLike.showOpenDialog.mockResolvedValue({
      canceled: true,
      filePaths: [],
    });

    await expect(mocks.actions.importBackup(mocks.onBeforeQuit)).resolves.toBe(
      false
    );

    expect(mocks.repository.validateDatabase).not.toHaveBeenCalled();
    expect(mocks.repository.replaceDatabase).not.toHaveBeenCalled();
    expect(mocks.appLike.relaunch).not.toHaveBeenCalled();
    expect(mocks.onBeforeQuit).not.toHaveBeenCalled();
    expect(mocks.appLike.quit).not.toHaveBeenCalled();
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
    mocks.dialogLike.showSaveDialog.mockResolvedValue({
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
    mocks.shellLike.openPath.mockResolvedValue("");

    const result = await mocks.actions.openDataFolder();

    expect(result).toBe("/tmp/data");
    expect(mocks.repository.getDatabasePath).toHaveBeenCalled();
  });

  it("throws when the shell fails to open the data folder", async () => {
    const mocks = createMocks();
    mocks.shellLike.openPath.mockResolvedValue("shell error");

    await expect(mocks.actions.openDataFolder()).rejects.toThrow("shell error");
  });
});
