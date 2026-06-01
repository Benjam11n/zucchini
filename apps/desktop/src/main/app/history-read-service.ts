import { buildInsightsDashboard } from "@/main/features/insights/builder";
import {
  buildHistoricalHabitsByDate,
  buildHistoryDay,
  buildHistorySummaryDay,
  buildTodayPreviewSummary,
} from "@/main/features/today/state-builder";
import {
  buildWeeklyReview,
  buildWeeklyReviewOverview,
} from "@/main/features/weekly-review/builder";
import type { AppRepository } from "@/main/ports/app-repository";
import {
  addDays,
  endOfIsoWeek,
  getPreviousCompletedIsoWeek,
  startOfIsoWeek,
} from "@/shared/domain/date-key";
import { getHabitCategoryProgress, isDailyHabit } from "@/shared/domain/habit";
import type { HabitWithStatus } from "@/shared/domain/habit";
import type { HistoryDay, HistorySummaryDay } from "@/shared/domain/history";
import type {
  InsightsDashboard,
  InsightsRangeDays,
} from "@/shared/domain/insights";
import type { DailySummary } from "@/shared/domain/streak";
import type {
  WeeklyReview,
  WeeklyReviewOverview,
} from "@/shared/domain/weekly-review";
import type { TodayState } from "@/shared/read-models/today-state";

import { ApplicationServiceRuntime } from "./application-service-runtime";
import { ApplicationServiceSlice } from "./application-service-slice";

interface HistoryListContext {
  focusMinutesByDate: Map<string, number>;
  historicalHabitsByDate: Map<string, HabitWithStatus[]>;
  todayState: TodayState;
  settledSummaries: ReturnType<AppRepository["getSettledHistory"]>;
}

interface HistoryRangeContext {
  focusMinutesByDate: Map<string, number>;
  historicalHabitsByDate: Map<string, HabitWithStatus[]>;
  includeToday: boolean;
  settledSummaries: ReturnType<AppRepository["getDailySummariesInRange"]>;
  todayState: TodayState;
}

export class HistoryReadService extends ApplicationServiceSlice {
  private buildTodayHistoryDay(
    todayState: TodayState,
    focusMinutesByDate: Map<string, number>
  ): HistoryDay {
    return buildHistoryDay(
      buildTodayPreviewSummary(todayState, this.clock.now().toISOString()),
      this.repository.getHabitsWithStatus(this.getTodayKey()),
      focusMinutesByDate.get(todayState.date) ?? 0,
      this.repository.getFocusQuotaGoalsWithStatusForDate(todayState.date)
    );
  }

  private buildSettledHistoryDay(
    summary: DailySummary,
    historicalHabitsByDate: Map<string, HabitWithStatus[]>,
    focusMinutesByDate: Map<string, number>
  ): HistoryDay {
    return buildHistoryDay(
      summary,
      historicalHabitsByDate.get(summary.date) ?? [],
      focusMinutesByDate.get(summary.date) ?? 0,
      this.repository.getHistoricalFocusQuotaGoalsWithStatus(summary.date)
    );
  }

  getHistory(limit?: number): HistoryDay[] {
    return this.withSyncedRead("getHistory", () => {
      const {
        focusMinutesByDate,
        historicalHabitsByDate,
        settledSummaries,
        todayState,
      } = this.buildHistoryListContext(limit);

      return [
        this.buildTodayHistoryDay(todayState, focusMinutesByDate),
        ...settledSummaries.map((summary) =>
          this.buildSettledHistoryDay(
            summary,
            historicalHabitsByDate,
            focusMinutesByDate
          )
        ),
      ];
    });
  }

  getHistoryYears(): number[] {
    return this.withSyncedRead("getHistoryYears", () =>
      [
        ...new Set([
          Number.parseInt(this.buildCurrentTodayState().date.slice(0, 4), 10),
          ...this.repository.getSettledHistoryYears(),
        ]),
      ].toSorted((left, right) => right - left)
    );
  }

  private buildHistoryRangeContext(
    rangeStart: string,
    rangeEnd: string
  ): HistoryRangeContext | null {
    const todayState = this.buildCurrentTodayState();
    const includeToday =
      todayState.date >= rangeStart && todayState.date <= rangeEnd;
    const settledSummaries = this.repository
      .getDailySummariesInRange(rangeStart, rangeEnd)
      .filter((summary) => summary.date !== todayState.date);

    if (!includeToday && settledSummaries.length === 0) {
      return null;
    }

    const oldestDate =
      settledSummaries[0]?.date ??
      (includeToday ? todayState.date : rangeStart);
    const newestDate = includeToday
      ? todayState.date
      : (settledSummaries.at(-1)?.date ?? rangeEnd);
    const focusMinutesByDate =
      ApplicationServiceRuntime.buildFocusMinutesByDate(
        this.repository.getFocusSessionsInRange(oldestDate, newestDate)
      );
    const historicalHabitsByDate =
      settledSummaries.length > 0
        ? buildHistoricalHabitsByDate(
            settledSummaries,
            this.repository.getHistoricalHabitPeriodStatusesOverlappingRange(
              oldestDate,
              newestDate
            )
          )
        : new Map();

    return {
      focusMinutesByDate,
      historicalHabitsByDate,
      includeToday,
      settledSummaries,
      todayState,
    };
  }

  private buildTodayHistorySummary(
    todayState: TodayState,
    focusMinutesByDate: Map<string, number>
  ): HistorySummaryDay {
    return buildHistorySummaryDay({
      categoryProgress: getHabitCategoryProgress(
        this.repository
          .getHabitsWithStatus(this.getTodayKey())
          .filter(isDailyHabit)
      ),
      date: todayState.date,
      focusMinutes: focusMinutesByDate.get(todayState.date) ?? 0,
      summary: buildTodayPreviewSummary(
        todayState,
        this.clock.now().toISOString()
      ),
    });
  }

  private buildHistorySummariesFromRangeContext(
    context: HistoryRangeContext
  ): HistorySummaryDay[] {
    const todayHistory = context.includeToday
      ? [
          this.buildTodayHistorySummary(
            context.todayState,
            context.focusMinutesByDate
          ),
        ]
      : [];

    return [
      ...todayHistory,
      ...context.settledSummaries.toReversed().map((summary) =>
        buildHistorySummaryDay({
          categoryProgress: getHabitCategoryProgress(
            (context.historicalHabitsByDate.get(summary.date) ?? []).filter(
              isDailyHabit
            )
          ),
          date: summary.date,
          focusMinutes: context.focusMinutesByDate.get(summary.date) ?? 0,
          summary,
        })
      ),
    ];
  }

  getHistoryForYear(year: number): HistoryDay[] {
    return this.withSyncedRead("getHistoryForYear", () => {
      const context = this.buildHistoryRangeContext(
        `${year}-01-01`,
        `${year}-12-31`
      );

      if (!context) {
        return [];
      }

      const todayHistory = context.includeToday
        ? [
            this.buildTodayHistoryDay(
              context.todayState,
              context.focusMinutesByDate
            ),
          ]
        : [];

      return [
        ...todayHistory,
        ...context.settledSummaries
          .toReversed()
          .map((summary) =>
            this.buildSettledHistoryDay(
              summary,
              context.historicalHabitsByDate,
              context.focusMinutesByDate
            )
          ),
      ];
    });
  }

  getHistorySummaryForYear(year: number): HistorySummaryDay[] {
    return this.withSyncedRead("getHistorySummaryForYear", () => {
      const context = this.buildHistoryRangeContext(
        `${year}-01-01`,
        `${year}-12-31`
      );

      if (!context) {
        return [];
      }

      return this.buildHistorySummariesFromRangeContext(context);
    });
  }

  getHistorySummaryForMonth(year: number, month: number): HistorySummaryDay[] {
    return this.withSyncedRead("getHistorySummaryForMonth", () => {
      const rangeStart = `${year}-${String(month).padStart(2, "0")}-01`;
      const rangeEndDate = new Date(year, month, 0);
      const rangeEnd = `${year}-${String(month).padStart(2, "0")}-${String(
        rangeEndDate.getDate()
      ).padStart(2, "0")}`;
      const context = this.buildHistoryRangeContext(rangeStart, rangeEnd);

      if (!context) {
        return [];
      }

      return this.buildHistorySummariesFromRangeContext(context);
    });
  }

  getHistoryDay(date: string): HistoryDay {
    return this.withSyncedRead("getHistoryDay", () => {
      const todayState = this.buildCurrentTodayState();

      if (date === todayState.date) {
        return buildHistoryDay(
          buildTodayPreviewSummary(todayState, this.clock.now().toISOString()),
          this.repository.getHabitsWithStatus(this.getTodayKey()),
          todayState.focusMinutes,
          this.repository.getFocusQuotaGoalsWithStatusForDate(todayState.date)
        );
      }

      const [summary] = this.repository.getDailySummariesInRange(date, date);

      if (!summary) {
        throw new Error(`History day ${date} was not found.`);
      }

      const focusMinutes =
        ApplicationServiceRuntime.buildFocusMinutesByDate(
          this.repository.getFocusSessionsInRange(date, date)
        ).get(date) ?? 0;
      const habitsByDate = buildHistoricalHabitsByDate(
        [summary],
        this.repository.getHistoricalHabitPeriodStatusesOverlappingRange(
          date,
          date
        )
      );

      return buildHistoryDay(
        summary,
        habitsByDate.get(date) ?? [],
        focusMinutes,
        this.repository.getHistoricalFocusQuotaGoalsWithStatus(date)
      );
    });
  }

  getHistorySummary(limit?: number): HistorySummaryDay[] {
    return this.withSyncedRead("getHistorySummary", () => {
      const {
        focusMinutesByDate,
        historicalHabitsByDate,
        settledSummaries,
        todayState,
      } = this.buildHistoryListContext(limit);

      return [
        this.buildTodayHistorySummary(todayState, focusMinutesByDate),
        ...settledSummaries.map((summary) =>
          buildHistorySummaryDay({
            categoryProgress: getHabitCategoryProgress(
              (historicalHabitsByDate.get(summary.date) ?? []).filter(
                isDailyHabit
              )
            ),
            date: summary.date,
            focusMinutes: focusMinutesByDate.get(summary.date) ?? 0,
            summary,
          })
        ),
      ];
    });
  }

  private buildHistoryListContext(limit?: number): HistoryListContext {
    const todayState = this.buildCurrentTodayState();
    const settledHistoryLimit =
      limit === undefined ? undefined : Math.max(limit - 1, 0);
    const settledHistoryOptions =
      limit === undefined ? { uncapped: true } : undefined;
    const settledSummaries = this.repository.getSettledHistory(
      settledHistoryLimit,
      settledHistoryOptions
    );
    const oldestDate = settledSummaries.at(-1)?.date ?? todayState.date;
    const focusMinutesByDate =
      ApplicationServiceRuntime.buildFocusMinutesByDate(
        this.repository.getFocusSessionsInRange(oldestDate, todayState.date)
      );
    const historicalHabitsByDate =
      settledSummaries.length > 0
        ? buildHistoricalHabitsByDate(
            settledSummaries,
            this.repository.getHistoricalHabitPeriodStatusesOverlappingRange(
              oldestDate,
              settledSummaries[0]?.date ?? oldestDate
            )
          )
        : new Map();

    return {
      focusMinutesByDate,
      historicalHabitsByDate,
      settledSummaries,
      todayState,
    };
  }

  getWeeklyReviewOverview(): WeeklyReviewOverview {
    return this.withSyncedRead("getWeeklyReviewOverview", () => {
      const firstTrackedDate = this.repository.getFirstTrackedDate();
      const latestTrackedDate = this.repository.getLatestTrackedDate();

      if (!firstTrackedDate || !latestTrackedDate) {
        return {
          availableWeeks: [],
          latestReview: null,
          trend: [],
        };
      }

      const latestCompletedWeek = getPreviousCompletedIsoWeek(
        this.getTodayKey()
      );
      if (latestTrackedDate < latestCompletedWeek.weekStart) {
        return {
          availableWeeks: [],
          latestReview: null,
          trend: [],
        };
      }

      const rangeStart = startOfIsoWeek(firstTrackedDate);
      const rangeEnd = latestCompletedWeek.weekEnd;

      return buildWeeklyReviewOverview({
        dailySummaries: this.repository.getDailySummariesInRange(
          rangeStart,
          rangeEnd
        ),
        focusSessions: this.repository.getFocusSessionsInRange(
          rangeStart,
          rangeEnd
        ),
        habitStatuses: this.repository.getHabitPeriodStatusesEndingInRange(
          rangeStart,
          rangeEnd
        ),
      });
    });
  }

  getWeeklyReview(weekStart: string): WeeklyReview {
    return this.withSyncedRead("getWeeklyReview", () => {
      const normalizedWeekStart = startOfIsoWeek(weekStart);
      const weekEnd = endOfIsoWeek(normalizedWeekStart);

      return buildWeeklyReview({
        dailySummaries: this.repository.getDailySummariesInRange(
          normalizedWeekStart,
          weekEnd
        ),
        focusSessions: this.repository.getFocusSessionsInRange(
          normalizedWeekStart,
          weekEnd
        ),
        habitStatuses: this.repository.getHabitPeriodStatusesEndingInRange(
          normalizedWeekStart,
          weekEnd
        ),
        weekStart: normalizedWeekStart,
      });
    });
  }

  getInsightsDashboard(rangeDays?: InsightsRangeDays): InsightsDashboard {
    return this.withSyncedRead("getInsightsDashboard", () => {
      const today = this.getTodayKey();
      const requestedRangeDays = rangeDays ?? 30;
      const rangeEnd = addDays(today, -1);
      const rangeStart = addDays(rangeEnd, -(requestedRangeDays * 2 - 1));
      const activeHabitIds = new Set(
        this.repository.getHabits().map((habit) => habit.id)
      );

      return buildInsightsDashboard({
        activeHabitIds,
        dailySummaries: this.repository.getDailySummariesInRange(
          rangeStart,
          rangeEnd
        ),
        focusSessions: this.repository.getFocusSessionsInRange(
          rangeStart,
          rangeEnd
        ),
        habitStatuses: this.repository.getHabitPeriodStatusesEndingInRange(
          rangeStart,
          rangeEnd
        ),
        nowDate: today,
        rangeDays: requestedRangeDays,
        streak: this.repository.getPersistedStreakState(),
        timezone: this.getTimezone(),
      });
    });
  }
}
