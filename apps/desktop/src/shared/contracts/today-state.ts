import type { DayStatusKind } from "@/shared/domain/day-status";
import type { FocusQuotaGoalWithStatus } from "@/shared/domain/goal";
import type { HabitWithStatus } from "@/shared/domain/habit";
import type { HabitCarryover } from "@/shared/domain/habit-carryover";
import type { HabitStreak } from "@/shared/domain/habit-streak";
import type { AppSettings } from "@/shared/domain/settings";
import type { StreakState } from "@/shared/domain/streak";
import type { WindDownState } from "@/shared/domain/wind-down";

export interface TodayState {
  date: string;
  dayStatus: DayStatusKind | null;
  focusMinutes: number;
  focusQuotaGoals?: FocusQuotaGoalWithStatus[];
  habitCarryovers?: HabitCarryover[];
  habits: HabitWithStatus[];
  habitStreaks?: Record<number, HabitStreak>;
  streak: StreakState;
  settings: AppSettings;
  windDown?: WindDownState;
}
