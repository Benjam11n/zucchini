/**
 * Electron preload bridge.
 *
 * The preload script is the safe boundary between the renderer and Electron.
 * It exposes a narrow, typed API for habits and updater actions without
 * giving React direct access to privileged Electron objects.
 */
import { contextBridge, ipcRenderer } from "electron";
import type { IpcRendererEvent } from "electron";

import {
  APP_UPDATER_CHANNELS,
  AppUpdaterIpcError,
} from "@/shared/contracts/app-updater";
import type {
  AppUpdateState,
  AppUpdaterApi,
  AppUpdaterIpcResponse,
} from "@/shared/contracts/app-updater";
import {
  HABITS_IPC_CHANNELS,
  HabitsIpcError,
} from "@/shared/contracts/habits-ipc";
import type {
  HabitCommand,
  HabitCommandResult,
  FocusTimerShortcutStatus,
  HabitsApi,
  HabitsIpcResponse,
  HabitQuery,
  HabitQueryResult,
} from "@/shared/contracts/habits-ipc";

async function invokeHabits<T>(
  channel: string,
  ...args: unknown[]
): Promise<T> {
  const response = (await ipcRenderer.invoke(
    channel,
    ...args
  )) as HabitsIpcResponse<T>;

  if (response.ok) {
    return response.data;
  }

  throw new HabitsIpcError(response.error);
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

const habitsApi: HabitsApi = {
  claimFocusTimerCycleCompletion: (cycleId: string) =>
    invokeHabits(HABITS_IPC_CHANNELS.claimFocusTimerCycleCompletion, cycleId),
  claimFocusTimerLeadership: (instanceId: string, ttlMs: number) =>
    invokeHabits(
      HABITS_IPC_CHANNELS.claimFocusTimerLeadership,
      instanceId,
      ttlMs
    ),
  clearData: () => invokeHabits(HABITS_IPC_CHANNELS.clearData),
  command: (command: HabitCommand) =>
    invokeHabits<HabitCommandResult>(HABITS_IPC_CHANNELS.command, command),
  exportBackup: () => invokeHabits(HABITS_IPC_CHANNELS.exportBackup),
  getDesktopNotificationStatus: () =>
    invokeHabits(HABITS_IPC_CHANNELS.getDesktopNotificationStatus),
  getFocusTimerShortcutStatus: () =>
    invokeHabits<FocusTimerShortcutStatus>(
      HABITS_IPC_CHANNELS.getFocusTimerShortcutStatus
    ),
  importBackup: () => invokeHabits(HABITS_IPC_CHANNELS.importBackup),
  onFocusSessionRecorded: (listener) =>
    subscribeToChannel(HABITS_IPC_CHANNELS.focusSessionRecorded, listener),
  onFocusTimerActionRequested: (listener) =>
    subscribeToChannel(HABITS_IPC_CHANNELS.focusTimerActionRequested, listener),
  onFocusTimerShortcutStatusChanged: (listener) =>
    subscribeToChannel(
      HABITS_IPC_CHANNELS.focusTimerShortcutStatusChanged,
      listener
    ),
  onFocusTimerStateChanged: (listener) =>
    subscribeToChannel(HABITS_IPC_CHANNELS.focusTimerStateChanged, listener),
  onWindDownNavigationRequested: (listener) =>
    subscribeToChannelWithoutPayload(
      HABITS_IPC_CHANNELS.windDownNavigationRequested,
      listener
    ),
  openDataFolder: () => invokeHabits(HABITS_IPC_CHANNELS.openDataFolder),
  query: (query: HabitQuery) =>
    invokeHabits<HabitQueryResult>(HABITS_IPC_CHANNELS.query, query),
  releaseFocusTimerLeadership: (instanceId: string) =>
    invokeHabits(HABITS_IPC_CHANNELS.releaseFocusTimerLeadership, instanceId),
  resizeFocusWidget: (width: number, height: number) =>
    invokeHabits(HABITS_IPC_CHANNELS.resizeFocusWidget, width, height),
  showFocusWidget: () => invokeHabits(HABITS_IPC_CHANNELS.showFocusWidget),
  showMainWindow: () => invokeHabits(HABITS_IPC_CHANNELS.showMainWindow),
  showNotification: (title: string, body: string, iconFilename?: string) =>
    invokeHabits(
      HABITS_IPC_CHANNELS.showNotification,
      title,
      body,
      iconFilename
    ),
};

const updaterApi: AppUpdaterApi = {
  checkForUpdates: () => invokeUpdater(APP_UPDATER_CHANNELS.checkForUpdates),
  downloadUpdate: () => invokeUpdater(APP_UPDATER_CHANNELS.downloadUpdate),
  getState: () => invokeUpdater<AppUpdateState>(APP_UPDATER_CHANNELS.getState),
  installUpdate: () => invokeUpdater(APP_UPDATER_CHANNELS.installUpdate),
  onStateChange: (listener) =>
    subscribeToChannel(APP_UPDATER_CHANNELS.stateChanged, listener),
};

contextBridge.exposeInMainWorld("habits", habitsApi);
contextBridge.exposeInMainWorld("updater", updaterApi);
