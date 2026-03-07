import type { HabitWithStatus } from "../domain/habit";
import type { ReminderSettings } from "../domain/settings";
import type { DailySummary, StreakState } from "../domain/streak";

export type TodayState = {
  date: string;
  habits: HabitWithStatus[];
  streak: StreakState;
  settings: ReminderSettings;
};

export interface HabitApi {
  getTodayState: () => Promise<TodayState>;
  toggleHabit: (habitId: number) => Promise<TodayState>;
  getHistory: () => Promise<DailySummary[]>;
  updateReminderSettings: (
    settings: ReminderSettings,
  ) => Promise<ReminderSettings>;
}
