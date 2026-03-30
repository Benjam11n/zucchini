/**
 * Electron main-process composition root.
 *
 * This file wires together the app runtime, native windows, IPC handlers, and
 * top-level Electron lifecycle hooks.
 */
import path from "node:path";

import {
  app,
  BrowserWindow,
  dialog,
  globalShortcut,
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
import { createFocusTimerGlobalShortcutManager } from "@/main/app/global-shortcuts";
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
import type {
  FocusTimerActionRequest,
  FocusTimerShortcutStatus,
} from "@/shared/contracts/habits-ipc";
import type { FocusSession } from "@/shared/domain/focus-session";
import type { PersistedFocusTimerState } from "@/shared/domain/focus-timer";

function loadAppWindow(window: BrowserWindow, search = ""): void {
  const devServerUrl = process.env["VITE_DEV_SERVER_URL"];
  if (devServerUrl) {
    window.loadURL(`${devServerUrl}${search}`);
    return;
  }

  window.loadFile(path.join(__dirname, "../dist/index.html"), {
    search,
  });
}

function createMainProcessContext() {
  let isQuitting = false;
  let trayEnabled = false;
  let mainWindow: BrowserWindow | null = null;
  let focusWidgetWindow: BrowserWindow | null = null;
  let runtime: AppRuntime | null = null;

  return {
    clearFocusWidgetWindow(window: BrowserWindow) {
      if (focusWidgetWindow === window) {
        focusWidgetWindow = null;
      }
    },
    clearMainWindow(window: BrowserWindow) {
      if (mainWindow === window) {
        mainWindow = null;
      }
    },
    getFocusWidgetWindow() {
      return focusWidgetWindow && !focusWidgetWindow.isDestroyed()
        ? focusWidgetWindow
        : null;
    },
    getIsQuitting() {
      return isQuitting;
    },
    getMainWindow() {
      return mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
    },
    getRuntime() {
      if (!runtime) {
        throw new Error("App runtime is not initialized.");
      }

      return runtime;
    },
    getRuntimeOrNull() {
      return runtime;
    },
    getTrayEnabled() {
      return trayEnabled;
    },
    markQuitting() {
      isQuitting = true;
    },
    setFocusWidgetWindow(window: BrowserWindow) {
      focusWidgetWindow = window;
    },
    setMainWindow(window: BrowserWindow) {
      mainWindow = window;
    },
    setRuntime(nextRuntime: AppRuntime) {
      runtime = nextRuntime;
    },
    setTrayEnabled(nextTrayEnabled: boolean) {
      trayEnabled = nextTrayEnabled;
    },
  };
}

const context = createMainProcessContext();

const focusTimerCoordinator = createFocusTimerCoordinator();

function ensureMainWindow(): BrowserWindow {
  const existingWindow = context.getMainWindow();

  if (existingWindow) {
    return existingWindow;
  }

  const window = createMainWindow({
    backgroundColor: getWindowBackgroundColor(),
    getIsQuitting: () => context.getIsQuitting(),
    iconPath: resolveRuntimeIconPath(),
    onClosed: () => context.clearMainWindow(window),
    shouldHideToTray: ({ isQuitting: quitting }) =>
      shouldHideOnWindowClose({
        isQuitting: quitting,
        trayEnabled: context.getTrayEnabled(),
      }),
  });

  configureWindowSecurity(window);
  loadAppWindow(window);
  context.setMainWindow(window);
  return window;
}

function ensureFocusWidgetWindow(): BrowserWindow {
  const existingWindow = context.getFocusWidgetWindow();

  if (existingWindow) {
    return existingWindow;
  }

  const window = createFocusWidgetWindow({
    getIsQuitting: () => context.getIsQuitting(),
    iconPath: resolveRuntimeIconPath(),
    onClosed: () => context.clearFocusWidgetWindow(window),
  });

  configureWindowSecurity(window);
  context.setFocusWidgetWindow(window);
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
  const window = context.getFocusWidgetWindow();

  if (!window) {
    return;
  }

  const position = window.getPosition();
  const [x, y] = position;
  if (x === undefined || y === undefined) {
    return;
  }
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

function broadcastFocusTimerStateChanged(
  state: PersistedFocusTimerState
): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(HABITS_IPC_CHANNELS.focusTimerStateChanged, state);
  }
}

function broadcastFocusTimerShortcutStatus(
  status: FocusTimerShortcutStatus
): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(
      HABITS_IPC_CHANNELS.focusTimerShortcutStatusChanged,
      status
    );
  }
}

function getPreferredFocusTimerWindow(): BrowserWindow | null {
  const focusedWindow = BrowserWindow.getFocusedWindow();

  if (focusedWindow && !focusedWindow.isDestroyed()) {
    return focusedWindow;
  }

  const mainWindow = context.getMainWindow();
  if (mainWindow) {
    return mainWindow;
  }

  const focusWidgetWindow = context.getFocusWidgetWindow();
  if (focusWidgetWindow) {
    return focusWidgetWindow;
  }

  return null;
}

function dispatchFocusTimerAction(request: FocusTimerActionRequest): void {
  const targetWindow = getPreferredFocusTimerWindow();

  if (!targetWindow) {
    return;
  }

  targetWindow.webContents.send(
    HABITS_IPC_CHANNELS.focusTimerActionRequested,
    request
  );
}

const focusTimerGlobalShortcutManager = createFocusTimerGlobalShortcutManager({
  globalShortcut,
  onAction: (action) =>
    dispatchFocusTimerAction({
      action,
      source: "global-shortcut",
    }),
});

function registerFocusTimerGlobalShortcuts(settings: {
  resetFocusTimerShortcut: string;
  toggleFocusTimerShortcut: string;
}): void {
  const status = focusTimerGlobalShortcutManager.register(settings);
  broadcastFocusTimerShortcutStatus(status);
}

function cleanupRuntime(): void {
  focusTimerGlobalShortcutManager.unregisterAll();
  const runtime = context.getRuntimeOrNull();

  if (!runtime) {
    return;
  }

  runtime.reminders.cancel();
  runtime.tray.destroy();
  runtime.repository.close();
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

function warmAppRuntime(nextRuntime: AppRuntime): void {
  try {
    const todayState = nextRuntime.service.getTodayState();
    context.setTrayEnabled(
      applyRuntimeSettings({
        appLike: app,
        applyThemeMode: applyWindowThemeMode,
        runtime: nextRuntime,
        settings: todayState.settings,
      })
    );
    registerFocusTimerGlobalShortcuts(todayState.settings);
  } catch (error) {
    console.error("Failed to warm app runtime.", error);
  }
}

function scheduleRuntimeWarmup(nextRuntime: AppRuntime): void {
  queueMicrotask(() => {
    warmAppRuntime(nextRuntime);
  });
}

process.on("uncaughtException", (error) => {
  reportFatalMainProcessError("uncaughtException", error);
});

process.on("unhandledRejection", (reason) => {
  reportFatalMainProcessError("unhandledRejection", reason);
});

async function bootstrapApp(): Promise<void> {
  try {
    await app.whenReady();

    const appRuntime = createAppRuntime({
      onOpenFocusWidget: showFocusWidget,
      onOpenMainWindow: showMainWindow,
      onQuit: () => {
        context.markQuitting();
        app.quit();
      },
    });
    context.setRuntime(appRuntime);

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
      repository: appRuntime.repository,
      service: appRuntime.service,
      shellLike: shell,
    });

    registerIpcHandlers({
      broadcastFocusSessionRecorded,
      broadcastFocusTimerStateChanged,
      focusTimerCoordinator,
      getFocusTimerShortcutStatus: () =>
        focusTimerGlobalShortcutManager.getStatus(),
      onExportBackup: dataManagement.exportBackup,
      onImportBackup: () =>
        dataManagement.importBackup(() => {
          context.markQuitting();
        }),
      onOpenDataFolder: dataManagement.openDataFolder,
      onResizeFocusWidget: resizeFocusWidget,
      onSettingsChanged: (settings) => {
        context.setTrayEnabled(
          applyRuntimeSettings({
            appLike: app,
            applyThemeMode: applyWindowThemeMode,
            runtime: appRuntime,
            settings,
          })
        );
        registerFocusTimerGlobalShortcuts(settings);
      },
      onShowFocusWidget: showFocusWidget,
      onShowMainWindow: showMainWindow,
      service: appRuntime.service,
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
    scheduleRuntimeWarmup(appRuntime);
    updaterController.start();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        ensureMainWindow();
        return;
      }

      showMainWindow();
    });

    powerMonitor.on("resume", () => {
      const runtime = context.getRuntime();
      runtime.reminders.schedule(runtime.service.getTodayState().settings);
    });
  } catch (error) {
    reportAppReadyFailure(error);
  }
}

async function showMainWindowWhenReady(): Promise<void> {
  try {
    await app.whenReady();
    showMainWindow();
  } catch (error) {
    reportAppReadyFailure(error);
  }
}

if (acquireSingleInstanceLock(app)) {
  registerSecondInstanceHandler(app, () => {
    if (app.isReady()) {
      showMainWindow();
      return;
    }

    showMainWindowWhenReady();
  });
  bootstrapApp();
} else {
  app.quit();
}

app.on("before-quit", () => {
  context.markQuitting();
  cleanupRuntime();
});

app.on("window-all-closed", () => {
  if (
    shouldQuitWhenAllWindowsClosed({
      platform: process.platform,
      trayEnabled: context.getTrayEnabled(),
    })
  ) {
    app.quit();
  }
});
