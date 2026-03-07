import { ipcMain } from "electron";
import {
  archiveHabit,
  createHabit,
  getHistory,
  getTodayState,
  renameHabit,
  reorderHabits,
  toggleHabit,
  updateReminderSettings,
} from "./db";
import type { ReminderSettings } from "../shared/domain/settings";
import { scheduleReminder } from "./scheduler";

export function registerIpcHandlers(): void {
  ipcMain.handle("habits:getTodayState", () => getTodayState());
  ipcMain.handle("habits:toggleHabit", (_event, habitId: number) => toggleHabit(habitId));
  ipcMain.handle("habits:getHistory", () => getHistory());
  ipcMain.handle("habits:updateReminderSettings", (_event, settings: ReminderSettings) => {
    const nextSettings = updateReminderSettings(settings);
    scheduleReminder(nextSettings);
    return nextSettings;
  });
  ipcMain.handle("habits:createHabit", (_event, name: string) => createHabit(name));
  ipcMain.handle("habits:renameHabit", (_event, habitId: number, name: string) =>
    renameHabit(habitId, name),
  );
  ipcMain.handle("habits:archiveHabit", (_event, habitId: number) => archiveHabit(habitId));
  ipcMain.handle("habits:reorderHabits", (_event, habitIds: number[]) => reorderHabits(habitIds));
}
