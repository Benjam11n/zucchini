import type { DayStatusKind } from "@/shared/domain/day-status";
import type { FocusQuotaGoalWithStatus } from "@/shared/domain/goal";
import type { HabitWithStatus } from "@/shared/domain/habit";
import type { AppSettings } from "@/shared/domain/settings";
import type { StreakState } from "@/shared/domain/streak";
import type { WindDownState } from "@/shared/domain/wind-down";

export interface TodayState {
  date: string;
  dayStatus: DayStatusKind | null;
  focusMinutes: number;
  focusQuotaGoals?: FocusQuotaGoalWithStatus[];
  habits: HabitWithStatus[];
  streak: StreakState;
  settings: AppSettings;
  windDown?: WindDownState;
}
