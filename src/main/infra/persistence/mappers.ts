import type { FocusSession } from "@/shared/domain/focus-session";
import {
  normalizeHabitCategory,
  normalizeHabitFrequency,
  normalizeHabitWeekdays,
} from "@/shared/domain/habit";
import type { Habit } from "@/shared/domain/habit";
import { isThemeMode } from "@/shared/domain/settings";
import type { ThemeMode } from "@/shared/domain/settings";
import type { DailySummary, StreakState } from "@/shared/domain/streak";

import type {
  DailySummaryRow,
  FocusSessionRow,
  HabitPeriodStatusRow,
  HabitPeriodStatusSnapshot,
  HabitRow,
  StreakStateRow,
} from "./types";

export function mapHabit(row: HabitRow): Habit {
  return {
    category: normalizeHabitCategory(row.category),
    createdAt: row.createdAt,
    frequency: normalizeHabitFrequency(row.frequency),
    id: row.id,
    isArchived: row.isArchived,
    name: row.name,
    selectedWeekdays: normalizeHabitWeekdays(
      row.selectedWeekdays ? JSON.parse(row.selectedWeekdays) : null
    ),
    sortOrder: row.sortOrder,
  };
}

export function mapDailySummary(row: DailySummaryRow): DailySummary {
  return {
    allCompleted: row.allCompleted,
    completedAt: row.completedAt,
    date: row.date,
    freezeUsed: row.freezeUsed,
    streakCountAfterDay: row.streakCountAfterDay,
  };
}

export function mapFocusSession(row: FocusSessionRow): FocusSession {
  return {
    completedAt: row.completedAt,
    completedDate: row.completedDate,
    durationSeconds: row.durationSeconds,
    entryKind: row.entryKind === "partial" ? "partial" : "completed",
    id: row.id,
    startedAt: row.startedAt,
    timerSessionId: row.timerSessionId,
  };
}

export function mapHabitPeriodStatusSnapshot(
  row: HabitPeriodStatusRow
): HabitPeriodStatusSnapshot {
  return {
    category: normalizeHabitCategory(row.habitCategory),
    completed: row.completed,
    frequency: normalizeHabitFrequency(row.frequency),
    habitId: row.habitId,
    name: row.habitName,
    periodEnd: row.periodEnd,
    periodStart: row.periodStart,
    selectedWeekdays: normalizeHabitWeekdays(
      row.habitSelectedWeekdays ? JSON.parse(row.habitSelectedWeekdays) : null
    ),
    sortOrder: row.habitSortOrder,
  };
}

export function mapStreakState(row: StreakStateRow): StreakState {
  return {
    availableFreezes: row.availableFreezes,
    bestStreak: row.bestStreak,
    currentStreak: row.currentStreak,
    lastEvaluatedDate: row.lastEvaluatedDate,
  };
}

export function normalizeThemeMode(value = ""): ThemeMode {
  if (isThemeMode(value)) {
    return value;
  }

  return "system";
}
