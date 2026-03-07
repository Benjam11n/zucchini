import type { HabitApi } from "../shared/types/ipc";

declare global {
  interface Window {
    habits: HabitApi;
  }
}

export {};
