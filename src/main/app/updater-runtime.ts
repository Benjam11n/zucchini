import { existsSync } from "node:fs";
import path from "node:path";

import type { App, IpcMain } from "electron";

import {
  registerAppUpdater,
  resolveAppUpdateSupportMode,
  serializeAppUpdaterIpcError,
} from "@/main/app/updater";
import type { AutoUpdaterLike } from "@/main/app/updater";
import type { AppUpdateState } from "@/shared/contracts/app-updater";

interface LoggerLike {
  error: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
}

export function registerUpdaterRuntime({
  appLike,
  autoUpdater,
  broadcastState,
  ipcMainLike,
  log,
}: {
  appLike: Pick<App, "getAppPath" | "getVersion" | "isPackaged">;
  autoUpdater: AutoUpdaterLike;
  broadcastState: (state: AppUpdateState) => void;
  ipcMainLike: Pick<IpcMain, "handle">;
  log: LoggerLike;
}) {
  return registerAppUpdater({
    broadcastState,
    currentVersion: appLike.getVersion(),
    handleIpc: (channel, handler) => {
      ipcMainLike.handle(channel, async () => {
        try {
          return {
            data: await handler(),
            ok: true,
          };
        } catch (error) {
          log.error("App updater IPC failed.", error);

          return {
            error: serializeAppUpdaterIpcError(),
            ok: false,
          };
        }
      });
    },
    log,
    scheduleInterval: globalThis.setInterval,
    scheduleTimeout: globalThis.setTimeout,
    supportMode: resolveAppUpdateSupportMode({
      appIsPackaged: appLike.isPackaged,
      hasConfigFile: existsSync(
        path.join(process.resourcesPath, "app-update.yml")
      ),
      hasDevConfigFile: existsSync(
        path.join(appLike.getAppPath(), "dev-app-update.yml")
      ),
      platform: process.platform,
    }),
    updater: autoUpdater,
  });
}
