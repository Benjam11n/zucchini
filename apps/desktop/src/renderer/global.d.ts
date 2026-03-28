import type { AppUpdaterApi } from "@/shared/contracts/app-updater";
import type { HabitsApi } from "@/shared/contracts/habits-ipc";

declare global {
  interface Window {
    habits: HabitsApi;
    updater: AppUpdaterApi;
  }
}
