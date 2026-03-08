import path from "node:path";

import { Effect } from "effect";
import {
  app,
  BrowserWindow,
  nativeImage,
  nativeTheme,
  powerMonitor,
} from "electron";

import { resolveRuntimeIconPath } from "@/main/assets";
import { systemClock } from "@/main/clock";
import { registerIpcHandlers } from "@/main/ipc";
import {
  buildLoginItemSettings,
  shouldHideOnWindowClose,
  shouldQuitWhenAllWindowsClosed,
} from "@/main/lifecycle";
import { SqliteHabitRepository } from "@/main/repository";
import { createReminderScheduler } from "@/main/scheduler";
import { HabitService } from "@/main/service";
import { createAppTray } from "@/main/tray";
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

function createWindow(): void {
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

  if (shouldShowInactive) {
    win.once("ready-to-show", () => {
      win.showInactive();
    });
  }

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

function showMainWindow(): void {
  const [existingWindow] = BrowserWindow.getAllWindows();
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
  onQuit: () => {
    isQuitting = true;
    app.quit();
  },
  onSnooze: (settings) => reminders.snooze(settings),
});

void app.whenReady().then(() => {
  Effect.runSync(
    Effect.sync(() => {
      service.initialize();

      if (process.platform === "darwin" && app.dock) {
        const icon = nativeImage.createFromPath(resolveRuntimeIconPath());
        if (!icon.isEmpty()) {
          app.dock.setIcon(icon);
        }
      }

      registerIpcHandlers({
        onSettingsChanged: (settings) => {
          applyLoginItemSettings(settings);
          reminders.schedule(settings);
          applyThemeMode(settings.themeMode);
          tray.applySettings(settings);
          trayEnabled = settings.minimizeToTray;
        },
        service,
      });

      const today = service.getTodayState();
      applyLoginItemSettings(today.settings);
      applyThemeMode(today.settings.themeMode);
      reminders.schedule(today.settings);
      tray.applySettings(today.settings);
      trayEnabled = today.settings.minimizeToTray;
      createWindow();
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
