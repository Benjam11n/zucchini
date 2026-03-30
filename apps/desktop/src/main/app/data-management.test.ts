import { createDataManagementActions } from "@/main/app/data-management";

describe("createDataManagementActions()", () => {
  it("validates a selected backup before replacing the live database", async () => {
    const repository = {
      exportBackup: vi.fn(),
      getDatabasePath: vi.fn(() => "/tmp/zucchini.db"),
      replaceDatabase: vi.fn(),
      validateDatabase: vi.fn(),
    };
    const appLike = {
      quit: vi.fn(),
      relaunch: vi.fn(),
    };
    const onBeforeQuit = vi.fn();
    const actions = createDataManagementActions({
      appLike,
      clock: {
        todayKey: () => "2026-03-30",
      },
      dialogLike: {
        showOpenDialog: vi.fn(() =>
          Promise.resolve({
            canceled: false,
            filePaths: ["/tmp/backup.db"],
          })
        ),
        showSaveDialog: vi.fn(),
      },
      repository,
      service: {
        initialize: vi.fn(),
      },
      shellLike: {
        openPath: vi.fn(),
      },
    });

    await expect(actions.importBackup(onBeforeQuit)).resolves.toBeTruthy();

    expect(repository.validateDatabase).toHaveBeenCalledWith("/tmp/backup.db");
    expect(repository.replaceDatabase).toHaveBeenCalledWith("/tmp/backup.db");
    expect(
      repository.validateDatabase.mock.invocationCallOrder[0]
    ).toBeLessThan(repository.replaceDatabase.mock.invocationCallOrder[0]);
    expect(appLike.relaunch).toHaveBeenCalledOnce();
    expect(onBeforeQuit).toHaveBeenCalledOnce();
    expect(appLike.quit).toHaveBeenCalledOnce();
  });

  it("does not relaunch or replace the database when validation fails", async () => {
    const repository = {
      exportBackup: vi.fn(),
      getDatabasePath: vi.fn(() => "/tmp/zucchini.db"),
      replaceDatabase: vi.fn(),
      validateDatabase: vi.fn(() => {
        throw new Error("invalid backup");
      }),
    };
    const appLike = {
      quit: vi.fn(),
      relaunch: vi.fn(),
    };
    const onBeforeQuit = vi.fn();
    const actions = createDataManagementActions({
      appLike,
      clock: {
        todayKey: () => "2026-03-30",
      },
      dialogLike: {
        showOpenDialog: vi.fn(() =>
          Promise.resolve({
            canceled: false,
            filePaths: ["/tmp/backup.db"],
          })
        ),
        showSaveDialog: vi.fn(),
      },
      repository,
      service: {
        initialize: vi.fn(),
      },
      shellLike: {
        openPath: vi.fn(),
      },
    });

    await expect(actions.importBackup(onBeforeQuit)).rejects.toThrow(
      "invalid backup"
    );

    expect(repository.replaceDatabase).not.toHaveBeenCalled();
    expect(appLike.relaunch).not.toHaveBeenCalled();
    expect(onBeforeQuit).not.toHaveBeenCalled();
    expect(appLike.quit).not.toHaveBeenCalled();
  });
});
