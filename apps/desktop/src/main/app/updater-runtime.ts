/**
 * Auto-updater runtime registration.
 *
 * Wires `electron-updater` IPC handlers for checking, downloading, and
 * installing updates. Broadcasts update state changes to all renderer
 * windows and respects platform support (skipped in dev/Windows portable).
 */
import { existsSync } from "node:fs";
import path from "node:path";

import type { UpdaterRuntimePorts } from "@/main/app/ports";
import {
  registerAppUpdater,
  resolveAppUpdateSupportMode,
  serializeAppUpdaterIpcError,
} from "@/main/app/updater";

export function registerUpdaterRuntime({
  app,
  autoUpdater,
  broadcastState,
  ipcMain,
  log,
}: UpdaterRuntimePorts) {
  return registerAppUpdater({
    broadcastState,
    currentVersion: app.getVersion(),
    handleIpc: (channel, handler) => {
      ipcMain.handle(channel, async () => {
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
      appIsPackaged: app.isPackaged,
      hasConfigFile: existsSync(
        path.join(process.resourcesPath, "app-update.yml")
      ),
      hasDevConfigFile: existsSync(
        path.join(app.getAppPath(), "dev-app-update.yml")
      ),
      platform: process.platform,
    }),
    updater: autoUpdater,
  });
}
