import type { HistoryStatus } from "@/renderer/shared/types/contribution";
import type { DailySummary } from "@/shared/domain/streak";

export function getActivityStatus(
  summary: DailySummary,
  isToday?: boolean
): HistoryStatus {
  if (summary.dayStatus === "sick") {
    return "sick";
  }

  if (summary.dayStatus === "rest") {
    return "rest";
  }

  if (summary.dayStatus === "rescheduled") {
    return "rescheduled";
  }

  if (summary.freezeUsed) {
    return "freeze";
  }

  if (summary.allCompleted) {
    return "complete";
  }

  return isToday ? "in-progress" : "missed";
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

  if (status === "sick") {
    return "Sick Day";
  }

  if (status === "rest") {
    return "Rest Day";
  }

  if (status === "rescheduled") {
    return "Moved";
  }

  if (status === "in-progress") {
    return "In Progress";
  }

  return "Missed";
}

export function getHistoryDayLookup<T extends { date: string }>(
  history: T[]
): Map<string, T> {
  return new Map(history.map((day) => [day.date, day]));
}
