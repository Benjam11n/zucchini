import type { HabitCategory, HabitWithStatus } from "../domain/habit";
import type { HistoryDay } from "../domain/history";
import type { AppSettings } from "../domain/settings";
import type { StreakState } from "../domain/streak";

export interface TodayState {
  date: string;
  habits: HabitWithStatus[];
  streak: StreakState;
  settings: AppSettings;
}

export interface HabitApi {
  getTodayState: () => Promise<TodayState>;
  toggleHabit: (habitId: number) => Promise<TodayState>;
  getHistory: () => Promise<HistoryDay[]>;
  updateSettings: (settings: AppSettings) => Promise<AppSettings>;
  createHabit: (name: string, category: HabitCategory) => Promise<TodayState>;
  renameHabit: (habitId: number, name: string) => Promise<TodayState>;
  updateHabitCategory: (
    habitId: number,
    category: HabitCategory
  ) => Promise<TodayState>;
  archiveHabit: (habitId: number) => Promise<TodayState>;
  reorderHabits: (habitIds: number[]) => Promise<TodayState>;
}
