import { ipcMain } from "electron";

import { HABITS_IPC_CHANNELS } from "../shared/contracts/habits-ipc";
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
  ipcMain.handle(HABITS_IPC_CHANNELS.getTodayState, () =>
    service.getTodayState()
  );
  ipcMain.handle(HABITS_IPC_CHANNELS.toggleHabit, (_event, habitId: number) =>
    service.toggleHabit(habitId)
  );
  ipcMain.handle(HABITS_IPC_CHANNELS.getHistory, () => service.getHistory());
  ipcMain.handle(
    HABITS_IPC_CHANNELS.updateSettings,
    (_event, settings: AppSettings) => {
      const nextSettings = service.updateSettings(settings);
      onSettingsChanged(nextSettings);
      return nextSettings;
    }
  );
  ipcMain.handle(
    HABITS_IPC_CHANNELS.createHabit,
    (
      _event,
      name: string,
      category: HabitCategory,
      frequency: HabitFrequency
    ) => service.createHabit(name, category, frequency)
  );
  ipcMain.handle(
    HABITS_IPC_CHANNELS.renameHabit,
    (_event, habitId: number, name: string) =>
      service.renameHabit(habitId, name)
  );
  ipcMain.handle(
    HABITS_IPC_CHANNELS.updateHabitCategory,
    (_event, habitId: number, category: HabitCategory) =>
      service.updateHabitCategory(habitId, category)
  );
  ipcMain.handle(
    HABITS_IPC_CHANNELS.updateHabitFrequency,
    (_event, habitId: number, frequency: HabitFrequency) =>
      service.updateHabitFrequency(habitId, frequency)
  );
  ipcMain.handle(HABITS_IPC_CHANNELS.archiveHabit, (_event, habitId: number) =>
    service.archiveHabit(habitId)
  );
  ipcMain.handle(
    HABITS_IPC_CHANNELS.reorderHabits,
    (_event, habitIds: number[]) => service.reorderHabits(habitIds)
  );
  ipcMain.handle(
    HABITS_IPC_CHANNELS.showNotification,
    (_event, title: string, body: string, iconFilename?: string) =>
      showDesktopNotification(title, body, iconFilename)
  );
}
