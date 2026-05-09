import type {
  App,
  Dialog,
  IpcMain,
  Menu,
  MenuItemConstructorOptions,
  NativeImage,
  Shell,
  Tray,
} from "electron";

import type { AppUpdateState } from "@/shared/contracts/app-updater";
import type { Clock } from "@/shared/domain/clock";

export interface LoggerPort {
  error: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
}

export type DesktopLoggerAppPort = Pick<App, "getPath">;

export type FatalErrorAppPort = Pick<App, "exit" | "isReady">;

export type FatalErrorDialogPort = Pick<Dialog, "showErrorBox">;

export type DataManagementAppPort = Pick<App, "quit" | "relaunch">;

export type DataManagementClockPort = Pick<Clock, "now" | "todayKey">;

export type DataManagementDialogPort = Pick<
  Dialog,
  "showOpenDialog" | "showSaveDialog"
>;

export interface DataManagementRepositoryPort {
  exportBackup(destinationPath: string): Promise<void>;
  exportCsvData(destinationPath: string): void;
  getDatabasePath(): string;
  replaceDatabase(sourcePath: string): void;
  resetDatabase(): void;
  validateDatabase(sourcePath: string): void;
}

export interface DataManagementServicePort {
  initialize(): void;
}

export type DataManagementShellPort = Pick<Shell, "openPath">;

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

export type UpdaterAppPort = Pick<
  App,
  "getAppPath" | "getVersion" | "isPackaged"
>;

export type UpdaterIpcMainPort = Pick<IpcMain, "handle">;

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
  app: UpdaterAppPort;
  autoUpdater: AutoUpdaterPort;
  broadcastState: (state: AppUpdateState) => void;
  ipcMain: UpdaterIpcMainPort;
  log: LoggerPort;
}

export interface PermissionWebContentsPort {
  getURL(): string;
}

export interface SessionSecurityPort {
  setPermissionCheckHandler(
    handler: (
      webContents: PermissionWebContentsPort | null,
      permission: string,
      requestingOrigin: string
    ) => boolean
  ): void;
  setPermissionRequestHandler(
    handler: (
      webContents: PermissionWebContentsPort | null,
      permission: string,
      callback: (granted: boolean) => void,
      details: {
        requestingUrl: string;
      }
    ) => void
  ): void;
}

export type SingleInstanceLockAppPort = Pick<App, "requestSingleInstanceLock">;

export interface SecondInstanceAppPort {
  on(event: "second-instance", listener: () => void): void;
}

export interface RuntimeAppPort {
  isPackaged: boolean;
  setLoginItemSettings(settings: {
    openAsHidden: boolean;
    openAtLogin: boolean;
  }): void;
}
