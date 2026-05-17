import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import { createAutoBackupService } from "@/main/app/auto-backup";
import { createDefaultAppSettings } from "@/shared/domain/settings";

function createTempDataDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "zucchini-auto-backup-"));
}

function createSettings(
  overrides: Partial<ReturnType<typeof createDefaultAppSettings>> = {}
) {
  return {
    ...createDefaultAppSettings("Asia/Singapore"),
    ...overrides,
  };
}

function createService(
  options: {
    now?: Date;
    dataDir?: string;
    exportBackup?: (destinationPath: string) => Promise<void>;
  } = {}
) {
  const dataDir = options.dataDir ?? createTempDataDir();
  const databasePath = path.join(dataDir, "zucchini.db");
  fs.writeFileSync(databasePath, "db");

  const exportBackup = vi.fn(
    options.exportBackup ??
      ((destinationPath: string) => {
        fs.writeFileSync(destinationPath, "backup");
        return Promise.resolve();
      })
  );
  const updateAutoBackupLastRunAt = vi.fn();
  const openPath = vi.fn(() => Promise.resolve(""));
  const warn = vi.fn();

  const service = createAutoBackupService({
    clock: {
      now: () => options.now ?? new Date("2026-03-30T14:15:16.789Z"),
    },
    log: {
      error: vi.fn(),
      info: vi.fn(),
      warn,
    },
    repository: {
      exportBackup,
      getDatabasePath: () => databasePath,
      updateAutoBackupLastRunAt,
    },
    shell: {
      openPath,
    },
  });

  return {
    dataDir,
    exportBackup,
    openPath,
    service,
    updateAutoBackupLastRunAt,
    warn,
  };
}

describe("createAutoBackupService", () => {
  it("does nothing when auto backups are off", async () => {
    const mocks = createService();

    await expect(
      mocks.service.runIfDue(createSettings({ autoBackupCadence: "off" }))
    ).resolves.toBeNull();

    expect(mocks.exportBackup).not.toHaveBeenCalled();
  });

  it("creates an immediate backup when no previous run exists", async () => {
    const mocks = createService();

    const result = await mocks.service.runIfDue(
      createSettings({ autoBackupCadence: "daily" })
    );

    expect(result).toBe(
      path.join(mocks.dataDir, "Backups", "zucchini-auto-20260330-141516.db")
    );
    expect(fs.existsSync(result as string)).toBe(true);
    expect(mocks.updateAutoBackupLastRunAt).toHaveBeenCalledWith(
      "2026-03-30T14:15:16.789Z"
    );
  });

  it("skips daily and weekly backups when they are not due", async () => {
    const mocks = createService();

    await expect(
      mocks.service.runIfDue(
        createSettings({
          autoBackupCadence: "daily",
          autoBackupLastRunAt: "2026-03-30T01:00:00.000Z",
        })
      )
    ).resolves.toBeNull();
    await expect(
      mocks.service.runIfDue(
        createSettings({
          autoBackupCadence: "weekly",
          autoBackupLastRunAt: "2026-03-25T01:00:00.000Z",
        })
      )
    ).resolves.toBeNull();

    expect(mocks.exportBackup).not.toHaveBeenCalled();
  });

  it("creates due daily and weekly backups", async () => {
    const daily = createService();
    const weekly = createService();

    await daily.service.runIfDue(
      createSettings({
        autoBackupCadence: "daily",
        autoBackupLastRunAt: "2026-03-29T14:15:16.789Z",
      })
    );
    await weekly.service.runIfDue(
      createSettings({
        autoBackupCadence: "weekly",
        autoBackupLastRunAt: "2026-03-23T14:15:16.789Z",
      })
    );

    expect(daily.exportBackup).toHaveBeenCalledOnce();
    expect(weekly.exportBackup).toHaveBeenCalledOnce();
  });

  it("keeps only the newest auto backup", async () => {
    const mocks = createService();
    const backupDir = path.join(mocks.dataDir, "Backups");
    fs.mkdirSync(backupDir, { recursive: true });

    for (let index = 0; index < 3; index += 1) {
      const filePath = path.join(
        backupDir,
        `zucchini-auto-2026032${index}-010000.db`
      );
      fs.writeFileSync(filePath, "old");
      const modifiedAt = new Date(`2026-03-2${index}T01:00:00.000Z`);
      fs.utimesSync(filePath, modifiedAt, modifiedAt);
    }
    fs.writeFileSync(path.join(backupDir, "manual-note.txt"), "keep");

    await mocks.service.runIfDue(
      createSettings({ autoBackupCadence: "daily" })
    );

    expect(fs.readdirSync(backupDir).toSorted()).toStrictEqual([
      "manual-note.txt",
      "zucchini-auto-20260330-141516.db",
    ]);
  });

  it("does not update last run when backup export fails", async () => {
    const mocks = createService({
      exportBackup: () => Promise.reject(new Error("copy failed")),
    });

    await expect(
      mocks.service.runIfDue(createSettings({ autoBackupCadence: "daily" }))
    ).resolves.toBeNull();

    expect(mocks.updateAutoBackupLastRunAt).not.toHaveBeenCalled();
    expect(mocks.warn).toHaveBeenCalled();
  });

  it("reuses an in-flight backup for overlapping requests", async () => {
    const mocks = createService({
      exportBackup: async (destinationPath) => {
        await delay(20);
        fs.writeFileSync(destinationPath, "backup");
      },
    });
    const settings = createSettings({ autoBackupCadence: "daily" });

    const firstRun = mocks.service.runIfDue(settings);
    const secondRun = mocks.service.runIfDue(settings);

    await expect(Promise.all([firstRun, secondRun])).resolves.toStrictEqual([
      path.join(mocks.dataDir, "Backups", "zucchini-auto-20260330-141516.db"),
      path.join(mocks.dataDir, "Backups", "zucchini-auto-20260330-141516.db"),
    ]);
    expect(mocks.exportBackup).toHaveBeenCalledOnce();
  });

  it("opens the auto backup folder", async () => {
    const mocks = createService();

    await expect(mocks.service.openBackupFolder()).resolves.toBe(
      path.join(mocks.dataDir, "Backups")
    );

    expect(mocks.openPath).toHaveBeenCalledWith(
      path.join(mocks.dataDir, "Backups")
    );
  });
});
