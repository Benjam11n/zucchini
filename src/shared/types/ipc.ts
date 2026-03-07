import type { HabitWithStatus } from "../domain/habit";
import type { AppSettings } from "../domain/settings";
import type { DailySummary, StreakState } from "../domain/streak";

export interface TodayState {
  date: string;
  habits: HabitWithStatus[];
  streak: StreakState;
  settings: AppSettings;
}

export interface HabitApi {
  getTodayState: () => Promise<TodayState>;
  toggleHabit: (habitId: number) => Promise<TodayState>;
  getHistory: () => Promise<DailySummary[]>;
  updateSettings: (settings: AppSettings) => Promise<AppSettings>;
  createHabit: (name: string) => Promise<TodayState>;
  renameHabit: (habitId: number, name: string) => Promise<TodayState>;
  archiveHabit: (habitId: number) => Promise<TodayState>;
  reorderHabits: (habitIds: number[]) => Promise<TodayState>;
}
