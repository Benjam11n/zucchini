/**
 * Electron main-process entry point.
 *
 * This file wires together the desktop shell: windows, tray behavior, updater,
 * reminders, IPC, and startup/shutdown lifecycle. Beginners can treat it as
 * the place where the native app is bootstrapped and connected to the shared
 * habit services.
 */
import { existsSync } from "node:fs";
import path from "node:path";

import { Effect } from "effect";
import {
  app,
  BrowserWindow,
  ipcMain,
  nativeImage,
  nativeTheme,
  powerMonitor,
  screen,
} from "electron";
import { autoUpdater } from "electron-updater";

import { resolveRuntimeIconPath } from "@/main/app/assets";
import { systemClock } from "@/main/app/clock";
import {
  buildLoginItemSettings,
  shouldHideOnWindowClose,
  shouldQuitWhenAllWindowsClosed,
} from "@/main/app/lifecycle";
import { createAppTray } from "@/main/app/tray";
import {
  registerAppUpdater,
  resolveAppUpdateSupportMode,
  serializeAppUpdaterIpcError,
} from "@/main/app/updater";
import { createFocusTimerCoordinator } from "@/main/features/focus/timer-coordinator";
import { createReminderScheduler } from "@/main/features/reminders/scheduler";
import { registerIpcHandlers } from "@/main/infra/ipc/handlers";
import { SqliteHabitRepository } from "@/main/repository";
import { HabitService } from "@/main/service";
import { APP_UPDATER_CHANNELS } from "@/shared/contracts/app-updater";
import type { AppUpdateState } from "@/shared/contracts/app-updater";
import { HABITS_IPC_CHANNELS } from "@/shared/contracts/habits-ipc";
import type { FocusSession } from "@/shared/domain/focus-session";
import type { AppSettings, ThemeMode } from "@/shared/domain/settings";

function getWindowBackgroundColor(): string {
  return nativeTheme.shouldUseDarkColors ? "#18231e" : "#f7f3e8";
}

function applyThemeMode(themeMode: ThemeMode): void {
  nativeTheme.themeSource = themeMode;

  for (const window of BrowserWindow.getAllWindows()) {
    window.setBackgroundColor(getWindowBackgroundColor());
  }
}

function isTrustedAppUrl(url: string): boolean {
  if (process.env.VITE_DEV_SERVER_URL) {
    return url.startsWith(process.env.VITE_DEV_SERVER_URL);
  }

  return url.startsWith("file://");
}

function configureWindowSecurity(win: BrowserWindow): void {
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  win.webContents.on("will-navigate", (event, url) => {
    if (isTrustedAppUrl(url)) {
      return;
    }

    event.preventDefault();
  });
}

function applyLoginItemSettings(settings: AppSettings): void {
  app.setLoginItemSettings(buildLoginItemSettings(settings));
}

let isQuitting = false;
let trayEnabled = false;
let mainWindow: BrowserWindow | null = null;
let focusWidgetWindow: BrowserWindow | null = null;
const focusTimerCoordinator = createFocusTimerCoordinator();
const FOCUS_WIDGET_DEFAULT_HEIGHT = 48;
const FOCUS_WIDGET_DEFAULT_WIDTH = 188;
const FOCUS_WIDGET_MARGIN = 12;

function getFocusWidgetBounds() {
  const { workArea } = screen.getPrimaryDisplay();

  return {
    height: FOCUS_WIDGET_DEFAULT_HEIGHT,
    width: FOCUS_WIDGET_DEFAULT_WIDTH,
    x:
      workArea.x +
      workArea.width -
      FOCUS_WIDGET_DEFAULT_WIDTH -
      FOCUS_WIDGET_MARGIN,
    y: workArea.y + FOCUS_WIDGET_MARGIN,
  };
}

function clampFocusWidgetBounds(bounds: {
  height: number;
  width: number;
  x: number;
  y: number;
}) {
  const { workArea } = screen.getDisplayMatching(bounds);
  const minX = workArea.x + FOCUS_WIDGET_MARGIN;
  const minY = workArea.y + FOCUS_WIDGET_MARGIN;
  const maxX = Math.max(
    minX,
    workArea.x + workArea.width - bounds.width - FOCUS_WIDGET_MARGIN
  );
  const maxY = Math.max(
    minY,
    workArea.y + workArea.height - bounds.height - FOCUS_WIDGET_MARGIN
  );

  return {
    ...bounds,
    x: Math.min(Math.max(bounds.x, minX), maxX),
    y: Math.min(Math.max(bounds.y, minY), maxY),
  };
}

function resizeFocusWidget(width: number, height: number): void {
  if (!focusWidgetWindow || focusWidgetWindow.isDestroyed()) {
    return;
  }

  const [x, y] = focusWidgetWindow.getPosition();
  focusWidgetWindow.setBounds(
    clampFocusWidgetBounds({
      height,
      width,
      x,
      y,
    })
  );
}

function positionFocusWidgetWindow(widgetWindow: BrowserWindow): void {
  const bounds = widgetWindow.getBounds();

  widgetWindow.setBounds(
    clampFocusWidgetBounds({
      height: bounds.height,
      width: bounds.width,
      x: bounds.x,
      y: bounds.y,
    })
  );
}

function loadAppWindow(win: BrowserWindow, search = ""): void {
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(`${process.env.VITE_DEV_SERVER_URL}${search}`);
    return;
  }

  win.loadFile(path.join(__dirname, "../dist/index.html"), {
    search,
  });
}

function createWindow(): BrowserWindow {
  const shouldShowInactive =
    process.env.ZUCCHINI_ELECTRON_RESTART === "true" &&
    process.platform === "darwin";
  const icon =
    process.platform === "darwin" ? undefined : resolveRuntimeIconPath();
  const win = new BrowserWindow({
    backgroundColor: getWindowBackgroundColor(),
    height: 760,
    icon,
    minHeight: 640,
    minWidth: 900,
    show: !shouldShowInactive,
    title: "Zucchini",
    webPreferences: {
      contextIsolation: true,
      navigateOnDragDrop: false,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
      sandbox: true,
      webSecurity: true,
    },
    width: 1100,
  });
  mainWindow = win;

  configureWindowSecurity(win);
  win.on("close", (event) => {
    if (
      !shouldHideOnWindowClose({
        isQuitting,
        trayEnabled,
      })
    ) {
      return;
    }

    event.preventDefault();
    win.hide();
  });
  win.on("closed", () => {
    if (mainWindow === win) {
      mainWindow = null;
    }
  });

  if (shouldShowInactive) {
    win.once("ready-to-show", () => {
      win.showInactive();
    });
  }

  loadAppWindow(win);

  return win;
}

function createFocusWidgetWindow(): BrowserWindow {
  const icon =
    process.platform === "darwin" ? undefined : resolveRuntimeIconPath();
  const bounds = getFocusWidgetBounds();
  const win = new BrowserWindow({
    alwaysOnTop: true,
    backgroundColor: getWindowBackgroundColor(),
    frame: false,
    fullscreenable: false,
    height: bounds.height,
    hiddenInMissionControl: true,
    icon,
    maximizable: false,
    minimizable: false,
    resizable: false,
    show: false,
    skipTaskbar: true,
    title: "Zucchini Focus Widget",
    webPreferences: {
      contextIsolation: true,
      navigateOnDragDrop: false,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
      sandbox: true,
      webSecurity: true,
    },
    width: bounds.width,
    x: bounds.x,
    y: bounds.y,
  });
  focusWidgetWindow = win;

  configureWindowSecurity(win);
  win.setAlwaysOnTop(true, "floating");
  win.once("ready-to-show", () => {
    win.showInactive();
  });
  win.on("close", (event) => {
    if (isQuitting) {
      return;
    }

    event.preventDefault();
    win.hide();
  });
  win.on("closed", () => {
    if (focusWidgetWindow === win) {
      focusWidgetWindow = null;
    }
  });

  loadAppWindow(win, "?view=widget");

  return win;
}

function showFocusWidget(): void {
  const widgetWindow =
    focusWidgetWindow && !focusWidgetWindow.isDestroyed()
      ? focusWidgetWindow
      : createFocusWidgetWindow();

  positionFocusWidgetWindow(widgetWindow);
  widgetWindow.showInactive();
}

function showMainWindow(): void {
  const existingWindow =
    mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;

  if (existingWindow) {
    if (existingWindow.isMinimized()) {
      existingWindow.restore();
    }
    existingWindow.show();
    existingWindow.focus();
    return;
  }

  createWindow();
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

const service = new HabitService(new SqliteHabitRepository(), systemClock);
const reminders = createReminderScheduler({
  clock: systemClock,
  getTodayState: () => service.getTodayState(),
  loadState: () => service.getReminderRuntimeState(),
  saveState: (state) => {
    service.saveReminderRuntimeState(state);
  },
});
const tray = createAppTray({
  onOpen: showMainWindow,
  onOpenWidget: showFocusWidget,
  onQuit: () => {
    isQuitting = true;
    app.quit();
  },
  onSnooze: (settings) => reminders.snooze(settings),
});

function applyRuntimeSettings(settings: AppSettings): void {
  applyLoginItemSettings(settings);
  reminders.schedule(settings);
  applyThemeMode(settings.themeMode);
  tray.applySettings(settings);
  trayEnabled = settings.minimizeToTray;
}

function warmAppRuntime(): void {
  setTimeout(() => {
    try {
      const today = service.getTodayState();
      applyRuntimeSettings(today.settings);
    } catch (error) {
      console.error("Failed to warm app runtime.", error);
    }
  }, 0);
}

void app.whenReady().then(() => {
  Effect.runSync(
    Effect.sync(() => {
      if (process.platform === "darwin" && app.dock) {
        const icon = nativeImage.createFromPath(resolveRuntimeIconPath());
        if (!icon.isEmpty()) {
          app.dock.setIcon(icon);
        }
      }

      registerIpcHandlers({
        broadcastFocusSessionRecorded,
        focusTimerCoordinator,
        onResizeFocusWidget: resizeFocusWidget,
        onSettingsChanged: applyRuntimeSettings,
        onShowFocusWidget: showFocusWidget,
        onShowMainWindow: showMainWindow,
        service,
      });

      const appUpdater = registerAppUpdater({
        broadcastState: broadcastUpdateState,
        currentVersion: app.getVersion(),
        handleIpc: (channel, handler) => {
          ipcMain.handle(channel, async () => {
            try {
              return {
                data: await handler(),
                ok: true,
              };
            } catch (error) {
              console.error("App updater IPC failed.", error);

              return {
                error: serializeAppUpdaterIpcError(),
                ok: false,
              };
            }
          });
        },
        log: console,
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

      createWindow();
      createFocusWidgetWindow();
      warmAppRuntime();
      appUpdater.start();
    })
  );

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      return;
    }

    showMainWindow();
  });

  powerMonitor.on("resume", () => {
    reminders.schedule(service.getTodayState().settings);
  });
});

app.on("before-quit", () => {
  isQuitting = true;
  reminders.cancel();
  tray.destroy();
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
