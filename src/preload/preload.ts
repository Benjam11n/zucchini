import { contextBridge, ipcRenderer } from "electron";
import type { HabitApi } from "../shared/types/ipc";
import type { ReminderSettings } from "../shared/domain/settings";

const habitsApi: HabitApi = {
  getTodayState: () => ipcRenderer.invoke("habits:getTodayState"),
  toggleHabit: (habitId: number) => ipcRenderer.invoke("habits:toggleHabit", habitId),
  getHistory: () => ipcRenderer.invoke("habits:getHistory"),
  updateReminderSettings: (settings: ReminderSettings) =>
    ipcRenderer.invoke("habits:updateReminderSettings", settings),
};

contextBridge.exposeInMainWorld("habits", habitsApi);
