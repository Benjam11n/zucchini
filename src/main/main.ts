import path from "node:path";
import { app, BrowserWindow } from "electron";
import { Effect } from "effect";
import { initializeDatabase, getTodayState } from "./db";
import { registerIpcHandlers } from "./ipc";
import { scheduleReminder } from "./scheduler";

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 900,
    minHeight: 640,
    backgroundColor: "#f7f3e8",
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.mjs"),
    },
    title: "Zucchini",
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

void app.whenReady().then(() => {
  Effect.runSync(
    Effect.sync(() => {
      initializeDatabase();
      registerIpcHandlers();

      const today = getTodayState();
      scheduleReminder(today.settings);
      createWindow();
    }),
  );

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
