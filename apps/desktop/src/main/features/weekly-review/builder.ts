import { toFocusMinutes } from "@/shared/domain/focus-session";
import type { FocusSession } from "@/shared/domain/focus-session";
import type { HabitWeekday } from "@/shared/domain/habit";
/**
 * Weekly review data builder.
 *
 * Assembles the chart-ready `WeeklyReview` and `WeeklyReviewOverview`
 * objects from raw daily summaries, focus sessions, and habit period
 * statuses. Computes per-habit completion rates, daily cadence points,
 * trend data, and most-missed habit rankings.
 */
import type { HabitPeriodStatusSnapshot } from "@/shared/domain/habit-period-status-snapshot";
import type { DailySummary } from "@/shared/domain/streak";
import type {
  WeeklyReview,
  WeeklyReviewDayPoint,
  WeeklyReviewHabitHeatmapCell,
  WeeklyReviewHabitHeatmapRow,
  WeeklyReviewHabitMetric,
  WeeklyReviewListItem,
  WeeklyReviewOverview,
  WeeklyReviewTrendPoint,
} from "@/shared/domain/weekly-review";
import {
  addDays,
  endOfIsoWeek,
  formatDateKey,
  parseDateKey,
  startOfIsoWeek,
} from "@/shared/utils/date";

interface BuildWeeklyReviewOptions {
  dailySummaries: DailySummary[];
  focusSessions: FocusSession[];
  habitStatuses: HabitPeriodStatusSnapshot[];
  weekStart: string;
}

interface BuildWeeklyReviewOverviewOptions {
  dailySummaries: DailySummary[];
  focusSessions: FocusSession[];
  habitStatuses: HabitPeriodStatusSnapshot[];
}

function toRate(completed: number, total: number): number {
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

function getWeekLabel(weekStart: string, weekEnd: string): string {
  const startLabel = formatDateKey(
    weekStart,
    { day: "numeric", month: "short" },
    "en-US"
  );
  const endLabel = formatDateKey(
    weekEnd,
    { day: "numeric", month: "short" },
    "en-US"
  );

  return `${startLabel} - ${endLabel}`;
}

function getWeekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

function getStatusCompletedCount(status: HabitPeriodStatusSnapshot): number {
  const opportunityCount = status.targetCount ?? 1;
  return Math.min(
    opportunityCount,
    Math.max(
      0,
      status.completedCount ?? (status.completed ? opportunityCount : 0)
    )
  );
}

function getDayPoint(
  date: string,
  summary: DailySummary | undefined,
  dailyStatuses: HabitPeriodStatusSnapshot[]
): WeeklyReviewDayPoint {
  const trackedHabitCount = dailyStatuses.length;
  const completedHabitCount = dailyStatuses.filter(
    (status) => status.completed
  ).length;
  const completionRate =
    trackedHabitCount === 0
      ? null
      : toRate(completedHabitCount, trackedHabitCount);

  let status: WeeklyReviewDayPoint["status"] = "empty";
  if (trackedHabitCount > 0) {
    if (summary?.dayStatus) {
      status = summary.dayStatus;
    } else if (summary?.freezeUsed) {
      status = "freeze";
    } else if (summary?.allCompleted) {
      status = "complete";
    } else {
      status = "missed";
    }
  }

  return {
    completedHabitCount,
    completionRate,
    date,
    label: formatDateKey(
      date,
      { day: "numeric", month: "short", weekday: "long" },
      "en-US"
    ),
    shortLabel: formatDateKey(date, { weekday: "short" }, "en-US"),
    status,
    trackedHabitCount,
  };
}

function buildHabitMetrics(
  habitStatuses: HabitPeriodStatusSnapshot[]
): WeeklyReviewHabitMetric[] {
  const metricsByHabit = new Map<number, WeeklyReviewHabitMetric>();

  for (const status of habitStatuses) {
    const opportunityCount = status.targetCount ?? 1;
    const completedCount = getStatusCompletedCount(status);
    const missedCount = opportunityCount - completedCount;
    const existing = metricsByHabit.get(status.habitId);
    if (existing) {
      existing.category = status.category;
      existing.opportunities += opportunityCount;
      existing.completedOpportunities += completedCount;
      existing.missedOpportunities += missedCount;
      existing.completionRate = toRate(
        existing.completedOpportunities,
        existing.opportunities
      );
      existing.frequency = status.frequency;
      existing.name = status.name;
      existing.sortOrder = status.sortOrder;
      continue;
    }

    metricsByHabit.set(status.habitId, {
      category: status.category,
      completedOpportunities: completedCount,
      completionRate: toRate(completedCount, opportunityCount),
      frequency: status.frequency,
      habitId: status.habitId,
      missedOpportunities: missedCount,
      name: status.name,
      opportunities: opportunityCount,
      sortOrder: status.sortOrder,
    });
  }

  return [...metricsByHabit.values()].toSorted((left, right) => {
    if (right.completionRate !== left.completionRate) {
      return right.completionRate - left.completionRate;
    }

    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.name.localeCompare(right.name);
  });
}

function isStatusScheduledForDate(
  status: HabitPeriodStatusSnapshot,
  date: string
): boolean {
  const weekday = parseDateKey(date).getDay() as HabitWeekday;

  return status.selectedWeekdays?.includes(weekday) ?? true;
}

function getHeatmapCellStatus(
  status: HabitPeriodStatusSnapshot | undefined,
  scheduled: boolean
): WeeklyReviewHabitHeatmapCell["status"] {
  if (!scheduled) {
    return "not-scheduled";
  }

  if (!status) {
    return "not-scheduled";
  }

  const opportunityCount = status.targetCount ?? 1;
  const completedCount = getStatusCompletedCount(status);

  if (completedCount >= opportunityCount) {
    return "complete";
  }

  return completedCount > 0 ? "partial" : "missed";
}

function buildHabitHeatmapRows(
  statusesInWeek: HabitPeriodStatusSnapshot[],
  weekDates: string[]
): WeeklyReviewHabitHeatmapRow[] {
  const dailyStatuses = statusesInWeek.filter(
    (status) => status.frequency === "daily"
  );
  const statusesByHabit = new Map<number, HabitPeriodStatusSnapshot[]>();

  for (const status of dailyStatuses) {
    const existing = statusesByHabit.get(status.habitId);
    if (existing) {
      existing.push(status);
      continue;
    }

    statusesByHabit.set(status.habitId, [status]);
  }

  return [...statusesByHabit.entries()]
    .map(([habitId, statuses]) => {
      const latestStatus =
        statuses.toSorted((left, right) =>
          right.periodEnd.localeCompare(left.periodEnd)
        )[0] ?? statuses[0];
      const statusByDate = new Map(
        statuses.map((status) => [status.periodEnd, status])
      );
      let completedOpportunities = 0;
      let missedOpportunities = 0;
      let opportunities = 0;
      const cells = weekDates.map((date) => {
        const status = statusByDate.get(date);
        const scheduled = status
          ? isStatusScheduledForDate(status, date)
          : false;
        const cellStatus = getHeatmapCellStatus(status, scheduled);

        if (cellStatus !== "not-scheduled") {
          const opportunityCount = status?.targetCount ?? 1;
          const completedCount = status ? getStatusCompletedCount(status) : 0;

          completedOpportunities += completedCount;
          missedOpportunities += opportunityCount - completedCount;
          opportunities += opportunityCount;
        }

        return {
          date,
          status: cellStatus,
          weekdayLabel: formatDateKey(date, { weekday: "short" }, "en-US"),
        };
      });

      return {
        category: latestStatus?.category ?? "productivity",
        cells,
        completedOpportunities,
        completionRate: toRate(completedOpportunities, opportunities),
        habitId,
        missedOpportunities,
        name: latestStatus?.name ?? `Habit ${habitId}`,
        opportunities,
        sortOrder: latestStatus?.sortOrder ?? habitId,
      };
    })
    .toSorted((left, right) => {
      if (left.completionRate !== right.completionRate) {
        return left.completionRate - right.completionRate;
      }

      if (left.missedOpportunities !== right.missedOpportunities) {
        return right.missedOpportunities - left.missedOpportunities;
      }

      if (left.opportunities !== right.opportunities) {
        return right.opportunities - left.opportunities;
      }

      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder;
      }

      return left.name.localeCompare(right.name);
    })
    .map(({ sortOrder: _sortOrder, ...row }) => row);
}

function getMostMissedHabits(
  habitMetrics: WeeklyReviewHabitMetric[]
): WeeklyReviewHabitMetric[] {
  return habitMetrics
    .filter((metric) => metric.missedOpportunities > 0)
    .toSorted((left, right) => {
      if (right.missedOpportunities !== left.missedOpportunities) {
        return right.missedOpportunities - left.missedOpportunities;
      }

      if (left.completionRate !== right.completionRate) {
        return left.completionRate - right.completionRate;
      }

      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder;
      }

      return left.name.localeCompare(right.name);
    })
    .slice(0, 5);
}

function getOpportunityCompletionRate(
  habitMetrics: WeeklyReviewHabitMetric[]
): number {
  let completedOpportunities = 0;
  let totalOpportunities = 0;

  for (const metric of habitMetrics) {
    completedOpportunities += metric.completedOpportunities;
    totalOpportunities += metric.opportunities;
  }

  return toRate(completedOpportunities, totalOpportunities);
}

function getLongestCleanRun(dailySummaries: DailySummary[]): number {
  let longest = 0;
  let current = 0;

  for (const summary of dailySummaries.toSorted((left, right) =>
    left.date.localeCompare(right.date)
  )) {
    if (summary.allCompleted && !summary.freezeUsed && !summary.dayStatus) {
      current += 1;
      longest = Math.max(longest, current);
      continue;
    }

    current = 0;
  }

  return longest;
}

function getFocusMinutes(focusSessions: FocusSession[]): number {
  return toFocusMinutes(
    focusSessions.reduce(
      (totalSeconds, session) => totalSeconds + session.durationSeconds,
      0
    )
  );
}

export function buildWeeklyReview({
  dailySummaries,
  focusSessions,
  habitStatuses,
  weekStart,
}: BuildWeeklyReviewOptions): WeeklyReview {
  const weekEnd = endOfIsoWeek(weekStart);
  const summariesInWeek = dailySummaries
    .filter((summary) => summary.date >= weekStart && summary.date <= weekEnd)
    .toSorted((left, right) => left.date.localeCompare(right.date));
  const focusSessionsInWeek = focusSessions.filter(
    (session) =>
      session.completedDate >= weekStart && session.completedDate <= weekEnd
  );
  const statusesInWeek = habitStatuses
    .filter(
      (status) => status.periodEnd >= weekStart && status.periodEnd <= weekEnd
    )
    .toSorted((left, right) => {
      if (left.periodEnd !== right.periodEnd) {
        return left.periodEnd.localeCompare(right.periodEnd);
      }

      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder;
      }

      return left.name.localeCompare(right.name);
    });
  const summaryByDate = new Map(
    summariesInWeek.map((summary) => [summary.date, summary])
  );
  const dailyStatusesByDate = new Map<string, HabitPeriodStatusSnapshot[]>();
  const weekDates = getWeekDates(weekStart);

  for (const status of statusesInWeek.filter(
    (item) => item.frequency === "daily"
  )) {
    const existing = dailyStatusesByDate.get(status.periodEnd);
    if (existing) {
      existing.push(status);
      continue;
    }

    dailyStatusesByDate.set(status.periodEnd, [status]);
  }

  const dailyCadence = weekDates.map((date) =>
    getDayPoint(
      date,
      summaryByDate.get(date),
      dailyStatusesByDate.get(date) ?? []
    )
  );
  const trackedDays = summariesInWeek.length;
  const completedDays = summariesInWeek.filter(
    (summary) => summary.allCompleted
  ).length;
  const freezeDays = summariesInWeek.filter(
    (summary) => summary.freezeUsed
  ).length;
  const sickDays = summariesInWeek.filter(
    (summary) => summary.dayStatus === "sick"
  ).length;
  const restDays = summariesInWeek.filter(
    (summary) => summary.dayStatus === "rest"
  ).length;
  const rescheduledDays = summariesInWeek.filter(
    (summary) => summary.dayStatus === "rescheduled"
  ).length;
  const missedDays =
    trackedDays -
    completedDays -
    freezeDays -
    sickDays -
    restDays -
    rescheduledDays;
  const habitMetrics = buildHabitMetrics(statusesInWeek);

  return {
    completedDays,
    completionRate: getOpportunityCompletionRate(habitMetrics),
    dailyCadence,
    endingStreak: summariesInWeek.at(-1)?.streakCountAfterDay ?? null,
    focusMinutes: getFocusMinutes(focusSessionsInWeek),
    freezeDays,
    habitHeatmapRows: buildHabitHeatmapRows(statusesInWeek, weekDates),
    habitMetrics,
    label: getWeekLabel(weekStart, weekEnd),
    longestCleanRun: getLongestCleanRun(summariesInWeek),
    missedDays,
    mostMissedHabits: getMostMissedHabits(habitMetrics),
    rescheduledDays,
    restDays,
    sickDays,
    trackedDays,
    weekEnd,
    weekStart,
  };
}

function toListItem(review: WeeklyReview): WeeklyReviewListItem {
  return {
    completionRate: review.completionRate,
    label: review.label,
    weekEnd: review.weekEnd,
    weekStart: review.weekStart,
  };
}

function toTrendPoint(review: WeeklyReview): WeeklyReviewTrendPoint {
  return {
    completedDays: review.completedDays,
    completionRate: review.completionRate,
    focusMinutes: review.focusMinutes,
    freezeDays: review.freezeDays,
    label: review.label,
    missedDays: review.missedDays,
    rescheduledDays: review.rescheduledDays,
    restDays: review.restDays,
    sickDays: review.sickDays,
    weekEnd: review.weekEnd,
    weekStart: review.weekStart,
  };
}

function collectAvailableWeekStarts(
  dailySummaries: DailySummary[],
  habitStatuses: HabitPeriodStatusSnapshot[]
): string[] {
  return [
    ...new Set(
      [
        ...dailySummaries.map((summary) => startOfIsoWeek(summary.date)),
        ...habitStatuses.map((status) => startOfIsoWeek(status.periodEnd)),
      ].filter(Boolean)
    ),
  ].toSorted((left, right) => right.localeCompare(left));
}

export function buildWeeklyReviewOverview({
  dailySummaries,
  focusSessions,
  habitStatuses,
}: BuildWeeklyReviewOverviewOptions): WeeklyReviewOverview {
  const availableWeekStarts = collectAvailableWeekStarts(
    dailySummaries,
    habitStatuses
  );
  const reviews = availableWeekStarts.map((weekStart) =>
    buildWeeklyReview({
      dailySummaries,
      focusSessions,
      habitStatuses,
      weekStart,
    })
  );
  const latestReview = reviews[0] ?? null;

  return {
    availableWeeks: reviews.map((review) => toListItem(review)),
    latestReview,
    trend: reviews
      .slice(0, 8)
      .toReversed()
      .map((review) => toTrendPoint(review)),
  };
}
