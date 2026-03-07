import { contextBridge, ipcRenderer } from "electron";

import type { HabitCategory } from "@/shared/domain/habit";
import type { AppSettings } from "@/shared/domain/settings";
import type { HabitApi } from "@/shared/types/ipc";

const habitsApi: HabitApi = {
  archiveHabit: (habitId: number) =>
    ipcRenderer.invoke("habits:archiveHabit", habitId),
  createHabit: (name: string, category: HabitCategory) =>
    ipcRenderer.invoke("habits:createHabit", name, category),
  getHistory: () => ipcRenderer.invoke("habits:getHistory"),
  getTodayState: () => ipcRenderer.invoke("habits:getTodayState"),
  renameHabit: (habitId: number, name: string) =>
    ipcRenderer.invoke("habits:renameHabit", habitId, name),
  reorderHabits: (habitIds: number[]) =>
    ipcRenderer.invoke("habits:reorderHabits", habitIds),
  toggleHabit: (habitId: number) =>
    ipcRenderer.invoke("habits:toggleHabit", habitId),
  updateHabitCategory: (habitId: number, category: HabitCategory) =>
    ipcRenderer.invoke("habits:updateHabitCategory", habitId, category),
  updateSettings: (settings: AppSettings) =>
    ipcRenderer.invoke("habits:updateSettings", settings),
};

contextBridge.exposeInMainWorld("habits", habitsApi);
