import { ipcMain } from "electron";

import type { ReminderSettings } from "../shared/domain/settings";
import type { HabitsService } from "./service";

interface RegisterIpcHandlersOptions {
  service: HabitsService;
  onReminderSettingsChanged: (settings: ReminderSettings) => void;
}

export function registerIpcHandlers({
  service,
  onReminderSettingsChanged,
}: RegisterIpcHandlersOptions): void {
  ipcMain.handle("habits:getTodayState", () => service.getTodayState());
  ipcMain.handle("habits:toggleHabit", (_event, habitId: number) =>
    service.toggleHabit(habitId)
  );
  ipcMain.handle("habits:getHistory", () => service.getHistory());
  ipcMain.handle(
    "habits:updateReminderSettings",
    (_event, settings: ReminderSettings) => {
      const nextSettings = service.updateReminderSettings(settings);
      onReminderSettingsChanged(nextSettings);
      return nextSettings;
    }
  );
  ipcMain.handle("habits:createHabit", (_event, name: string) =>
    service.createHabit(name)
  );
  ipcMain.handle(
    "habits:renameHabit",
    (_event, habitId: number, name: string) =>
      service.renameHabit(habitId, name)
  );
  ipcMain.handle("habits:archiveHabit", (_event, habitId: number) =>
    service.archiveHabit(habitId)
  );
  ipcMain.handle("habits:reorderHabits", (_event, habitIds: number[]) =>
    service.reorderHabits(habitIds)
  );
}
