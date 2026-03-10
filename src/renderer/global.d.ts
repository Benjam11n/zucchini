import type { AppUpdaterApi } from "@/shared/contracts/app-updater";
import type { HabitApi } from "@/shared/contracts/habits-ipc";

declare global {
  interface Window {
    habits: HabitApi;
    updater: AppUpdaterApi;
  }
}
