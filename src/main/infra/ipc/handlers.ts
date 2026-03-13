import { ipcMain } from "electron";

import type { FocusTimerCoordinator } from "@/main/features/focus/timer-coordinator";
import { showDesktopNotification } from "@/main/features/reminders/notifications";
import { serializeIpcError } from "@/main/infra/ipc/errors";
import {
  validateAppSettings,
  validateFocusTimerCycleId,
  validateFocusTimerInstanceId,
  validateFocusTimerLeaseTtl,
  validateFocusWidgetSize,
  validateCreateFocusSessionInput,
  validateCompleteOnboardingInput,
  validateDateKey,
  validateFocusSessionLimit,
  validateHabitCategory,
  validateHabitFrequency,
  validateHabitId,
  validateHistoryLimit,
  validateHabitName,
  validateNotificationBody,
  validateNotificationIconFilename,
  validateNotificationTitle,
  validateReorderHabitIds,
  validateStarterPackApply,
} from "@/main/infra/ipc/validation";
import type { HabitsService } from "@/main/service";
import { HABITS_IPC_CHANNELS } from "@/shared/contracts/habits-ipc";
import type { HabitsIpcResponse } from "@/shared/contracts/habits-ipc";
import type { FocusSession } from "@/shared/domain/focus-session";
import type { AppSettings } from "@/shared/domain/settings";

interface RegisterIpcHandlersOptions {
  broadcastFocusSessionRecorded: (session: FocusSession) => void;
  focusTimerCoordinator: FocusTimerCoordinator;
  onResizeFocusWidget: (width: number, height: number) => void;
  onShowFocusWidget: () => void;
  onShowMainWindow: () => void;
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
  broadcastFocusSessionRecorded,
  focusTimerCoordinator,
  onResizeFocusWidget,
  onShowFocusWidget,
  onShowMainWindow,
  service,
  onSettingsChanged,
}: RegisterIpcHandlersOptions): void {
  registerHandler(HABITS_IPC_CHANNELS.getOnboardingStatus, () =>
    service.getOnboardingStatus()
  );
  registerHandler(HABITS_IPC_CHANNELS.getTodayState, () =>
    service.getTodayState()
  );
  registerHandler(HABITS_IPC_CHANNELS.toggleHabit, (habitId: unknown) =>
    service.toggleHabit(validateHabitId(habitId))
  );
  registerHandler(HABITS_IPC_CHANNELS.getFocusSessions, (limit?: unknown) =>
    service.getFocusSessions(validateFocusSessionLimit(limit))
  );
  registerHandler(HABITS_IPC_CHANNELS.recordFocusSession, (input: unknown) => {
    const focusSession = service.recordFocusSession(
      validateCreateFocusSessionInput(input)
    );

    broadcastFocusSessionRecorded(focusSession);

    return focusSession;
  });
  registerHandler(
    HABITS_IPC_CHANNELS.claimFocusTimerCycleCompletion,
    (cycleId: unknown) =>
      focusTimerCoordinator.claimCycleCompletion(
        validateFocusTimerCycleId(cycleId)
      )
  );
  registerHandler(
    HABITS_IPC_CHANNELS.claimFocusTimerLeadership,
    (instanceId: unknown, ttlMs: unknown) =>
      focusTimerCoordinator.claimLeadership(
        validateFocusTimerInstanceId(instanceId),
        validateFocusTimerLeaseTtl(ttlMs)
      )
  );
  registerHandler(
    HABITS_IPC_CHANNELS.releaseFocusTimerLeadership,
    (instanceId: unknown) =>
      focusTimerCoordinator.releaseLeadership(
        validateFocusTimerInstanceId(instanceId)
      )
  );
  registerHandler(
    HABITS_IPC_CHANNELS.resizeFocusWidget,
    (width: unknown, height: unknown) =>
      onResizeFocusWidget(
        validateFocusWidgetSize(width),
        validateFocusWidgetSize(height)
      )
  );
  registerHandler(HABITS_IPC_CHANNELS.showFocusWidget, () =>
    onShowFocusWidget()
  );
  registerHandler(HABITS_IPC_CHANNELS.showMainWindow, () => onShowMainWindow());
  registerHandler(HABITS_IPC_CHANNELS.getHistory, (limit?: unknown) =>
    service.getHistory(validateHistoryLimit(limit))
  );
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
  registerHandler(HABITS_IPC_CHANNELS.completeOnboarding, (input: unknown) => {
    const todayState = service.completeOnboarding(
      validateCompleteOnboardingInput(input)
    );
    onSettingsChanged(todayState.settings);
    return todayState;
  });
  registerHandler(HABITS_IPC_CHANNELS.skipOnboarding, () =>
    service.skipOnboarding()
  );
  registerHandler(HABITS_IPC_CHANNELS.applyStarterPack, (habits: unknown) =>
    service.applyStarterPack(validateStarterPackApply(habits))
  );
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
