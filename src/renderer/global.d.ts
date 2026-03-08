import type { HabitApi } from "../shared/contracts/habits-ipc";

declare global {
  interface Window {
    habits: HabitApi;
  }
}
