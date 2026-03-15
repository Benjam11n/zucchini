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
  HabitApi,
  HabitsIpcResponse,
} from "@/shared/contracts/habits-ipc";
import type { CreateFocusSessionInput } from "@/shared/domain/focus-session";
import type {
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
} from "@/shared/domain/habit";
import type { AppSettings } from "@/shared/domain/settings";

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

const habitsApi: HabitApi = {
  archiveHabit: (habitId: number) =>
    invokeHabits(HABITS_IPC_CHANNELS.archiveHabit, habitId),
  claimFocusTimerCycleCompletion: (cycleId: string) =>
    invokeHabits(HABITS_IPC_CHANNELS.claimFocusTimerCycleCompletion, cycleId),
  claimFocusTimerLeadership: (instanceId: string, ttlMs: number) =>
    invokeHabits(
      HABITS_IPC_CHANNELS.claimFocusTimerLeadership,
      instanceId,
      ttlMs
    ),
  createHabit: (
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency,
    selectedWeekdays?: HabitWeekday[] | null
  ) =>
    invokeHabits(
      HABITS_IPC_CHANNELS.createHabit,
      name,
      category,
      frequency,
      selectedWeekdays
    ),
  exportBackup: () => invokeHabits(HABITS_IPC_CHANNELS.exportBackup),
  getDesktopNotificationStatus: () =>
    invokeHabits(HABITS_IPC_CHANNELS.getDesktopNotificationStatus),
  getFocusSessions: (limit?: number) =>
    invokeHabits(HABITS_IPC_CHANNELS.getFocusSessions, limit),
  getHabits: () => invokeHabits(HABITS_IPC_CHANNELS.getHabits),
  getHistory: (limit?: number) =>
    invokeHabits(HABITS_IPC_CHANNELS.getHistory, limit),
  getTodayState: () => invokeHabits(HABITS_IPC_CHANNELS.getTodayState),
  getWeeklyReview: (weekStart: string) =>
    invokeHabits(HABITS_IPC_CHANNELS.getWeeklyReview, weekStart),
  getWeeklyReviewOverview: () =>
    invokeHabits(HABITS_IPC_CHANNELS.getWeeklyReviewOverview),
  importBackup: () => invokeHabits(HABITS_IPC_CHANNELS.importBackup),
  onFocusSessionRecorded: (listener) => {
    const handleFocusSessionRecorded = (
      _event: IpcRendererEvent,
      session: Awaited<ReturnType<HabitApi["recordFocusSession"]>>
    ) => {
      listener(session);
    };

    ipcRenderer.on(
      HABITS_IPC_CHANNELS.focusSessionRecorded,
      handleFocusSessionRecorded
    );

    return () => {
      ipcRenderer.removeListener(
        HABITS_IPC_CHANNELS.focusSessionRecorded,
        handleFocusSessionRecorded
      );
    };
  },
  openDataFolder: () => invokeHabits(HABITS_IPC_CHANNELS.openDataFolder),
  recordFocusSession: (input: CreateFocusSessionInput) =>
    invokeHabits(HABITS_IPC_CHANNELS.recordFocusSession, input),
  releaseFocusTimerLeadership: (instanceId: string) =>
    invokeHabits(HABITS_IPC_CHANNELS.releaseFocusTimerLeadership, instanceId),
  renameHabit: (habitId: number, name: string) =>
    invokeHabits(HABITS_IPC_CHANNELS.renameHabit, habitId, name),
  reorderHabits: (habitIds: number[]) =>
    invokeHabits(HABITS_IPC_CHANNELS.reorderHabits, habitIds),
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
  toggleHabit: (habitId: number) =>
    invokeHabits(HABITS_IPC_CHANNELS.toggleHabit, habitId),
  unarchiveHabit: (habitId: number) =>
    invokeHabits(HABITS_IPC_CHANNELS.unarchiveHabit, habitId),
  updateHabitCategory: (habitId: number, category: HabitCategory) =>
    invokeHabits(HABITS_IPC_CHANNELS.updateHabitCategory, habitId, category),
  updateHabitFrequency: (habitId: number, frequency: HabitFrequency) =>
    invokeHabits(HABITS_IPC_CHANNELS.updateHabitFrequency, habitId, frequency),
  updateHabitWeekdays: (
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null
  ) =>
    invokeHabits(
      HABITS_IPC_CHANNELS.updateHabitWeekdays,
      habitId,
      selectedWeekdays
    ),
  updateSettings: (settings: AppSettings) =>
    invokeHabits(HABITS_IPC_CHANNELS.updateSettings, settings),
};

const updaterApi: AppUpdaterApi = {
  checkForUpdates: () => invokeUpdater(APP_UPDATER_CHANNELS.checkForUpdates),
  downloadUpdate: () => invokeUpdater(APP_UPDATER_CHANNELS.downloadUpdate),
  getState: () => invokeUpdater<AppUpdateState>(APP_UPDATER_CHANNELS.getState),
  installUpdate: () => invokeUpdater(APP_UPDATER_CHANNELS.installUpdate),
  onStateChange: (listener) => {
    const handleStateChange = (
      _event: IpcRendererEvent,
      state: AppUpdateState
    ) => {
      listener(state);
    };

    ipcRenderer.on(APP_UPDATER_CHANNELS.stateChanged, handleStateChange);

    return () => {
      ipcRenderer.removeListener(
        APP_UPDATER_CHANNELS.stateChanged,
        handleStateChange
      );
    };
  },
};

contextBridge.exposeInMainWorld("habits", habitsApi);
contextBridge.exposeInMainWorld("updater", updaterApi);
