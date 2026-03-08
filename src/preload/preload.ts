import { contextBridge, ipcRenderer } from "electron";

import {
  HABITS_IPC_CHANNELS,
  HabitsIpcError,
} from "@/shared/contracts/habits-ipc";
import type {
  HabitApi,
  HabitsIpcResponse,
} from "@/shared/contracts/habits-ipc";
import type { HabitCategory, HabitFrequency } from "@/shared/domain/habit";
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

const habitsApi: HabitApi = {
  archiveHabit: (habitId: number) =>
    invokeHabits(HABITS_IPC_CHANNELS.archiveHabit, habitId),
  createHabit: (
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency
  ) => invokeHabits(HABITS_IPC_CHANNELS.createHabit, name, category, frequency),
  getHistory: () => invokeHabits(HABITS_IPC_CHANNELS.getHistory),
  getTodayState: () => invokeHabits(HABITS_IPC_CHANNELS.getTodayState),
  getWeeklyReview: (weekStart: string) =>
    invokeHabits(HABITS_IPC_CHANNELS.getWeeklyReview, weekStart),
  getWeeklyReviewOverview: () =>
    invokeHabits(HABITS_IPC_CHANNELS.getWeeklyReviewOverview),
  renameHabit: (habitId: number, name: string) =>
    invokeHabits(HABITS_IPC_CHANNELS.renameHabit, habitId, name),
  reorderHabits: (habitIds: number[]) =>
    invokeHabits(HABITS_IPC_CHANNELS.reorderHabits, habitIds),
  showNotification: (title: string, body: string, iconFilename?: string) =>
    invokeHabits(
      HABITS_IPC_CHANNELS.showNotification,
      title,
      body,
      iconFilename
    ),
  toggleHabit: (habitId: number) =>
    invokeHabits(HABITS_IPC_CHANNELS.toggleHabit, habitId),
  updateHabitCategory: (habitId: number, category: HabitCategory) =>
    invokeHabits(HABITS_IPC_CHANNELS.updateHabitCategory, habitId, category),
  updateHabitFrequency: (habitId: number, frequency: HabitFrequency) =>
    invokeHabits(HABITS_IPC_CHANNELS.updateHabitFrequency, habitId, frequency),
  updateSettings: (settings: AppSettings) =>
    invokeHabits(HABITS_IPC_CHANNELS.updateSettings, settings),
};

contextBridge.exposeInMainWorld("habits", habitsApi);
