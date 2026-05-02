import type { DayStatus, DayStatusKind } from "@/shared/domain/day-status";
/**
 * Persistence layer data mappers.
 *
 * Converts between SQLite row types (Drizzle inferred selects) and
 * domain objects (`Habit`, `FocusSession`, `DailySummary`, `StreakState`,
 * `AppSettings`). Handles null normalization and category/frequency
 * validation on reads.
 */
import type { FocusSession } from "@/shared/domain/focus-session";
import {
  normalizeHabitCategory,
  normalizeHabitFrequency,
  normalizeHabitTargetCount,
  normalizeHabitWeekdays,
} from "@/shared/domain/habit";
import type { Habit } from "@/shared/domain/habit";
import { isThemeMode } from "@/shared/domain/settings";
import type { ThemeMode } from "@/shared/domain/settings";
import type { DailySummary, StreakState } from "@/shared/domain/streak";
import type { WindDownAction } from "@/shared/domain/wind-down";

import type {
  DailySummaryRow,
  DayStatusRow,
  FocusSessionRow,
  HabitPeriodStatusRow,
  HabitPeriodStatusSnapshot,
  HabitRow,
  StreakStateRow,
  WindDownActionRow,
} from "./types";

function normalizeDayStatusKind(value: string | null): DayStatusKind | null {
  if (value === "sick") {
    return value;
  }

  if (value === null) {
    return null;
  }

  throw new Error(`Invalid day status kind "${value}".`);
}

function parseDayStatusKind(value: string): DayStatusKind {
  const kind = normalizeDayStatusKind(value);
  if (kind) {
    return kind;
  }

  throw new Error("Day status kind cannot be null.");
}

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
    targetCount: normalizeHabitTargetCount(
      normalizeHabitFrequency(row.frequency),
      row.targetCount
    ),
  };
}

export function mapDailySummary(row: DailySummaryRow): DailySummary {
  return {
    allCompleted: row.allCompleted,
    completedAt: row.completedAt,
    date: row.date,
    dayStatus: normalizeDayStatusKind(row.dayStatus),
    freezeUsed: row.freezeUsed,
    streakCountAfterDay: row.streakCountAfterDay,
  };
}

export function mapDayStatus(row: DayStatusRow): DayStatus {
  return {
    createdAt: row.createdAt,
    date: row.date,
    kind: parseDayStatusKind(row.kind),
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
    completedCount: row.completedCount,
    createdAt: row.habitCreatedAt,
    frequency: normalizeHabitFrequency(row.frequency),
    habitId: row.habitId,
    name: row.habitName,
    periodEnd: row.periodEnd,
    periodStart: row.periodStart,
    selectedWeekdays: normalizeHabitWeekdays(
      row.habitSelectedWeekdays ? JSON.parse(row.habitSelectedWeekdays) : null
    ),
    sortOrder: row.habitSortOrder,
    targetCount: normalizeHabitTargetCount(
      normalizeHabitFrequency(row.frequency),
      row.habitTargetCount
    ),
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

export function mapWindDownAction(row: WindDownActionRow): WindDownAction {
  return {
    createdAt: row.createdAt,
    id: row.id,
    name: row.name,
    sortOrder: row.sortOrder,
  };
}
