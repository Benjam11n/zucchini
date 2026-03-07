import path from "node:path";

import { Effect } from "effect";
import { app, BrowserWindow } from "electron";

import { systemClock } from "./clock";
import { registerIpcHandlers } from "./ipc";
import { SqliteHabitRepository } from "./repository";
import { createReminderScheduler } from "./scheduler";
import { HabitService } from "./service";

function createWindow(): void {
  const win = new BrowserWindow({
    backgroundColor: "#f7f3e8",
    height: 760,
    minHeight: 640,
    minWidth: 900,
    title: "Zucchini",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    width: 1100,
  });

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
        onReminderSettingsChanged: (settings) => reminders.schedule(settings),
        service,
      });

      const today = service.getTodayState();
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
