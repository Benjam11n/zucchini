import type { HistoryStatus } from "@/renderer/features/history/history-status";
import type { HistoryStats } from "@/renderer/features/history/history.types";
import type { HistoryDay } from "@/shared/domain/history";
import type { DailySummary } from "@/shared/domain/streak";

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
