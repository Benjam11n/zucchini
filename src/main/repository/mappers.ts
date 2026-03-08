import {
  normalizeHabitCategory,
  normalizeHabitFrequency,
} from "@/shared/domain/habit";
import type { Habit } from "@/shared/domain/habit";
import { isThemeMode } from "@/shared/domain/settings";
import type { ThemeMode } from "@/shared/domain/settings";
import type { DailySummary, StreakState } from "@/shared/domain/streak";

import type { DailySummaryRow, HabitRow, StreakStateRow } from "./types";

export function mapHabit(row: HabitRow): Habit {
  return {
    category: normalizeHabitCategory(row.category),
    createdAt: row.createdAt,
    frequency: normalizeHabitFrequency(row.frequency),
    id: row.id,
    isArchived: row.isArchived,
    name: row.name,
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
