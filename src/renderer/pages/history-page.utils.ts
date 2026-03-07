import type { DailySummary } from "../../shared/domain/streak";

export type ContributionStatus = "complete" | "empty" | "freeze" | "missed";
export type HistoryRange = "week" | "month" | "year";

export interface ContributionCell {
  date: string;
  isToday: boolean;
  status: ContributionStatus;
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

export interface HistoryRangeOption {
  label: string;
  title: string;
  value: HistoryRange;
}

const DAY_IN_WEEK = 7;
const HISTORY_RANGE_DAYS: Record<HistoryRange, number> = {
  month: 30,
  week: 7,
  year: 365,
};

export const HISTORY_RANGE_OPTIONS: HistoryRangeOption[] = [
  {
    label: "Weekly",
    title: "Last 7 days",
    value: "week",
  },
  {
    label: "Monthly",
    title: "Last 30 days",
    value: "month",
  },
  {
    label: "Yearly",
    title: "Last 365 days",
    value: "year",
  },
];

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateKey(date: Date): string {
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

function getContributionStatus(
  summary: DailySummary | null
): ContributionStatus {
  if (!summary) {
    return "empty";
  }

  if (summary.freezeUsed) {
    return "freeze";
  }

  return summary.allCompleted ? "complete" : "missed";
}

function sortHistoryNewestFirst(history: DailySummary[]): DailySummary[] {
  return [...history].toSorted((left, right) =>
    right.date.localeCompare(left.date)
  );
}

export function getActivitySummary(day: DailySummary): string {
  if (day.freezeUsed) {
    return "Missed day covered by a freeze";
  }

  if (day.allCompleted) {
    return "All habits completed";
  }

  return "Incomplete day";
}

export function getActivityBadgeLabel(day: DailySummary): string {
  if (day.allCompleted) {
    return "Complete";
  }

  if (day.freezeUsed) {
    return "Freeze";
  }

  return "Missed";
}

export function buildContributionWeeks(
  history: DailySummary[]
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
  const summaryByDate = new Map(sortedHistory.map((day) => [day.date, day]));
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

export function getRecentHistory(
  history: DailySummary[],
  range: HistoryRange
): DailySummary[] {
  if (history.length === 0) {
    return [];
  }

  const sortedHistory = sortHistoryNewestFirst(history);
  const latestDate = sortedHistory[0]?.date;

  if (!latestDate) {
    return [];
  }

  const earliestVisibleDate = addDays(
    latestDate,
    -(HISTORY_RANGE_DAYS[range] - 1)
  );

  return sortedHistory.filter(
    (day) => day.date.localeCompare(earliestVisibleDate) >= 0
  );
}

export function getHistoryStats(history: DailySummary[]): HistoryStats {
  const completedDays = history.filter((day) => day.allCompleted).length;
  const freezeDays = history.filter((day) => day.freezeUsed).length;
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

export function isHistoryRange(value: string): value is HistoryRange {
  return HISTORY_RANGE_OPTIONS.some((option) => option.value === value);
}
