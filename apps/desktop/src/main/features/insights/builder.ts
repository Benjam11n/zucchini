import type { FocusSession } from "@/shared/domain/focus-session";
import { toFocusMinutes } from "@/shared/domain/focus-session";
import type { HabitCategory } from "@/shared/domain/habit";
import type { HabitPeriodStatusSnapshot } from "@/shared/domain/habit-period-status-snapshot";
import type {
  InsightsDashboard,
  InsightsHabitLeaderboardItem,
  InsightsMomentum,
  InsightsSmartInsight,
  InsightsWeekdayRhythm,
  InsightsWeeklyCompletion,
} from "@/shared/domain/insights";
import type { DailySummary, StreakState } from "@/shared/domain/streak";
import {
  addDays,
  endOfIsoWeek,
  formatDateKey,
  startOfIsoWeek,
  startOfMonth,
} from "@/shared/utils/date";

interface BuildInsightsDashboardOptions {
  dailySummaries: DailySummary[];
  focusSessions: FocusSession[];
  habitStatuses: HabitPeriodStatusSnapshot[];
  nowDate: string;
  streak: StreakState;
  timezone: string;
}

interface OpportunityTotals {
  completed: number;
  total: number;
}

interface HabitMetric extends OpportunityTotals {
  category: HabitCategory;
  habitId: number;
  name: string;
  sortOrder: number;
  trend: number[];
}

const CURRENT_PERIOD_DAYS = 90;
const PREVIOUS_PERIOD_DAYS = 90;
const WEEKDAY_LABELS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const WEEKDAY_SHORT_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_OF_DAY_BUCKETS = [
  { endHour: 11, label: "Morning", startHour: 5, subtitle: "5am - 11am" },
  { endHour: 17, label: "Afternoon", startHour: 11, subtitle: "11am - 5pm" },
  { endHour: 23, label: "Evening", startHour: 17, subtitle: "5pm - 11pm" },
  { endHour: 5, label: "Night", startHour: 23, subtitle: "11pm - 5am" },
] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toRate(completed: number, total: number): number {
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

function toSignedPercentLabel(value: number): string {
  if (value === 0) {
    return "0%";
  }

  return `${value > 0 ? "+" : ""}${value}%`;
}

function getStatusCompletedCount(status: HabitPeriodStatusSnapshot): number {
  const targetCount = status.targetCount ?? 1;
  return Math.min(
    targetCount,
    Math.max(0, status.completedCount ?? (status.completed ? targetCount : 0))
  );
}

function getOpportunityTotals(
  statuses: HabitPeriodStatusSnapshot[]
): OpportunityTotals {
  const totals = { completed: 0, total: 0 };

  for (const status of statuses) {
    const targetCount = status.targetCount ?? 1;

    totals.completed += getStatusCompletedCount(status);
    totals.total += targetCount;
  }

  return totals;
}

function getFocusMinutes(sessions: FocusSession[]): number {
  return toFocusMinutes(
    sessions.reduce(
      (totalSeconds, session) => totalSeconds + session.durationSeconds,
      0
    )
  );
}

function formatFocusMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes === 0
    ? `${hours}h`
    : `${hours}h ${remainingMinutes}m`;
}

function getDeltaMetricLabel(current: number, previous: number): string {
  const delta = current - previous;
  if (delta === 0) {
    return "No change vs previous period";
  }

  return `${delta > 0 ? "+" : ""}${delta.toLocaleString()} vs previous period`;
}

function getCompletionRateForRange(
  statuses: HabitPeriodStatusSnapshot[],
  start: string,
  end: string
): number {
  const totals = getOpportunityTotals(
    statuses.filter(
      (status) => status.periodEnd >= start && status.periodEnd <= end
    )
  );

  return toRate(totals.completed, totals.total);
}

function buildMomentum({
  currentRate,
  previousRate,
  streak,
  sparkline,
}: {
  currentRate: number;
  previousRate: number;
  sparkline: number[];
  streak: StreakState;
}): InsightsMomentum {
  const trendScore = clamp(50 + (currentRate - previousRate) * 2, 0, 100);
  const streakScore = clamp(streak.currentStreak * 8, 0, 100);
  const score = Math.round(
    currentRate * 0.65 + trendScore * 0.2 + streakScore * 0.15
  );

  let label = "Building momentum";
  if (score >= 80) {
    label = "Strong momentum";
  } else if (score < 50) {
    label = "Needs attention";
  }

  return {
    label,
    score,
    sparkline,
  };
}

function buildWeeklyCompletion(
  statuses: HabitPeriodStatusSnapshot[],
  nowDate: string
): InsightsWeeklyCompletion[] {
  const latestWeekStart = startOfIsoWeek(nowDate);
  const weekStarts = Array.from({ length: 8 }, (_, index) =>
    addDays(latestWeekStart, (index - 7) * 7)
  );

  return weekStarts.map((weekStart) => {
    const weekEnd = endOfIsoWeek(weekStart);
    const weekStatuses = statuses.filter(
      (status) => status.periodEnd >= weekStart && status.periodEnd <= weekEnd
    );
    const totals = { completed: 0, missed: 0, partial: 0, total: 0 };

    for (const status of weekStatuses) {
      const targetCount = status.targetCount ?? 1;
      const completedCount = getStatusCompletedCount(status);

      if (completedCount >= targetCount) {
        totals.completed += targetCount;
      } else if (completedCount > 0) {
        totals.partial += completedCount;
      }

      totals.missed += targetCount - completedCount;
      totals.total += targetCount;
    }

    const completedPercent = toRate(totals.completed, totals.total);
    const partialPercent = toRate(totals.partial, totals.total);
    const missedPercent = clamp(toRate(totals.missed, totals.total), 0, 100);

    return {
      completedPercent,
      label: formatDateKey(
        weekStart,
        { day: "numeric", month: "short" },
        "en-US"
      ),
      missedPercent,
      partialPercent,
      weekEnd,
      weekStart,
    };
  });
}

function getLocalCompletionParts(
  completedAt: string,
  timezone: string
): { hour: number; weekdayIndex: number } | null {
  const date = new Date(completedAt);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone: timezone,
    weekday: "short",
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const weekday = parts.find((part) => part.type === "weekday")?.value;
  const weekdayIndex = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ].indexOf(weekday ?? "");

  if (!Number.isFinite(hour) || weekdayIndex === -1) {
    return null;
  }

  return { hour, weekdayIndex };
}

function getTimeOfDayIndex(hour: number): number {
  return TIME_OF_DAY_BUCKETS.findIndex((bucket) => {
    if (bucket.startHour < bucket.endHour) {
      return hour >= bucket.startHour && hour < bucket.endHour;
    }

    return hour >= bucket.startHour || hour < bucket.endHour;
  });
}

function buildWeekdayRhythm(
  statuses: HabitPeriodStatusSnapshot[],
  currentStart: string,
  nowDate: string,
  timezone: string
): InsightsWeekdayRhythm {
  const counts = Array.from({ length: TIME_OF_DAY_BUCKETS.length }, () =>
    Array.from({ length: WEEKDAY_SHORT_LABELS.length }, () => 0)
  );

  for (const status of statuses) {
    if (
      !status.completed ||
      !status.completedAt ||
      status.periodEnd < currentStart ||
      status.periodEnd > nowDate
    ) {
      continue;
    }

    const parts = getLocalCompletionParts(status.completedAt, timezone);
    if (!parts) {
      continue;
    }

    const timeOfDayIndex = getTimeOfDayIndex(parts.hour);
    if (timeOfDayIndex < 0) {
      continue;
    }

    const row = counts[timeOfDayIndex];
    if (!row) {
      continue;
    }

    row[parts.weekdayIndex] = (row[parts.weekdayIndex] ?? 0) + 1;
  }

  const maxCompletionCount = Math.max(0, ...counts.flat());

  return {
    cells: counts.flatMap((row, timeOfDayIndex) =>
      row.map((completionCount, weekdayIndex) => {
        const bucket = TIME_OF_DAY_BUCKETS[timeOfDayIndex] ?? {
          label: "Time",
        };
        const weekday = WEEKDAY_SHORT_LABELS[weekdayIndex] ?? "Day";
        return {
          completionCount,
          intensity:
            maxCompletionCount === 0
              ? 0
              : Math.round((completionCount / maxCompletionCount) * 100),
          label:
            completionCount === 1
              ? `${weekday} ${bucket.label}: 1 completion`
              : `${weekday} ${bucket.label}: ${completionCount} completions`,
          timeOfDay: bucket.label,
          weekday,
        };
      })
    ),
    hasData: maxCompletionCount > 0,
    maxCompletionCount,
    subtitle: "Completion timing from recorded habit completions",
    timeOfDayLabels: TIME_OF_DAY_BUCKETS.map(
      (bucket) => `${bucket.label}\n${bucket.subtitle}`
    ),
    title: "Weekday rhythm by time of day",
    weekdayLabels: WEEKDAY_SHORT_LABELS,
  };
}

function buildSparkline(
  statuses: HabitPeriodStatusSnapshot[],
  rangeStart: string,
  nowDate: string
): number[] {
  return Array.from({ length: 12 }, (_, index) => {
    const start = addDays(rangeStart, index * 7);
    const end = index === 11 ? nowDate : addDays(start, 6);
    return getCompletionRateForRange(statuses, start, end);
  });
}

function buildMetricTrend({
  getValue,
  periodStart,
  nowDate,
}: {
  getValue: (start: string, end: string) => number;
  nowDate: string;
  periodStart: string;
}): number[] {
  return Array.from({ length: 6 }, (_, index) => {
    const start = addDays(periodStart, index * 5);
    const end = index === 5 ? nowDate : addDays(start, 4);
    return getValue(start, end);
  });
}

function buildHabitLeaderboard(
  statuses: HabitPeriodStatusSnapshot[],
  currentStart: string,
  nowDate: string
): InsightsHabitLeaderboardItem[] {
  const statusesInRange = statuses.filter(
    (status) => status.periodEnd >= currentStart && status.periodEnd <= nowDate
  );
  const metrics = new Map<number, HabitMetric>();

  for (const status of statusesInRange) {
    const targetCount = status.targetCount ?? 1;
    const existing = metrics.get(status.habitId) ?? {
      category: status.category,
      completed: 0,
      habitId: status.habitId,
      name: status.name,
      sortOrder: status.sortOrder,
      total: 0,
      trend: [],
    };

    existing.category = status.category;
    existing.completed += getStatusCompletedCount(status);
    existing.name = status.name;
    existing.sortOrder = status.sortOrder;
    existing.total += targetCount;
    metrics.set(status.habitId, existing);
  }

  for (const metric of metrics.values()) {
    metric.trend = Array.from({ length: 8 }, (_, index) => {
      const start = addDays(currentStart, index * 11);
      const end = index === 7 ? nowDate : addDays(start, 10);
      const habitStatuses = statusesInRange.filter(
        (status) =>
          status.habitId === metric.habitId &&
          status.periodEnd >= start &&
          status.periodEnd <= end
      );
      const totals = getOpportunityTotals(habitStatuses);
      return toRate(totals.completed, totals.total);
    });
  }

  return [...metrics.values()]
    .filter((metric) => metric.total > 0)
    .toSorted((left, right) => {
      const rateDelta =
        toRate(right.completed, right.total) -
        toRate(left.completed, left.total);
      if (rateDelta !== 0) {
        return rateDelta;
      }

      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder;
      }

      return left.name.localeCompare(right.name);
    })
    .slice(0, 5)
    .map((metric, index) => ({
      category: metric.category,
      completionRate: toRate(metric.completed, metric.total),
      habitId: metric.habitId,
      name: metric.name,
      rank: index + 1,
      trend: metric.trend,
    }));
}

function getWeakestWeekday(
  statuses: HabitPeriodStatusSnapshot[],
  currentStart: string,
  nowDate: string
): { label: string; rate: number } | null {
  const totalsByWeekday = new Map<number, OpportunityTotals>();

  for (const status of statuses) {
    if (
      status.frequency !== "daily" ||
      status.periodEnd < currentStart ||
      status.periodEnd > nowDate
    ) {
      continue;
    }

    const weekday = (new Date(`${status.periodEnd}T00:00:00`).getDay() + 6) % 7;
    const totals = totalsByWeekday.get(weekday) ?? { completed: 0, total: 0 };
    totals.completed += getStatusCompletedCount(status);
    totals.total += status.targetCount ?? 1;
    totalsByWeekday.set(weekday, totals);
  }

  const candidates = [...totalsByWeekday.entries()].filter(
    ([, totals]) => totals.total > 0
  );
  if (candidates.length === 0) {
    return null;
  }

  const [weakest] = candidates.toSorted(
    (left, right) =>
      toRate(left[1].completed, left[1].total) -
      toRate(right[1].completed, right[1].total)
  );

  if (!weakest) {
    return null;
  }

  const [weekday, totals] = weakest;

  return {
    label: WEEKDAY_LABELS[weekday] ?? "Weekdays",
    rate: toRate(totals.completed, totals.total),
  };
}

function getStrongestCategory(
  statuses: HabitPeriodStatusSnapshot[],
  currentStart: string,
  nowDate: string
): { category: HabitCategory; rate: number } | null {
  const totalsByCategory = new Map<HabitCategory, OpportunityTotals>();

  for (const status of statuses) {
    if (status.periodEnd < currentStart || status.periodEnd > nowDate) {
      continue;
    }

    const totals = totalsByCategory.get(status.category) ?? {
      completed: 0,
      total: 0,
    };
    totals.completed += getStatusCompletedCount(status);
    totals.total += status.targetCount ?? 1;
    totalsByCategory.set(status.category, totals);
  }

  const candidates = [...totalsByCategory.entries()].filter(
    ([, totals]) => totals.total > 0
  );
  if (candidates.length === 0) {
    return null;
  }

  const [strongest] = candidates.toSorted(
    (left, right) =>
      toRate(right[1].completed, right[1].total) -
      toRate(left[1].completed, left[1].total)
  );

  if (!strongest) {
    return null;
  }

  const [category, totals] = strongest;

  return {
    category,
    rate: toRate(totals.completed, totals.total),
  };
}

function buildSmartInsights({
  currentRate,
  currentStart,
  nowDate,
  previousRate,
  statuses,
}: {
  currentRate: number;
  currentStart: string;
  nowDate: string;
  previousRate: number;
  statuses: HabitPeriodStatusSnapshot[];
}): InsightsSmartInsight[] {
  const insights: InsightsSmartInsight[] = [
    {
      body:
        currentRate >= previousRate
          ? `Completion rate is ${toSignedPercentLabel(currentRate - previousRate)} vs previous 90 days.`
          : `Completion rate is ${toSignedPercentLabel(currentRate - previousRate)} vs previous 90 days.`,
      severity: currentRate >= previousRate ? "positive" : "warning",
      title:
        currentRate >= previousRate
          ? "Consistency is improving."
          : "Consistency is slipping.",
    },
  ];
  const weakestWeekday = getWeakestWeekday(statuses, currentStart, nowDate);
  if (weakestWeekday) {
    insights.push({
      body: `${weakestWeekday.label}s have the lowest completion rate at ${weakestWeekday.rate}%.`,
      severity: "warning",
      title: `${weakestWeekday.label}s need attention.`,
    });
  }

  const strongestCategory = getStrongestCategory(
    statuses,
    currentStart,
    nowDate
  );
  if (strongestCategory) {
    insights.push({
      body: `${strongestCategory.rate}% completion across recent opportunities.`,
      severity: "positive",
      title: `${strongestCategory.category} is your strongest category.`,
    });
  }

  return insights.slice(0, 3);
}

export function buildInsightsDashboard({
  dailySummaries,
  focusSessions,
  habitStatuses,
  nowDate,
  streak,
  timezone,
}: BuildInsightsDashboardOptions): InsightsDashboard {
  const currentStart = addDays(nowDate, -(CURRENT_PERIOD_DAYS - 1));
  const previousStart = addDays(currentStart, -PREVIOUS_PERIOD_DAYS);
  const previousEnd = addDays(currentStart, -1);
  const currentMonthStart = startOfMonth(nowDate);
  const currentStatuses = habitStatuses.filter(
    (status) => status.periodEnd >= currentStart && status.periodEnd <= nowDate
  );
  const previousStatuses = habitStatuses.filter(
    (status) =>
      status.periodEnd >= previousStart && status.periodEnd <= previousEnd
  );
  const monthStatuses = habitStatuses.filter(
    (status) =>
      status.periodEnd >= currentMonthStart && status.periodEnd <= nowDate
  );
  const previousMonthStart = addDays(currentMonthStart, -30);
  const previousMonthStatuses = habitStatuses.filter(
    (status) =>
      status.periodEnd >= previousMonthStart &&
      status.periodEnd < currentMonthStart
  );
  const currentTotals = getOpportunityTotals(currentStatuses);
  const previousTotals = getOpportunityTotals(previousStatuses);
  const monthTotals = getOpportunityTotals(monthStatuses);
  const previousMonthTotals = getOpportunityTotals(previousMonthStatuses);
  const currentRate = toRate(currentTotals.completed, currentTotals.total);
  const previousRate = toRate(previousTotals.completed, previousTotals.total);
  const focusMinutes = getFocusMinutes(
    focusSessions.filter(
      (session) =>
        session.completedDate >= currentMonthStart &&
        session.completedDate <= nowDate
    )
  );
  const previousFocusMinutes = getFocusMinutes(
    focusSessions.filter(
      (session) =>
        session.completedDate >= previousMonthStart &&
        session.completedDate < currentMonthStart
    )
  );
  const currentMonthSummaries = dailySummaries.filter(
    (summary) => summary.date >= currentMonthStart && summary.date <= nowDate
  );
  const previousMonthSummaries = dailySummaries.filter(
    (summary) =>
      summary.date >= previousMonthStart && summary.date < currentMonthStart
  );
  const perfectDays = currentMonthSummaries.filter(
    (summary) => summary.allCompleted
  ).length;
  const previousPerfectDays = previousMonthSummaries.filter(
    (summary) => summary.allCompleted
  ).length;
  const savedStreaks = currentMonthSummaries.filter(
    (summary) => summary.freezeUsed
  ).length;
  const previousSavedStreaks = previousMonthSummaries.filter(
    (summary) => summary.freezeUsed
  ).length;
  const sparkline = buildSparkline(habitStatuses, currentStart, nowDate);
  const momentum = buildMomentum({
    currentRate,
    previousRate,
    sparkline,
    streak,
  });
  const statusTrend = buildMetricTrend({
    getValue: (start, end) =>
      getOpportunityTotals(
        habitStatuses.filter(
          (status) => status.periodEnd >= start && status.periodEnd <= end
        )
      ).completed,
    nowDate,
    periodStart: currentMonthStart,
  });
  const focusTrend = buildMetricTrend({
    getValue: (start, end) =>
      getFocusMinutes(
        focusSessions.filter(
          (session) =>
            session.completedDate >= start && session.completedDate <= end
        )
      ),
    nowDate,
    periodStart: currentMonthStart,
  });
  const perfectDayTrend = buildMetricTrend({
    getValue: (start, end) =>
      dailySummaries.filter(
        (summary) =>
          summary.date >= start && summary.date <= end && summary.allCompleted
      ).length,
    nowDate,
    periodStart: currentMonthStart,
  });
  const savedStreakTrend = buildMetricTrend({
    getValue: (start, end) =>
      dailySummaries.filter(
        (summary) =>
          summary.date >= start && summary.date <= end && summary.freezeUsed
      ).length,
    nowDate,
    periodStart: currentMonthStart,
  });

  return {
    generatedAtDate: nowDate,
    habitLeaderboard: buildHabitLeaderboard(
      habitStatuses,
      currentStart,
      nowDate
    ),
    isEmpty: currentTotals.total === 0 && dailySummaries.length === 0,
    momentum,
    period: {
      currentEnd: nowDate,
      currentStart,
      label: "Last 90 days",
    },
    smartInsights: buildSmartInsights({
      currentRate,
      currentStart,
      nowDate,
      previousRate,
      statuses: habitStatuses,
    }),
    summary: {
      completed: {
        deltaLabel: getDeltaMetricLabel(
          monthTotals.completed,
          previousMonthTotals.completed
        ),
        label: "Completed",
        trend: statusTrend,
        value: monthTotals.completed.toLocaleString(),
      },
      focus: {
        deltaLabel: getDeltaMetricLabel(focusMinutes, previousFocusMinutes),
        label: "Focus hours",
        trend: focusTrend,
        value: formatFocusMinutes(focusMinutes),
      },
      perfectDays: {
        deltaLabel: getDeltaMetricLabel(perfectDays, previousPerfectDays),
        label: "Perfect days",
        trend: perfectDayTrend,
        value: perfectDays.toLocaleString(),
      },
      savedStreaks: {
        deltaLabel: getDeltaMetricLabel(savedStreaks, previousSavedStreaks),
        label: "Saved streaks",
        trend: savedStreakTrend,
        value: savedStreaks.toLocaleString(),
      },
    },
    weekdayRhythm: buildWeekdayRhythm(
      currentStatuses,
      currentStart,
      nowDate,
      timezone
    ),
    weeklyCompletion: buildWeeklyCompletion(currentStatuses, nowDate),
  };
}
