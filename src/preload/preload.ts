import { contextBridge, ipcRenderer } from "electron";

import { HABITS_IPC_CHANNELS } from "@/shared/contracts/habits-ipc";
import type { HabitApi } from "@/shared/contracts/habits-ipc";
import type { HabitCategory, HabitFrequency } from "@/shared/domain/habit";
import type { AppSettings } from "@/shared/domain/settings";

const habitsApi: HabitApi = {
  archiveHabit: (habitId: number) =>
    ipcRenderer.invoke(HABITS_IPC_CHANNELS.archiveHabit, habitId),
  createHabit: (
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency
  ) =>
    ipcRenderer.invoke(
      HABITS_IPC_CHANNELS.createHabit,
      name,
      category,
      frequency
    ),
  getHistory: () => ipcRenderer.invoke(HABITS_IPC_CHANNELS.getHistory),
  getTodayState: () => ipcRenderer.invoke(HABITS_IPC_CHANNELS.getTodayState),
  renameHabit: (habitId: number, name: string) =>
    ipcRenderer.invoke(HABITS_IPC_CHANNELS.renameHabit, habitId, name),
  reorderHabits: (habitIds: number[]) =>
    ipcRenderer.invoke(HABITS_IPC_CHANNELS.reorderHabits, habitIds),
  showNotification: (title: string, body: string, iconFilename?: string) =>
    ipcRenderer.invoke(
      HABITS_IPC_CHANNELS.showNotification,
      title,
      body,
      iconFilename
    ),
  toggleHabit: (habitId: number) =>
    ipcRenderer.invoke(HABITS_IPC_CHANNELS.toggleHabit, habitId),
  updateHabitCategory: (habitId: number, category: HabitCategory) =>
    ipcRenderer.invoke(
      HABITS_IPC_CHANNELS.updateHabitCategory,
      habitId,
      category
    ),
  updateHabitFrequency: (habitId: number, frequency: HabitFrequency) =>
    ipcRenderer.invoke(
      HABITS_IPC_CHANNELS.updateHabitFrequency,
      habitId,
      frequency
    ),
  updateSettings: (settings: AppSettings) =>
    ipcRenderer.invoke(HABITS_IPC_CHANNELS.updateSettings, settings),
};

contextBridge.exposeInMainWorld("habits", habitsApi);
