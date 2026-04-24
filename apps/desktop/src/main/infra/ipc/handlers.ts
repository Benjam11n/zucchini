/**
 * IPC handler registration for the main process.
 *
 * Maps every IPC channel defined in `HABITS_IPC_CHANNELS` to a handler that
 * validates input, calls the appropriate service or coordinator method, and
 * wraps the result in a typed `HabitsIpcResponse`. Broadcast callbacks are
 * used for push events (focus session recorded, timer state changed).
 */
import { ipcMain } from "electron";

import type { FocusTimerCoordinator } from "@/main/features/focus/timer-coordinator";
import type { HabitsService } from "@/main/features/habits/habits-application-service";
import {
  getDesktopNotificationStatus,
  showDesktopNotification,
} from "@/main/features/reminders/notifications";
import { serializeIpcError } from "@/main/infra/ipc/errors";
import {
  validateFocusTimerCycleId,
  validateFocusTimerInstanceId,
  validateFocusTimerLeaseTtl,
  validateFocusWidgetSize,
  validateHabitCommand,
  validateHabitQuery,
  validateNotificationBody,
  validateNotificationIconFilename,
  validateNotificationTitle,
} from "@/main/infra/ipc/validation";
import { HABITS_IPC_CHANNELS } from "@/shared/contracts/habits-ipc";
import type {
  HabitCommand,
  HabitCommandResult,
  FocusTimerShortcutStatus,
  HabitsIpcResponse,
  HabitQueryResult,
  TodayState,
} from "@/shared/contracts/habits-ipc";
import type { FocusSession } from "@/shared/domain/focus-session";
import type { PersistedFocusTimerState } from "@/shared/domain/focus-timer";
import type { AppSettings } from "@/shared/domain/settings";

interface RegisterIpcHandlersOptions {
  broadcastFocusSessionRecorded: (session: FocusSession) => void;
  broadcastFocusTimerStateChanged: (state: PersistedFocusTimerState) => void;
  getFocusTimerShortcutStatus: () => FocusTimerShortcutStatus;
  onClearData: () => Promise<boolean>;
  onExportBackup: () => Promise<string | null>;
  onImportBackup: () => Promise<boolean>;
  onOpenDataFolder: () => Promise<string>;
  focusTimerCoordinator: FocusTimerCoordinator;
  onResizeFocusWidget: (width: number, height: number) => void;
  onShowFocusWidget: () => void;
  onShowMainWindow: () => void;
  service: HabitsService;
  onSettingsChanged: (settings: AppSettings) => void;
  onWindDownChanged?: (todayState: TodayState) => void;
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
  broadcastFocusTimerStateChanged,
  focusTimerCoordinator,
  getFocusTimerShortcutStatus,
  onClearData,
  onExportBackup,
  onImportBackup,
  onOpenDataFolder,
  onResizeFocusWidget,
  onShowFocusWidget,
  onShowMainWindow,
  service,
  onSettingsChanged,
  onWindDownChanged,
}: RegisterIpcHandlersOptions): void {
  function emitWindDownChanged(todayState: TodayState): TodayState {
    onWindDownChanged?.(todayState);
    return todayState;
  }

  function runCommand(command: HabitCommand): HabitCommandResult {
    const result = service.execute(command);

    if (command.type === "focusSession.record") {
      broadcastFocusSessionRecorded(result as FocusSession);
    }

    if (command.type === "focusTimer.saveState") {
      broadcastFocusTimerStateChanged(result as PersistedFocusTimerState);
    }

    if (command.type === "settings.update") {
      onSettingsChanged(result as AppSettings);
    }

    if (command.type.startsWith("windDown.")) {
      emitWindDownChanged(result as TodayState);
    }

    return result;
  }

  registerHandler(HABITS_IPC_CHANNELS.command, (command: unknown) =>
    runCommand(validateHabitCommand(command))
  );
  registerHandler(
    HABITS_IPC_CHANNELS.query,
    (query: unknown): HabitQueryResult =>
      service.read(validateHabitQuery(query))
  );

  registerHandler(HABITS_IPC_CHANNELS.getDesktopNotificationStatus, () =>
    getDesktopNotificationStatus()
  );
  registerHandler(HABITS_IPC_CHANNELS.getFocusTimerShortcutStatus, () =>
    getFocusTimerShortcutStatus()
  );
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
  registerHandler(HABITS_IPC_CHANNELS.clearData, () => onClearData());
  registerHandler(HABITS_IPC_CHANNELS.openDataFolder, () => onOpenDataFolder());
  registerHandler(HABITS_IPC_CHANNELS.exportBackup, () => onExportBackup());
  registerHandler(HABITS_IPC_CHANNELS.importBackup, () => onImportBackup());
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
