import { ipcMain } from "electron";

import { serializeIpcError } from "@/main/ipc-errors";
import {
  validateAppSettings,
  validateDateKey,
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
import type { HabitsIpcResponse } from "@/shared/contracts/habits-ipc";
import type { AppSettings } from "@/shared/domain/settings";

interface RegisterIpcHandlersOptions {
  service: HabitsService;
  onSettingsChanged: (settings: AppSettings) => void;
}

function registerHandler<TArgs extends unknown[], TResult>(
  channel: string,
  handler: (...args: TArgs) => TResult | Promise<TResult>
): void {
  ipcMain.handle(
    channel,
    async (_event, ...args: TArgs): Promise<HabitsIpcResponse<TResult>> => {
      try {
        return {
          data: await handler(...args),
          ok: true,
        };
      } catch (error) {
        return {
          error: serializeIpcError(error),
          ok: false,
        };
      }
    }
  );
}

export function registerIpcHandlers({
  service,
  onSettingsChanged,
}: RegisterIpcHandlersOptions): void {
  registerHandler(HABITS_IPC_CHANNELS.getTodayState, () =>
    service.getTodayState()
  );
  registerHandler(HABITS_IPC_CHANNELS.toggleHabit, (habitId: unknown) =>
    service.toggleHabit(validateHabitId(habitId))
  );
  registerHandler(HABITS_IPC_CHANNELS.getHistory, () => service.getHistory());
  registerHandler(HABITS_IPC_CHANNELS.getWeeklyReviewOverview, () =>
    service.getWeeklyReviewOverview()
  );
  registerHandler(HABITS_IPC_CHANNELS.getWeeklyReview, (weekStart: unknown) =>
    service.getWeeklyReview(validateDateKey("review week", weekStart))
  );
  registerHandler(HABITS_IPC_CHANNELS.updateSettings, (settings: unknown) => {
    const nextSettings = service.updateSettings(validateAppSettings(settings));
    onSettingsChanged(nextSettings);
    return nextSettings;
  });
  registerHandler(
    HABITS_IPC_CHANNELS.createHabit,
    (name: unknown, category: unknown, frequency: unknown) =>
      service.createHabit(
        validateHabitName(name),
        validateHabitCategory(category),
        validateHabitFrequency(frequency)
      )
  );
  registerHandler(
    HABITS_IPC_CHANNELS.renameHabit,
    (habitId: unknown, name: unknown) =>
      service.renameHabit(validateHabitId(habitId), validateHabitName(name))
  );
  registerHandler(
    HABITS_IPC_CHANNELS.updateHabitCategory,
    (habitId: unknown, category: unknown) =>
      service.updateHabitCategory(
        validateHabitId(habitId),
        validateHabitCategory(category)
      )
  );
  registerHandler(
    HABITS_IPC_CHANNELS.updateHabitFrequency,
    (habitId: unknown, frequency: unknown) =>
      service.updateHabitFrequency(
        validateHabitId(habitId),
        validateHabitFrequency(frequency)
      )
  );
  registerHandler(HABITS_IPC_CHANNELS.archiveHabit, (habitId: unknown) =>
    service.archiveHabit(validateHabitId(habitId))
  );
  registerHandler(HABITS_IPC_CHANNELS.reorderHabits, (habitIds: unknown) =>
    service.reorderHabits(validateReorderHabitIds(habitIds))
  );
  registerHandler(
    HABITS_IPC_CHANNELS.showNotification,
    (title: unknown, body: unknown, iconFilename?: unknown) =>
      showDesktopNotification(
        validateNotificationTitle(title),
        validateNotificationBody(body),
        validateNotificationIconFilename(iconFilename)
      )
  );
}
