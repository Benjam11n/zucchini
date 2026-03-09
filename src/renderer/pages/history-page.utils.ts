import type {
  ContributionCell,
  ContributionWeek,
  HistoryStats,
} from "@/renderer/features/history/types";
import type { HistoryStatus } from "@/renderer/lib/history-status";
import type { HistoryDay } from "@/shared/domain/history";
import type { DailySummary } from "@/shared/domain/streak";
import {
  addDays,
  endOfWeek,
  formatDateKey,
  startOfWeek,
} from "@/shared/utils/date";

const DAY_IN_WEEK = 7;

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

  if (summary.allCompleted) {
    return "complete";
  }

  return isToday ? "in-progress" : "missed";
}

export function getActivityStatus(
  summary: DailySummary,
  isToday?: boolean
): HistoryStatus {
  if (summary.freezeUsed) {
    return "freeze";
  }

  if (summary.allCompleted) {
    return "complete";
  }

  return isToday ? "in-progress" : "missed";
}

export function getActivitySummary(
  summary: DailySummary,
  isToday?: boolean
): string {
  if (summary.freezeUsed) {
    return "Missed day covered by a freeze";
  }

  if (summary.allCompleted) {
    return "All habits completed";
  }

  return isToday ? "In progress" : "Incomplete day";
}

export function getActivityBadgeLabel(
  summary: DailySummary,
  isToday?: boolean
): string {
  const status = getActivityStatus(summary, isToday);

  if (status === "complete") {
    return "Complete";
  }

  if (status === "freeze") {
    return "Freeze";
  }

  if (status === "in-progress") {
    return "In Progress";
  }

  return "Missed";
}

export function buildContributionWeeks(
  history: HistoryDay[]
): ContributionWeek[] {
  if (history.length === 0) {
    return [];
  }

  const sortedHistory = [...history].toSorted((left, right) =>
    left.date.localeCompare(right.date)
  );
  const firstDate = sortedHistory[0]?.date;
  const lastDate = sortedHistory.at(-1)?.date;

  if (!firstDate || !lastDate) {
    return [];
  }

  const firstCellDate = startOfWeek(firstDate);
  const lastCellDate = endOfWeek(lastDate);
  const summaryByDate = new Map(
    sortedHistory.map((day) => [day.date, day.summary])
  );
  const cells: ContributionCell[] = [];

  let cursor = firstCellDate;

  while (cursor.localeCompare(lastCellDate) <= 0) {
    const summary = summaryByDate.get(cursor) ?? null;

    const isToday = cursor === lastDate;
    cells.push({
      date: cursor,
      isToday,
      status: getContributionStatus(summary, isToday),
      summary,
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

export function getHistoryStats(history: HistoryDay[]): HistoryStats {
  const completedDays = history.filter(
    (day) => day.summary.allCompleted
  ).length;
  const freezeDays = history.filter((day) => day.summary.freezeUsed).length;
  const missedDays = history.length - completedDays - freezeDays;
  const completionRate =
    history.length === 0
      ? 0
      : Math.round((completedDays / history.length) * 100);

  return {
    completedDays,
    completionRate,
    freezeDays,
    missedDays,
  };
}

export function getHistoryDayLookup(
  history: HistoryDay[]
): Map<string, HistoryDay> {
  return new Map(history.map((day) => [day.date, day]));
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

  if (cell.summary.freezeUsed) {
    return `${dateLabel}: missed day covered by a freeze`;
  }

  if (cell.summary.allCompleted) {
    return `${dateLabel}: all habits complete`;
  }

  if (cell.isToday && !cell.summary?.allCompleted) {
    return `${dateLabel}: in progress`;
  }

  return `${dateLabel}: incomplete`;
}
