/**
 * IPC handler registration for the main process.
 *
 * Maps every IPC channel defined in `APP_IPC_CHANNELS` to a handler that
 * validates input, calls the appropriate service or coordinator method, and
 * wraps the result in a typed `AppIpcResponse`. Broadcast callbacks are
 * used for push events (focus session recorded, timer state changed).
 */
import { ipcMain } from "electron";

import type { FocusTimerCoordinator } from "@/main/features/focus/timer-coordinator";
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
  validateBackupRestoreId,
  validateAppCommand,
  validateAppQuery,
  validateNotificationBody,
  validateNotificationIconFilename,
  validateNotificationTitle,
} from "@/main/infra/ipc/validation";
import type { ApplicationService } from "@/main/ports/application-service";
import type {
  BackupRestorePreview,
  FocusTimerShortcutStatus,
} from "@/shared/contracts/api/desktop-api";
import { APP_IPC_CHANNELS } from "@/shared/contracts/ipc/app-channels";
import type {
  AppCommand,
  AppCommandResult,
} from "@/shared/contracts/ipc/app-command-registry";
import type { AppIpcResponse } from "@/shared/contracts/ipc/app-errors";
import type { AppQueryResult } from "@/shared/contracts/ipc/app-query-registry";
import type { FocusSession } from "@/shared/domain/focus-session";
import type { PersistedFocusTimerState } from "@/shared/domain/focus-timer";
import type { AppSettings } from "@/shared/domain/settings";
import type { TodayState } from "@/shared/read-models/today-state";

interface RegisterIpcHandlersOptions {
  broadcastFocusSessionRecorded: (session: FocusSession) => void;
  broadcastFocusTimerStateChanged: (state: PersistedFocusTimerState) => void;
  getFocusTimerShortcutStatus: () => FocusTimerShortcutStatus;
  onClearData: () => Promise<boolean>;
  onChooseBackupForRestore: () => Promise<BackupRestorePreview | null>;
  onExportBackup: () => Promise<string | null>;
  onExportCsvData: () => Promise<string | null>;
  onGetLatestAutoBackupRestorePreview: () =>
    | BackupRestorePreview
    | null
    | Promise<BackupRestorePreview | null>;
  onImportBackup: () => Promise<boolean>;
  onOpenAutoBackupFolder: () => Promise<string>;
  onOpenDataFolder: () => Promise<string>;
  focusTimerCoordinator: FocusTimerCoordinator;
  onResizeFocusWidget: (width: number, height: number) => void;
  onRestoreBackup: (restoreId: string) => Promise<boolean>;
  onShowFocusWidget: () => void;
  onShowMainWindow: () => void;
  service: ApplicationService;
  onSettingsChanged: (settings: AppSettings) => void;
  onWindDownChanged?: (todayState: TodayState) => void;
}

function registerHandler<TArgs extends unknown[], TResult>(
  channel: string,
  handler: (...args: TArgs) => TResult | Promise<TResult>
): void {
  ipcMain.handle(
    channel,
    async (_event, ...args: TArgs): Promise<AppIpcResponse<TResult>> => {
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
  onChooseBackupForRestore,
  onExportBackup,
  onExportCsvData,
  onGetLatestAutoBackupRestorePreview,
  onImportBackup,
  onOpenAutoBackupFolder,
  onOpenDataFolder,
  onResizeFocusWidget,
  onRestoreBackup,
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

  function runCommand(command: AppCommand): AppCommandResult {
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

  registerHandler(APP_IPC_CHANNELS.command, (command: unknown) =>
    runCommand(validateAppCommand(command))
  );
  registerHandler(
    APP_IPC_CHANNELS.query,
    (query: unknown): AppQueryResult => service.read(validateAppQuery(query))
  );

  registerHandler(APP_IPC_CHANNELS.getDesktopNotificationStatus, () =>
    getDesktopNotificationStatus()
  );
  registerHandler(APP_IPC_CHANNELS.getFocusTimerShortcutStatus, () =>
    getFocusTimerShortcutStatus()
  );
  registerHandler(
    APP_IPC_CHANNELS.claimFocusTimerCycleCompletion,
    (cycleId: unknown) =>
      focusTimerCoordinator.claimCycleCompletion(
        validateFocusTimerCycleId(cycleId)
      )
  );
  registerHandler(
    APP_IPC_CHANNELS.claimFocusTimerLeadership,
    (instanceId: unknown, ttlMs: unknown) =>
      focusTimerCoordinator.claimLeadership(
        validateFocusTimerInstanceId(instanceId),
        validateFocusTimerLeaseTtl(ttlMs)
      )
  );
  registerHandler(
    APP_IPC_CHANNELS.releaseFocusTimerLeadership,
    (instanceId: unknown) =>
      focusTimerCoordinator.releaseLeadership(
        validateFocusTimerInstanceId(instanceId)
      )
  );
  registerHandler(
    APP_IPC_CHANNELS.resizeFocusWidget,
    (width: unknown, height: unknown) =>
      onResizeFocusWidget(
        validateFocusWidgetSize(width),
        validateFocusWidgetSize(height)
      )
  );
  registerHandler(APP_IPC_CHANNELS.showFocusWidget, () => onShowFocusWidget());
  registerHandler(APP_IPC_CHANNELS.showMainWindow, () => onShowMainWindow());
  registerHandler(APP_IPC_CHANNELS.clearData, () => onClearData());
  registerHandler(APP_IPC_CHANNELS.chooseBackupForRestore, () =>
    onChooseBackupForRestore()
  );
  registerHandler(APP_IPC_CHANNELS.getLatestAutoBackupRestorePreview, () =>
    onGetLatestAutoBackupRestorePreview()
  );
  registerHandler(APP_IPC_CHANNELS.openAutoBackupFolder, () =>
    onOpenAutoBackupFolder()
  );
  registerHandler(APP_IPC_CHANNELS.openDataFolder, () => onOpenDataFolder());
  registerHandler(APP_IPC_CHANNELS.exportBackup, () => onExportBackup());
  registerHandler(APP_IPC_CHANNELS.exportCsvData, () => onExportCsvData());
  registerHandler(APP_IPC_CHANNELS.importBackup, () => onImportBackup());
  registerHandler(APP_IPC_CHANNELS.restoreBackup, (restoreId: unknown) =>
    onRestoreBackup(validateBackupRestoreId(restoreId))
  );
  registerHandler(
    APP_IPC_CHANNELS.showNotification,
    (title: unknown, body: unknown, iconFilename?: unknown) =>
      showDesktopNotification(
        validateNotificationTitle(title),
        validateNotificationBody(body),
        validateNotificationIconFilename(iconFilename)
      )
  );
}
