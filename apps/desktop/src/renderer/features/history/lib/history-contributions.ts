import type {
  ContributionCell,
  ContributionIntensity,
  ContributionWeek,
} from "@/renderer/features/history/history.types";
import type { HistoryStatus } from "@/renderer/shared/types/contribution";
import type { HabitWithStatus } from "@/shared/domain/habit";
import type { HistoryDay } from "@/shared/domain/history";
import type { DailySummary } from "@/shared/domain/streak";
import {
  addDays,
  endOfWeek,
  formatDateKey,
  startOfWeek,
} from "@/shared/utils/date";

const DAY_IN_WEEK = 7;
const MAX_CONTRIBUTION_INTENSITY = 4;

function getUniqueDailyHabits(habits: HabitWithStatus[]): HabitWithStatus[] {
  return [
    ...new Map(
      habits
        .filter((habit) => habit.frequency === "daily")
        .map((habit) => [habit.id, habit])
    ).values(),
  ];
}

function getCompletionCounts(day: HistoryDay | null): {
  completedCount: number;
  totalCount: number;
} {
  if (!day) {
    return {
      completedCount: 0,
      totalCount: 0,
    };
  }

  const dailyHabits = getUniqueDailyHabits(day.habits);

  return {
    completedCount: dailyHabits.filter((habit) => habit.completed).length,
    totalCount: dailyHabits.length,
  };
}

function getContributionIntensity(
  completedCount: number,
  maxCompletedCount: number
): ContributionIntensity {
  if (completedCount === 0 || maxCompletedCount === 0) {
    return 0;
  }

  return Math.min(
    MAX_CONTRIBUTION_INTENSITY,
    Math.ceil((completedCount / maxCompletedCount) * MAX_CONTRIBUTION_INTENSITY)
  ) as ContributionIntensity;
}

function getContributionStatus(
  summary: DailySummary | null,
  isToday?: boolean
): HistoryStatus {
  if (!summary) {
    return isToday ? "in-progress" : "empty";
  }

  if (summary.freezeUsed) {
    return "freeze";
  }

  if (summary.dayStatus === "sick") {
    return "sick";
  }

  if (summary.dayStatus === "rest") {
    return "rest";
  }

  if (summary.dayStatus === "rescheduled") {
    return "rescheduled";
  }

  if (summary.allCompleted) {
    return "complete";
  }

  return isToday ? "in-progress" : "missed";
}

export function buildContributionWeeks(
  history: HistoryDay[],
  range?: {
    endDate: string;
    startDate: string;
  }
): ContributionWeek[] {
  if (history.length === 0 && !range) {
    return [];
  }

  const sortedHistory = [...history].toSorted((left, right) =>
    left.date.localeCompare(right.date)
  );
  const firstDate = range?.startDate ?? sortedHistory[0]?.date;
  const lastDate = range?.endDate ?? sortedHistory.at(-1)?.date;

  if (!firstDate || !lastDate) {
    return [];
  }

  const firstCellDate = startOfWeek(firstDate);
  const lastCellDate = endOfWeek(lastDate);
  const historyDayByDate = new Map(sortedHistory.map((day) => [day.date, day]));
  let maxCompletedCount = 0;

  for (const day of sortedHistory) {
    const { completedCount } = getCompletionCounts(day);
    maxCompletedCount = Math.max(maxCompletedCount, completedCount);
  }
  const cells: ContributionCell[] = [];

  let cursor = firstCellDate;

  while (cursor.localeCompare(lastCellDate) <= 0) {
    const day = historyDayByDate.get(cursor) ?? null;
    const summary = day?.summary ?? null;
    const { completedCount, totalCount } = getCompletionCounts(day);

    const isToday = cursor === lastDate;
    cells.push({
      completedCount,
      date: cursor,
      intensity: getContributionIntensity(completedCount, maxCompletedCount),
      isToday,
      status: getContributionStatus(summary, isToday),
      summary,
      totalCount,
    });

    cursor = addDays(cursor, 1);
  }

  const weeks: ContributionWeek[] = [];

  for (let index = 0; index < cells.length; index += DAY_IN_WEEK) {
    const firstCell = cells[index];

    if (!firstCell) {
      continue;
    }

    weeks.push({
      cells: cells.slice(index, index + DAY_IN_WEEK),
      key: firstCell.date,
    });
  }

  return weeks;
}

export function formatContributionLabel(cell: ContributionCell): string {
  const dateLabel = formatDateKey(cell.date, {
    day: "numeric",
    month: "short",
    weekday: "long",
    year: "numeric",
  });

  if (!cell.summary) {
    return `${dateLabel}: no tracked data`;
  }

  if (cell.totalCount === 0) {
    return `${dateLabel}: no daily habits tracked`;
  }

  const completionLabel = `${cell.completedCount} of ${cell.totalCount} daily habits completed`;

  if (cell.summary.dayStatus === "sick") {
    return `${dateLabel}: ${completionLabel}, sick day preserved streak`;
  }

  if (cell.summary.dayStatus === "rest") {
    return `${dateLabel}: ${completionLabel}, rest day preserved streak`;
  }

  if (cell.summary.dayStatus === "rescheduled") {
    return `${dateLabel}: ${completionLabel}, unfinished habits moved`;
  }

  if (cell.summary.freezeUsed) {
    return `${dateLabel}: ${completionLabel}, freeze used to preserve streak`;
  }

  if (cell.isToday) {
    return `${dateLabel}: ${completionLabel} so far`;
  }

  return `${dateLabel}: ${completionLabel}`;
}
