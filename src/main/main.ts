/* eslint-disable promise/prefer-await-to-then */

/**
 * Electron main-process composition root.
 *
 * This file wires together the app runtime, native windows, IPC handlers, and
 * top-level Electron lifecycle hooks.
 */
import path from "node:path";

import { Effect } from "effect";
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  nativeImage,
  powerMonitor,
  shell,
} from "electron";
import { autoUpdater } from "electron-updater";

import { resolveRuntimeIconPath } from "@/main/app/assets";
import { systemClock } from "@/main/app/clock";
import { createDataManagementActions } from "@/main/app/data-management";
import { createFatalErrorReporter } from "@/main/app/fatal-error";
import {
  shouldHideOnWindowClose,
  shouldQuitWhenAllWindowsClosed,
} from "@/main/app/lifecycle";
import { applyRuntimeSettings, createAppRuntime } from "@/main/app/runtime";
import type { AppRuntime } from "@/main/app/runtime";
import {
  acquireSingleInstanceLock,
  registerSecondInstanceHandler,
} from "@/main/app/single-instance";
import { registerUpdaterRuntime } from "@/main/app/updater-runtime";
import {
  applyWindowThemeMode,
  getWindowBackgroundColor,
} from "@/main/app/window-theme";
import { clampFocusWidgetBounds } from "@/main/app/windows/focus-widget-bounds";
import { createFocusWidgetWindow } from "@/main/app/windows/focus-widget-window";
import { createMainWindow } from "@/main/app/windows/main-window";
import { configureWindowSecurity } from "@/main/app/windows/window-security";
import { createFocusTimerCoordinator } from "@/main/features/focus/timer-coordinator";
import { registerIpcHandlers } from "@/main/infra/ipc/handlers";
import { APP_UPDATER_CHANNELS } from "@/shared/contracts/app-updater";
import type { AppUpdateState } from "@/shared/contracts/app-updater";
import { HABITS_IPC_CHANNELS } from "@/shared/contracts/habits-ipc";
import type { FocusSession } from "@/shared/domain/focus-session";

function loadAppWindow(window: BrowserWindow, search = ""): void {
  if (process.env.VITE_DEV_SERVER_URL) {
    window.loadURL(`${process.env.VITE_DEV_SERVER_URL}${search}`);
    return;
  }

  window.loadFile(path.join(__dirname, "../dist/index.html"), {
    search,
  });
}

let isQuitting = false;
let trayEnabled = false;
let mainWindow: BrowserWindow | null = null;
let focusWidgetWindow: BrowserWindow | null = null;
let runtime: AppRuntime | null = null;

const focusTimerCoordinator = createFocusTimerCoordinator();

function getRuntime(): AppRuntime {
  if (!runtime) {
    throw new Error("App runtime is not initialized.");
  }

  return runtime;
}

function ensureMainWindow(): BrowserWindow {
  const existingWindow =
    mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;

  if (existingWindow) {
    return existingWindow;
  }

  const window = createMainWindow({
    backgroundColor: getWindowBackgroundColor(),
    getIsQuitting: () => isQuitting,
    iconPath: resolveRuntimeIconPath(),
    onClosed: () => {
      if (mainWindow === window) {
        mainWindow = null;
      }
    },
    shouldHideToTray: ({ isQuitting: quitting }) =>
      shouldHideOnWindowClose({
        isQuitting: quitting,
        trayEnabled,
      }),
  });

  configureWindowSecurity(window);
  loadAppWindow(window);
  mainWindow = window;
  return window;
}

function ensureFocusWidgetWindow(): BrowserWindow {
  const existingWindow =
    focusWidgetWindow && !focusWidgetWindow.isDestroyed()
      ? focusWidgetWindow
      : null;

  if (existingWindow) {
    return existingWindow;
  }

  const window = createFocusWidgetWindow({
    backgroundColor: getWindowBackgroundColor(),
    getIsQuitting: () => isQuitting,
    iconPath: resolveRuntimeIconPath(),
    onClosed: () => {
      if (focusWidgetWindow === window) {
        focusWidgetWindow = null;
      }
    },
  });

  configureWindowSecurity(window);
  loadAppWindow(window, "?view=widget");
  focusWidgetWindow = window;
  return window;
}

function positionFocusWidgetWindow(window: BrowserWindow): void {
  const bounds = window.getBounds();
  window.setBounds(
    clampFocusWidgetBounds({
      height: bounds.height,
      width: bounds.width,
      x: bounds.x,
      y: bounds.y,
    })
  );
}

function resizeFocusWidget(width: number, height: number): void {
  const window =
    focusWidgetWindow && !focusWidgetWindow.isDestroyed()
      ? focusWidgetWindow
      : null;

  if (!window) {
    return;
  }

  const [x, y] = window.getPosition();
  window.setBounds(clampFocusWidgetBounds({ height, width, x, y }));
}

function showMainWindow(): void {
  const window = ensureMainWindow();

  if (window.isMinimized()) {
    window.restore();
  }

  window.show();
  window.focus();
}

function showFocusWidget(): void {
  const window = ensureFocusWidgetWindow();

  positionFocusWidgetWindow(window);
  window.showInactive();
}

function broadcastUpdateState(state: AppUpdateState): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(APP_UPDATER_CHANNELS.stateChanged, state);
  }
}

function broadcastFocusSessionRecorded(session: FocusSession): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(HABITS_IPC_CHANNELS.focusSessionRecorded, session);
  }
}

function applyAppRuntimeSettingsFromState(nextRuntime: AppRuntime): void {
  const today = nextRuntime.service.getTodayState();
  trayEnabled = applyRuntimeSettings({
    appLike: app,
    applyThemeMode: applyWindowThemeMode,
    runtime: nextRuntime,
    settings: today.settings,
  });
}

function cleanupRuntime(): void {
  runtime?.reminders.cancel();
  runtime?.tray.destroy();
  runtime?.repository.close();
}

const reportFatalMainProcessError = createFatalErrorReporter({
  appLike: app,
  cleanup: cleanupRuntime,
  dialogLike: dialog,
  log: console,
});

function reportAppReadyFailure(error: unknown): void {
  console.error(
    "Failed while waiting for the Electron app to be ready.",
    error
  );
}

process.on("uncaughtException", (error) => {
  reportFatalMainProcessError("uncaughtException", error);
});

process.on("unhandledRejection", (reason) => {
  reportFatalMainProcessError("unhandledRejection", reason);
});

function bootstrapApp(): void {
  app
    .whenReady()
    .then(() => {
      Effect.runSync(
        Effect.sync(() => {
          const nextRuntime = createAppRuntime({
            onOpenFocusWidget: showFocusWidget,
            onOpenMainWindow: showMainWindow,
            onQuit: () => {
              isQuitting = true;
              app.quit();
            },
          });
          runtime = nextRuntime;

          if (process.platform === "darwin" && app.dock) {
            const icon = nativeImage.createFromPath(resolveRuntimeIconPath());
            if (!icon.isEmpty()) {
              app.dock.setIcon(icon);
            }
          }

          const dataManagement = createDataManagementActions({
            appLike: app,
            clock: systemClock,
            dialogLike: dialog,
            repository: nextRuntime.repository,
            service: nextRuntime.service,
            shellLike: shell,
          });

          registerIpcHandlers({
            broadcastFocusSessionRecorded,
            focusTimerCoordinator,
            onExportBackup: dataManagement.exportBackup,
            onImportBackup: () =>
              dataManagement.importBackup(() => {
                isQuitting = true;
              }),
            onOpenDataFolder: dataManagement.openDataFolder,
            onResizeFocusWidget: resizeFocusWidget,
            onSettingsChanged: (settings) => {
              trayEnabled = applyRuntimeSettings({
                appLike: app,
                applyThemeMode: applyWindowThemeMode,
                runtime: nextRuntime,
                settings,
              });
            },
            onShowFocusWidget: showFocusWidget,
            onShowMainWindow: showMainWindow,
            service: nextRuntime.service,
          });

          const updaterController = registerUpdaterRuntime({
            appLike: app,
            autoUpdater,
            broadcastState: broadcastUpdateState,
            ipcMainLike: ipcMain,
            log: console,
          });

          ensureMainWindow();
          ensureFocusWidgetWindow();

          setTimeout(() => {
            try {
              applyAppRuntimeSettingsFromState(nextRuntime);
            } catch (error) {
              console.error("Failed to warm app runtime.", error);
            }
          }, 0);

          updaterController.start();
        })
      );

      app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          ensureMainWindow();
          return;
        }

        showMainWindow();
      });

      powerMonitor.on("resume", () => {
        const nextRuntime = getRuntime();
        nextRuntime.reminders.schedule(
          nextRuntime.service.getTodayState().settings
        );
      });
    })
    .catch(reportAppReadyFailure);
}

if (acquireSingleInstanceLock(app)) {
  registerSecondInstanceHandler(app, () => {
    if (app.isReady()) {
      showMainWindow();
      return;
    }

    app.whenReady().then(showMainWindow).catch(reportAppReadyFailure);
  });
  bootstrapApp();
} else {
  app.quit();
}

app.on("before-quit", () => {
  isQuitting = true;
  cleanupRuntime();
});

app.on("window-all-closed", () => {
  if (
    shouldQuitWhenAllWindowsClosed({
      platform: process.platform,
      trayEnabled,
    })
  ) {
    app.quit();
  }
});
