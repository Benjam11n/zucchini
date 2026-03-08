import { ipcMain } from "electron";

import type { HabitCategory, HabitFrequency } from "../shared/domain/habit";
import type { AppSettings } from "../shared/domain/settings";
import { showDesktopNotification } from "./notifications";
import type { HabitsService } from "./service";

interface RegisterIpcHandlersOptions {
  service: HabitsService;
  onSettingsChanged: (settings: AppSettings) => void;
}

export function registerIpcHandlers({
  service,
  onSettingsChanged,
}: RegisterIpcHandlersOptions): void {
  ipcMain.handle("habits:getTodayState", () => service.getTodayState());
  ipcMain.handle("habits:toggleHabit", (_event, habitId: number) =>
    service.toggleHabit(habitId)
  );
  ipcMain.handle("habits:getHistory", () => service.getHistory());
  ipcMain.handle("habits:updateSettings", (_event, settings: AppSettings) => {
    const nextSettings = service.updateSettings(settings);
    onSettingsChanged(nextSettings);
    return nextSettings;
  });
  ipcMain.handle(
    "habits:createHabit",
    (
      _event,
      name: string,
      category: HabitCategory,
      frequency: HabitFrequency
    ) => service.createHabit(name, category, frequency)
  );
  ipcMain.handle(
    "habits:renameHabit",
    (_event, habitId: number, name: string) =>
      service.renameHabit(habitId, name)
  );
  ipcMain.handle(
    "habits:updateHabitCategory",
    (_event, habitId: number, category: HabitCategory) =>
      service.updateHabitCategory(habitId, category)
  );
  ipcMain.handle(
    "habits:updateHabitFrequency",
    (_event, habitId: number, frequency: HabitFrequency) =>
      service.updateHabitFrequency(habitId, frequency)
  );
  ipcMain.handle("habits:archiveHabit", (_event, habitId: number) =>
    service.archiveHabit(habitId)
  );
  ipcMain.handle("habits:reorderHabits", (_event, habitIds: number[]) =>
    service.reorderHabits(habitIds)
  );
  ipcMain.handle(
    "habits:showNotification",
    (_event, title: string, body: string, iconFilename?: string) =>
      showDesktopNotification(title, body, iconFilename)
  );
}
