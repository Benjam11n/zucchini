import type { HabitsApi } from "@/shared/contracts/api/habits-api";
import type { AppUpdaterApi } from "@/shared/contracts/app-updater";

declare global {
  interface Window {
    habits: HabitsApi;
    updater: AppUpdaterApi;
  }
}
