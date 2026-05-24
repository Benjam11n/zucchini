/**
 * Electron preload bridge.
 *
 * The preload script is the safe boundary between the renderer and Electron.
 * It exposes a narrow, typed API for app and updater actions without
 * giving React direct access to privileged Electron objects.
 */
import { contextBridge, ipcRenderer } from "electron";
import type { IpcRendererEvent } from "electron";

import type {
  FocusTimerShortcutStatus,
  DesktopApi,
} from "@/shared/contracts/api/desktop-api";
import {
  APP_UPDATER_CHANNELS,
  AppUpdaterIpcError,
} from "@/shared/contracts/app-updater";
import type {
  AppUpdateState,
  AppUpdaterApi,
  AppUpdaterIpcResponse,
} from "@/shared/contracts/app-updater";
import { APP_IPC_CHANNELS } from "@/shared/contracts/ipc/app-channels";
import type {
  AppCommand,
  ResultForAppCommand,
} from "@/shared/contracts/ipc/app-command-registry";
import { AppIpcError } from "@/shared/contracts/ipc/app-errors";
import type { AppIpcResponse } from "@/shared/contracts/ipc/app-errors";
import type {
  AppQuery,
  ResultForAppQuery,
} from "@/shared/contracts/ipc/app-query-registry";

async function invokeDesktop<T>(
  channel: string,
  ...args: unknown[]
): Promise<T> {
  const response = (await ipcRenderer.invoke(
    channel,
    ...args
  )) as AppIpcResponse<T>;

  if (response.ok) {
    return response.data;
  }

  throw new AppIpcError(response.error);
}

async function invokeUpdater<T>(channel: string): Promise<T> {
  const response = (await ipcRenderer.invoke(
    channel
  )) as AppUpdaterIpcResponse<T>;

  if (response.ok) {
    return response.data;
  }

  throw new AppUpdaterIpcError(response.error);
}

function subscribeToChannel<T>(
  channel: string,
  listener: (payload: T) => void
): () => void {
  const handleChannelEvent = (_event: IpcRendererEvent, payload: T) => {
    listener(payload);
  };

  ipcRenderer.on(channel, handleChannelEvent);

  return () => {
    ipcRenderer.removeListener(channel, handleChannelEvent);
  };
}

function subscribeToChannelWithoutPayload(
  channel: string,
  listener: () => void
): () => void {
  const handleChannelEvent = () => {
    listener();
  };

  ipcRenderer.on(channel, handleChannelEvent);

  return () => {
    ipcRenderer.removeListener(channel, handleChannelEvent);
  };
}

const desktopApi: DesktopApi = {
  chooseBackupForRestore: () =>
    invokeDesktop(APP_IPC_CHANNELS.chooseBackupForRestore),
  claimFocusTimerCycleCompletion: (cycleId: string) =>
    invokeDesktop(APP_IPC_CHANNELS.claimFocusTimerCycleCompletion, cycleId),
  claimFocusTimerLeadership: (instanceId: string, ttlMs: number) =>
    invokeDesktop(
      APP_IPC_CHANNELS.claimFocusTimerLeadership,
      instanceId,
      ttlMs
    ),
  clearData: () => invokeDesktop(APP_IPC_CHANNELS.clearData),
  command: <C extends AppCommand>(command: C) =>
    invokeDesktop<ResultForAppCommand<C>>(APP_IPC_CHANNELS.command, command),
  exportBackup: () => invokeDesktop(APP_IPC_CHANNELS.exportBackup),
  exportCsvData: () => invokeDesktop(APP_IPC_CHANNELS.exportCsvData),
  getDesktopNotificationStatus: () =>
    invokeDesktop(APP_IPC_CHANNELS.getDesktopNotificationStatus),
  getFocusTimerShortcutStatus: () =>
    invokeDesktop<FocusTimerShortcutStatus>(
      APP_IPC_CHANNELS.getFocusTimerShortcutStatus
    ),
  getLatestAutoBackupRestorePreview: () =>
    invokeDesktop(APP_IPC_CHANNELS.getLatestAutoBackupRestorePreview),
  importBackup: () => invokeDesktop(APP_IPC_CHANNELS.importBackup),
  onFocusSessionRecorded: (listener) =>
    subscribeToChannel(APP_IPC_CHANNELS.focusSessionRecorded, listener),
  onFocusTimerActionRequested: (listener) =>
    subscribeToChannel(APP_IPC_CHANNELS.focusTimerActionRequested, listener),
  onFocusTimerShortcutStatusChanged: (listener) =>
    subscribeToChannel(
      APP_IPC_CHANNELS.focusTimerShortcutStatusChanged,
      listener
    ),
  onFocusTimerStateChanged: (listener) =>
    subscribeToChannel(APP_IPC_CHANNELS.focusTimerStateChanged, listener),
  onWindDownNavigationRequested: (listener) =>
    subscribeToChannelWithoutPayload(
      APP_IPC_CHANNELS.windDownNavigationRequested,
      listener
    ),
  openAutoBackupFolder: () =>
    invokeDesktop(APP_IPC_CHANNELS.openAutoBackupFolder),
  openDataFolder: () => invokeDesktop(APP_IPC_CHANNELS.openDataFolder),
  query: <Q extends AppQuery>(query: Q) =>
    invokeDesktop<ResultForAppQuery<Q>>(APP_IPC_CHANNELS.query, query),
  releaseFocusTimerLeadership: (instanceId: string) =>
    invokeDesktop(APP_IPC_CHANNELS.releaseFocusTimerLeadership, instanceId),
  resizeFocusWidget: (width: number, height: number) =>
    invokeDesktop(APP_IPC_CHANNELS.resizeFocusWidget, width, height),
  restoreBackup: (restoreId: string) =>
    invokeDesktop(APP_IPC_CHANNELS.restoreBackup, restoreId),
  showFocusWidget: () => invokeDesktop(APP_IPC_CHANNELS.showFocusWidget),
  showMainWindow: () => invokeDesktop(APP_IPC_CHANNELS.showMainWindow),
  showNotification: (title: string, body: string, iconFilename?: string) =>
    invokeDesktop(APP_IPC_CHANNELS.showNotification, title, body, iconFilename),
};

const updaterApi: AppUpdaterApi = {
  checkForUpdates: () => invokeUpdater(APP_UPDATER_CHANNELS.checkForUpdates),
  downloadUpdate: () => invokeUpdater(APP_UPDATER_CHANNELS.downloadUpdate),
  getState: () => invokeUpdater<AppUpdateState>(APP_UPDATER_CHANNELS.getState),
  installUpdate: () => invokeUpdater(APP_UPDATER_CHANNELS.installUpdate),
  onStateChange: (listener) =>
    subscribeToChannel(APP_UPDATER_CHANNELS.stateChanged, listener),
};

contextBridge.exposeInMainWorld("desktop", desktopApi);
contextBridge.exposeInMainWorld("updater", updaterApi);
