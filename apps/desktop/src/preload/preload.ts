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
  FocusTimerShortcutStatus,
  HabitsApi,
  HabitsIpcResponse,
} from "@/shared/contracts/habits-ipc";
import type { CreateFocusSessionInput } from "@/shared/domain/focus-session";
import type { PersistedFocusTimerState } from "@/shared/domain/focus-timer";
import type { GoalFrequency } from "@/shared/domain/goal";
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

// oxlint-disable-next-line eslint/sort-keys
const habitsApi: HabitsApi = {
  archiveFocusQuotaGoal: (goalId: number) =>
    invokeHabits(HABITS_IPC_CHANNELS.archiveFocusQuotaGoal, goalId),
  archiveHabit: (habitId: number) =>
    invokeHabits(HABITS_IPC_CHANNELS.archiveHabit, habitId),
  clearData: () => invokeHabits(HABITS_IPC_CHANNELS.clearData),
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
    selectedWeekdays?: HabitWeekday[] | null,
    targetCount?: number | null
  ) =>
    invokeHabits(
      HABITS_IPC_CHANNELS.createHabit,
      name,
      category,
      frequency,
      selectedWeekdays,
      targetCount
    ),
  createWindDownAction: (name: string) =>
    invokeHabits(HABITS_IPC_CHANNELS.createWindDownAction, name),
  decrementHabitProgress: (habitId: number) =>
    invokeHabits(HABITS_IPC_CHANNELS.decrementHabitProgress, habitId),
  deleteWindDownAction: (actionId: number) =>
    invokeHabits(HABITS_IPC_CHANNELS.deleteWindDownAction, actionId),
  exportBackup: () => invokeHabits(HABITS_IPC_CHANNELS.exportBackup),
  getDesktopNotificationStatus: () =>
    invokeHabits(HABITS_IPC_CHANNELS.getDesktopNotificationStatus),
  getFocusSessions: (limit?: number) =>
    invokeHabits(HABITS_IPC_CHANNELS.getFocusSessions, limit),
  getFocusTimerShortcutStatus: () =>
    invokeHabits<FocusTimerShortcutStatus>(
      HABITS_IPC_CHANNELS.getFocusTimerShortcutStatus
    ),
  getFocusTimerState: () =>
    invokeHabits<PersistedFocusTimerState | null>(
      HABITS_IPC_CHANNELS.getFocusTimerState
    ),
  getHabits: () => invokeHabits(HABITS_IPC_CHANNELS.getHabits),
  getHistory: (limit?: number) =>
    invokeHabits(HABITS_IPC_CHANNELS.getHistory, limit),
  getTodayState: () => invokeHabits(HABITS_IPC_CHANNELS.getTodayState),
  getWeeklyReview: (weekStart: string) =>
    invokeHabits(HABITS_IPC_CHANNELS.getWeeklyReview, weekStart),
  getWeeklyReviewOverview: () =>
    invokeHabits(HABITS_IPC_CHANNELS.getWeeklyReviewOverview),
  importBackup: () => invokeHabits(HABITS_IPC_CHANNELS.importBackup),
  incrementHabitProgress: (habitId: number) =>
    invokeHabits(HABITS_IPC_CHANNELS.incrementHabitProgress, habitId),
  onFocusSessionRecorded: (listener) =>
    subscribeToChannel<Awaited<ReturnType<HabitsApi["recordFocusSession"]>>>(
      HABITS_IPC_CHANNELS.focusSessionRecorded,
      listener
    ),
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
  recordFocusSession: (input: CreateFocusSessionInput) =>
    invokeHabits(HABITS_IPC_CHANNELS.recordFocusSession, input),
  releaseFocusTimerLeadership: (instanceId: string) =>
    invokeHabits(HABITS_IPC_CHANNELS.releaseFocusTimerLeadership, instanceId),
  renameHabit: (habitId: number, name: string) =>
    invokeHabits(HABITS_IPC_CHANNELS.renameHabit, habitId, name),
  renameWindDownAction: (actionId: number, name: string) =>
    invokeHabits(HABITS_IPC_CHANNELS.renameWindDownAction, actionId, name),
  reorderHabits: (habitIds: number[]) =>
    invokeHabits(HABITS_IPC_CHANNELS.reorderHabits, habitIds),
  resizeFocusWidget: (width: number, height: number) =>
    invokeHabits(HABITS_IPC_CHANNELS.resizeFocusWidget, width, height),
  saveFocusTimerState: (state: PersistedFocusTimerState) =>
    invokeHabits(HABITS_IPC_CHANNELS.saveFocusTimerState, state),
  showFocusWidget: () => invokeHabits(HABITS_IPC_CHANNELS.showFocusWidget),
  showMainWindow: () => invokeHabits(HABITS_IPC_CHANNELS.showMainWindow),
  showNotification: (title: string, body: string, iconFilename?: string) =>
    invokeHabits(
      HABITS_IPC_CHANNELS.showNotification,
      title,
      body,
      iconFilename
    ),
  toggleSickDay: () => invokeHabits(HABITS_IPC_CHANNELS.toggleSickDay),
  toggleHabit: (habitId: number) =>
    invokeHabits(HABITS_IPC_CHANNELS.toggleHabit, habitId),
  toggleWindDownAction: (actionId: number) =>
    invokeHabits(HABITS_IPC_CHANNELS.toggleWindDownAction, actionId),
  unarchiveFocusQuotaGoal: (goalId: number) =>
    invokeHabits(HABITS_IPC_CHANNELS.unarchiveFocusQuotaGoal, goalId),
  unarchiveHabit: (habitId: number) =>
    invokeHabits(HABITS_IPC_CHANNELS.unarchiveHabit, habitId),
  upsertFocusQuotaGoal: (frequency: GoalFrequency, targetMinutes: number) =>
    invokeHabits(
      HABITS_IPC_CHANNELS.upsertFocusQuotaGoal,
      frequency,
      targetMinutes
    ),
  updateHabitCategory: (habitId: number, category: HabitCategory) =>
    invokeHabits(HABITS_IPC_CHANNELS.updateHabitCategory, habitId, category),
  updateHabitFrequency: (
    habitId: number,
    frequency: HabitFrequency,
    targetCount?: number | null
  ) =>
    invokeHabits(
      HABITS_IPC_CHANNELS.updateHabitFrequency,
      habitId,
      frequency,
      targetCount
    ),
  updateHabitTargetCount: (habitId: number, targetCount: number) =>
    invokeHabits(
      HABITS_IPC_CHANNELS.updateHabitTargetCount,
      habitId,
      targetCount
    ),
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
  onStateChange: (listener) =>
    subscribeToChannel(APP_UPDATER_CHANNELS.stateChanged, listener),
};

contextBridge.exposeInMainWorld("habits", habitsApi);
contextBridge.exposeInMainWorld("updater", updaterApi);
