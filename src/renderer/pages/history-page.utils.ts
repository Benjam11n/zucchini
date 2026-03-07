import type { HistoryStatus } from "@/renderer/lib/history-status";
import type { HistoryDay } from "@/shared/domain/history";
import type { DailySummary } from "@/shared/domain/streak";

export interface ContributionCell {
  date: string;
  isToday: boolean;
  status: HistoryStatus;
  summary: DailySummary | null;
}

export interface ContributionWeek {
  cells: ContributionCell[];
  key: string;
}

export interface HistoryStats {
  completedDays: number;
  completionRate: number;
  freezeDays: number;
  missedDays: number;
}

const DAY_IN_WEEK = 7;

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(dateKey: string, days: number): string {
  const next = parseDateKey(dateKey);
  next.setDate(next.getDate() + days);
  return toDateKey(next);
}

function startOfWeek(dateKey: string): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() - date.getDay());
  return toDateKey(date);
}

function endOfWeek(dateKey: string): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + (6 - date.getDay()));
  return toDateKey(date);
}

function getContributionStatus(summary: DailySummary | null): HistoryStatus {
  if (!summary) {
    return "empty";
  }

  if (summary.freezeUsed) {
    return "freeze";
  }

  return summary.allCompleted ? "complete" : "missed";
}

export function getActivityStatus(summary: DailySummary): HistoryStatus {
  if (summary.freezeUsed) {
    return "freeze";
  }

  if (summary.allCompleted) {
    return "complete";
  }

  return "missed";
}

export function getActivitySummary(summary: DailySummary): string {
  if (summary.freezeUsed) {
    return "Missed day covered by a freeze";
  }

  if (summary.allCompleted) {
    return "All habits completed";
  }

  return "Incomplete day";
}

export function getActivityBadgeLabel(summary: DailySummary): string {
  const status = getActivityStatus(summary);

  if (status === "complete") {
    return "Complete";
  }

  if (status === "freeze") {
    return "Freeze";
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

    cells.push({
      date: cursor,
      isToday: cursor === lastDate,
      status: getContributionStatus(summary),
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

export function formatDateKey(
  dateKey: string,
  options: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(undefined, options).format(
    parseDateKey(dateKey)
  );
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

  return `${dateLabel}: incomplete`;
}
