import { contextBridge, ipcRenderer } from "electron";
import type { HabitApi } from "../shared/types/ipc";
import type { ReminderSettings } from "../shared/domain/settings";

const habitsApi: HabitApi = {
  getTodayState: () => ipcRenderer.invoke("habits:getTodayState"),
  toggleHabit: (habitId: number) => ipcRenderer.invoke("habits:toggleHabit", habitId),
  getHistory: () => ipcRenderer.invoke("habits:getHistory"),
  updateReminderSettings: (settings: ReminderSettings) =>
    ipcRenderer.invoke("habits:updateReminderSettings", settings),
  createHabit: (name: string) => ipcRenderer.invoke("habits:createHabit", name),
  renameHabit: (habitId: number, name: string) =>
    ipcRenderer.invoke("habits:renameHabit", habitId, name),
  archiveHabit: (habitId: number) => ipcRenderer.invoke("habits:archiveHabit", habitId),
  reorderHabits: (habitIds: number[]) => ipcRenderer.invoke("habits:reorderHabits", habitIds),
};

contextBridge.exposeInMainWorld("habits", habitsApi);
