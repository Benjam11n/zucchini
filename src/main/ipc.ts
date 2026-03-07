import { ipcMain } from "electron";
import {
  getHistory,
  getTodayState,
  toggleHabit,
  updateReminderSettings,
} from "./db";
import type { ReminderSettings } from "../shared/domain/settings";

export function registerIpcHandlers(): void {
  ipcMain.handle("habits:getTodayState", () => getTodayState());
  ipcMain.handle("habits:toggleHabit", (_event, habitId: number) =>
    toggleHabit(habitId),
  );
  ipcMain.handle("habits:getHistory", () => getHistory());
  ipcMain.handle("habits:updateReminderSettings", (_event, settings: ReminderSettings) =>
    updateReminderSettings(settings),
  );
}
