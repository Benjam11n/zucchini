import { ipcMain } from "electron";

import {
  validateAppSettings,
  validateHabitCategory,
  validateHabitFrequency,
  validateHabitId,
  validateHabitName,
  validateNotificationBody,
  validateNotificationIconFilename,
  validateNotificationTitle,
  validateReorderHabitIds,
} from "@/main/ipc-validation";
import { showDesktopNotification } from "@/main/notifications";
import type { HabitsService } from "@/main/service";
import { HABITS_IPC_CHANNELS } from "@/shared/contracts/habits-ipc";
import type { AppSettings } from "@/shared/domain/settings";

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
  ipcMain.handle(HABITS_IPC_CHANNELS.toggleHabit, (_event, habitId: unknown) =>
    service.toggleHabit(validateHabitId(habitId))
  );
  ipcMain.handle(HABITS_IPC_CHANNELS.getHistory, () => service.getHistory());
  ipcMain.handle(
    HABITS_IPC_CHANNELS.updateSettings,
    (_event, settings: unknown) => {
      const nextSettings = service.updateSettings(
        validateAppSettings(settings)
      );
      onSettingsChanged(nextSettings);
      return nextSettings;
    }
  );
  ipcMain.handle(
    HABITS_IPC_CHANNELS.createHabit,
    (_event, name: unknown, category: unknown, frequency: unknown) =>
      service.createHabit(
        validateHabitName(name),
        validateHabitCategory(category),
        validateHabitFrequency(frequency)
      )
  );
  ipcMain.handle(
    HABITS_IPC_CHANNELS.renameHabit,
    (_event, habitId: unknown, name: unknown) =>
      service.renameHabit(validateHabitId(habitId), validateHabitName(name))
  );
  ipcMain.handle(
    HABITS_IPC_CHANNELS.updateHabitCategory,
    (_event, habitId: unknown, category: unknown) =>
      service.updateHabitCategory(
        validateHabitId(habitId),
        validateHabitCategory(category)
      )
  );
  ipcMain.handle(
    HABITS_IPC_CHANNELS.updateHabitFrequency,
    (_event, habitId: unknown, frequency: unknown) =>
      service.updateHabitFrequency(
        validateHabitId(habitId),
        validateHabitFrequency(frequency)
      )
  );
  ipcMain.handle(HABITS_IPC_CHANNELS.archiveHabit, (_event, habitId: unknown) =>
    service.archiveHabit(validateHabitId(habitId))
  );
  ipcMain.handle(
    HABITS_IPC_CHANNELS.reorderHabits,
    (_event, habitIds: unknown) =>
      service.reorderHabits(validateReorderHabitIds(habitIds))
  );
  ipcMain.handle(
    HABITS_IPC_CHANNELS.showNotification,
    (_event, title: unknown, body: unknown, iconFilename?: unknown) =>
      showDesktopNotification(
        validateNotificationTitle(title),
        validateNotificationBody(body),
        validateNotificationIconFilename(iconFilename)
      )
  );
}
