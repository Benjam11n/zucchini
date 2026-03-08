import { contextBridge, ipcRenderer } from "electron";

import type { HabitCategory, HabitFrequency } from "@/shared/domain/habit";
import type { AppSettings } from "@/shared/domain/settings";
import type { HabitApi } from "@/shared/types/ipc";

const habitsApi: HabitApi = {
  archiveHabit: (habitId: number) =>
    ipcRenderer.invoke("habits:archiveHabit", habitId),
  createHabit: (
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency
  ) => ipcRenderer.invoke("habits:createHabit", name, category, frequency),
  getHistory: () => ipcRenderer.invoke("habits:getHistory"),
  getTodayState: () => ipcRenderer.invoke("habits:getTodayState"),
  renameHabit: (habitId: number, name: string) =>
    ipcRenderer.invoke("habits:renameHabit", habitId, name),
  reorderHabits: (habitIds: number[]) =>
    ipcRenderer.invoke("habits:reorderHabits", habitIds),
  showNotification: (title: string, body: string, iconFilename?: string) =>
    ipcRenderer.invoke("habits:showNotification", title, body, iconFilename),
  toggleHabit: (habitId: number) =>
    ipcRenderer.invoke("habits:toggleHabit", habitId),
  updateHabitCategory: (habitId: number, category: HabitCategory) =>
    ipcRenderer.invoke("habits:updateHabitCategory", habitId, category),
  updateHabitFrequency: (habitId: number, frequency: HabitFrequency) =>
    ipcRenderer.invoke("habits:updateHabitFrequency", habitId, frequency),
  updateSettings: (settings: AppSettings) =>
    ipcRenderer.invoke("habits:updateSettings", settings),
};

contextBridge.exposeInMainWorld("habits", habitsApi);
