import path from "node:path";

import { Effect } from "effect";
import { app, BrowserWindow, nativeTheme } from "electron";

import type { ThemeMode } from "../shared/domain/settings";
import { systemClock } from "./clock";
import { registerIpcHandlers } from "./ipc";
import { SqliteHabitRepository } from "./repository";
import { createReminderScheduler } from "./scheduler";
import { HabitService } from "./service";

function getWindowBackgroundColor(): string {
  return nativeTheme.shouldUseDarkColors ? "#18231e" : "#f7f3e8";
}

function applyThemeMode(themeMode: ThemeMode): void {
  nativeTheme.themeSource = themeMode;

  for (const window of BrowserWindow.getAllWindows()) {
    window.setBackgroundColor(getWindowBackgroundColor());
  }
}

function createWindow(): void {
  const shouldShowInactive =
    process.env.ZUCCHINI_ELECTRON_RESTART === "true" &&
    process.platform === "darwin";
  const win = new BrowserWindow({
    backgroundColor: getWindowBackgroundColor(),
    height: 760,
    minHeight: 640,
    minWidth: 900,
    show: !shouldShowInactive,
    title: "Zucchini",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    width: 1100,
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

const service = new HabitService(new SqliteHabitRepository(), systemClock);
const reminders = createReminderScheduler(() => service.getTodayState());

void app.whenReady().then(() => {
  Effect.runSync(
    Effect.sync(() => {
      service.initialize();

      registerIpcHandlers({
        onSettingsChanged: (settings) => {
          reminders.schedule(settings);
          applyThemeMode(settings.themeMode);
        },
        service,
      });

      const today = service.getTodayState();
      applyThemeMode(today.settings.themeMode);
      reminders.schedule(today.settings);
      createWindow();
    })
  );

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  reminders.cancel();

  if (process.platform !== "darwin") {
    app.quit();
  }
});
