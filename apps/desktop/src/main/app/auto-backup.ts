import fs from "node:fs";
import path from "node:path";

import type { LoggerPort } from "@/main/app/ports";
import type { AppSettings } from "@/shared/domain/settings";

interface AutoBackupRepositoryPort {
  exportBackup(destinationPath: string): Promise<void>;
  getDatabasePath(): string;
  updateAutoBackupLastRunAt(timestamp: string): void;
}

interface AutoBackupClockPort {
  now(): Date;
}

interface AutoBackupShellPort {
  openPath(path: string): Promise<string>;
}

interface CreateAutoBackupServiceOptions {
  clock: AutoBackupClockPort;
  log: LoggerPort;
  repository: AutoBackupRepositoryPort;
  shell: AutoBackupShellPort;
}

const AUTO_BACKUP_FILENAME_PATTERN = /^zucchini-auto-\d{8}-\d{6}\.db$/u;
const AUTO_BACKUP_RETENTION_COUNT = 1;

function formatBackupTimestamp(date: Date): string {
  const [datePart = "", timePart = ""] = date
    .toISOString()
    .replace(/\.\d{3}Z$/u, "")
    .split("T");

  return `${datePart.replaceAll("-", "")}-${timePart.replaceAll(":", "")}`;
}

function getCadenceIntervalMs(
  cadence: AppSettings["autoBackupCadence"]
): number | null {
  if (cadence === "daily") {
    return 24 * 60 * 60 * 1000;
  }

  if (cadence === "weekly") {
    return 7 * 24 * 60 * 60 * 1000;
  }

  return null;
}

function shouldRunAutoBackup(settings: AppSettings, now: Date): boolean {
  const intervalMs = getCadenceIntervalMs(settings.autoBackupCadence);
  if (intervalMs === null) {
    return false;
  }

  if (!settings.autoBackupLastRunAt) {
    return true;
  }

  const lastRunMs = Date.parse(settings.autoBackupLastRunAt);
  if (!Number.isFinite(lastRunMs)) {
    return true;
  }

  return now.getTime() - lastRunMs >= intervalMs;
}

export function getAutoBackupDirectory(databasePath: string): string {
  return path.join(path.dirname(databasePath), "Backups");
}

export function createAutoBackupService({
  clock,
  log,
  repository,
  shell,
}: CreateAutoBackupServiceOptions) {
  let inFlightBackup: Promise<string | null> | null = null;

  function getBackupDirectory(): string {
    return getAutoBackupDirectory(repository.getDatabasePath());
  }

  function ensureBackupDirectory(): string {
    const backupDirectory = getBackupDirectory();
    fs.mkdirSync(backupDirectory, { recursive: true });
    return backupDirectory;
  }

  function pruneOldBackups(backupDirectory: string) {
    const backups = fs
      .readdirSync(backupDirectory)
      .filter((filename) => AUTO_BACKUP_FILENAME_PATTERN.test(filename))
      .map((filename) => {
        const filePath = path.join(backupDirectory, filename);
        return {
          filePath,
          filename,
          modifiedAtMs: fs.statSync(filePath).mtimeMs,
        };
      })
      .toSorted(
        (left, right) =>
          right.modifiedAtMs - left.modifiedAtMs ||
          right.filename.localeCompare(left.filename)
      );

    for (const backup of backups.slice(AUTO_BACKUP_RETENTION_COUNT)) {
      fs.unlinkSync(backup.filePath);
    }
  }

  async function createBackup(): Promise<string> {
    const now = clock.now();
    const backupDirectory = ensureBackupDirectory();
    const backupPath = path.join(
      backupDirectory,
      `zucchini-auto-${formatBackupTimestamp(now)}.db`
    );

    await repository.exportBackup(backupPath);
    repository.updateAutoBackupLastRunAt(now.toISOString());
    pruneOldBackups(backupDirectory);
    return backupPath;
  }

  async function runBackup(settings: AppSettings): Promise<string | null> {
    if (!shouldRunAutoBackup(settings, clock.now())) {
      return null;
    }

    if (inFlightBackup) {
      return inFlightBackup;
    }

    inFlightBackup = createBackup();

    try {
      return await inFlightBackup;
    } catch (error) {
      log.warn("Auto backup failed.", error);
      throw error;
    } finally {
      inFlightBackup = null;
    }
  }

  async function runIfDue(settings: AppSettings): Promise<string | null> {
    try {
      return await runBackup(settings);
    } catch {
      return null;
    }
  }

  async function openBackupFolder(): Promise<string> {
    const backupDirectory = ensureBackupDirectory();
    const errorMessage = await shell.openPath(backupDirectory);

    if (errorMessage.length > 0) {
      throw new Error(errorMessage);
    }

    return backupDirectory;
  }

  return {
    openBackupFolder,
    runIfDue,
  };
}
