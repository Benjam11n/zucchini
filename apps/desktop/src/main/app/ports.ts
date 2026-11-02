import type {
  Menu,
  MenuItemConstructorOptions,
  NativeImage,
  Tray,
} from "electron";

import type { BackupDatabasePreview } from "@/shared/contracts/api/desktop-api";
import type { AppUpdateState } from "@/shared/contracts/app-updater";

export interface LoggerPort {
  error: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
}

export interface DataManagementRepositoryPort {
  exportBackup(destinationPath: string): Promise<void>;
  exportCsvData(destinationPath: string): void;
  getDatabasePath(): string;
  getDatabasePreview(sourcePath: string): BackupDatabasePreview;
  replaceDatabase(sourcePath: string): void;
  resetDatabase(): void;
  validateDatabase(sourcePath: string): void;
}

export interface DataManagementServicePort {
  initialize(): void;
}

export interface GlobalShortcutPort {
  isRegistered: (accelerator: string) => boolean;
  register: (accelerator: string, callback: () => void) => boolean;
  unregister: (accelerator: string) => void;
}

export interface AppTrayShellPort {
  buildMenuFromTemplate(template: MenuItemConstructorOptions[]): Menu;
  createImageFromPath(path: string): NativeImage;
  createTray(image: NativeImage): Tray;
  resolveIconPath(): string;
}

export type AppUpdaterEventName =
  | "checking-for-update"
  | "download-progress"
  | "error"
  | "update-available"
  | "update-downloaded"
  | "update-not-available";

export interface AutoUpdaterPort {
  autoDownload: boolean;
  autoInstallOnAppQuit: boolean;
  allowPrerelease?: boolean;
  forceDevUpdateConfig?: boolean;
  logger?: LoggerPort | null;
  checkForUpdates: () => Promise<unknown>;
  downloadUpdate: () => Promise<unknown>;
  on: (
    event: AppUpdaterEventName,
    listener: (...args: unknown[]) => void
  ) => void;
  quitAndInstall: (isSilent?: boolean, isForceRunAfter?: boolean) => void;
}

export interface UpdaterRuntimePorts {
  markQuitting: () => void;
  app: {
    getAppPath: () => string;
    getVersion: () => string;
    isPackaged: boolean;
  };
  autoUpdater: AutoUpdaterPort;
  broadcastState: (state: AppUpdateState) => void;
  ipcMain: {
    handle: (
      channel: string,
      listener: (...args: unknown[]) => unknown
    ) => void;
  };
  log: LoggerPort;
}

export interface SessionSecurityPort {
  setPermissionCheckHandler(
    handler: (
      webContents: { getURL: () => string } | null,
      permission: string,
      requestingOrigin: string
    ) => boolean
  ): void;
  setPermissionRequestHandler(
    handler: (
      webContents: { getURL: () => string } | null,
      permission: string,
      callback: (granted: boolean) => void,
      details: {
        requestingUrl: string;
      }
    ) => void
  ): void;
}
