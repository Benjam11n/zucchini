/**
 * History data repository.
 *
 * Queries daily summaries, habit period statuses, and status rows to
 * build history views and settled-day summaries. Handles status row
 * creation, toggling, and date-range queries for weekly review data.
 */
import { and, asc, desc, eq, gte, lte, or, sql } from "drizzle-orm";

import {
  dailySummary,
  dayStatus,
  focusQuotaGoals,
  focusSessions,
  habitPeriodStatus,
} from "@/main/infra/db/schema";
import type { SqliteDatabaseClient } from "@/main/infra/db/sqlite-client";
import type { SettledHistoryOptions } from "@/main/ports/app-repository";
import type { DayStatus, DayStatusKind } from "@/shared/domain/day-status";
import {
  getFocusQuotaGoalPeriod,
  isFocusQuotaGoalComplete,
  normalizeFocusQuotaTargetMinutes,
  normalizeGoalFrequency,
} from "@/shared/domain/goal";
import type { FocusQuotaGoalWithStatus } from "@/shared/domain/goal";
import { isHabitScheduledForDate } from "@/shared/domain/habit";
import type { HabitWithStatus, Habit } from "@/shared/domain/habit";
import { getHabitPeriod } from "@/shared/domain/habit-period";
import type { HabitPeriodStatusSnapshot } from "@/shared/domain/habit-period-status-snapshot";
import type { DailySummary } from "@/shared/domain/streak";

import type { SqliteFocusQuotaGoalRepository } from "./focus-quota-goal-repository";
import type { SqliteHabitsRepository } from "./habit-repository";
import {
  mapDailySummary,
  mapDayStatus,
  mapHabitPeriodStatusSnapshot,
} from "./mappers";
import type { HabitPeriodStatusRow } from "./types";

const DEFAULT_SETTLED_HISTORY_LIMIT = 365;

type HabitPeriodStatusInsert = typeof habitPeriodStatus.$inferInsert;

function getStatusPeriodWhere(
  habit: Pick<Habit, "frequency">,
  habitId: number,
  date: string
) {
  const period = getHabitPeriod(habit.frequency, date);

  return and(
    eq(habitPeriodStatus.frequency, habit.frequency),
    eq(habitPeriodStatus.periodStart, period.start),
    eq(habitPeriodStatus.habitId, habitId)
  );
}

function toStatusInsertValue(
  habit: Habit,
  date: string,
  completedCount = 0
): HabitPeriodStatusInsert {
  const period = getHabitPeriod(habit.frequency, date);

  return {
    completed: completedCount >= (habit.targetCount ?? 1),
    completedCount,
    frequency: habit.frequency,
    habitCategory: habit.category,
    habitCreatedAt: habit.createdAt,
    habitId: habit.id,
    habitName: habit.name,
    habitSelectedWeekdays: habit.selectedWeekdays
      ? JSON.stringify(habit.selectedWeekdays)
      : null,
    habitSortOrder: habit.sortOrder,
    habitTargetCount: habit.targetCount,
    periodEnd: period.end,
    periodStart: period.start,
  };
}

function getStatusPeriodsForDateWhere(date: string) {
  const dailyPeriod = getHabitPeriod("daily", date);
  const weeklyPeriod = getHabitPeriod("weekly", date);
  const monthlyPeriod = getHabitPeriod("monthly", date);

  return or(
    and(
      eq(habitPeriodStatus.frequency, dailyPeriod.frequency),
      eq(habitPeriodStatus.periodStart, dailyPeriod.start)
    ),
    and(
      eq(habitPeriodStatus.frequency, weeklyPeriod.frequency),
      eq(habitPeriodStatus.periodStart, weeklyPeriod.start)
    ),
    and(
      eq(habitPeriodStatus.frequency, monthlyPeriod.frequency),
      eq(habitPeriodStatus.periodStart, monthlyPeriod.start)
    )
  );
}

export class SqliteHistoryRepository {
  private readonly client: SqliteDatabaseClient;
  private readonly habitsRepository: SqliteHabitsRepository;
  private readonly focusQuotaGoalRepository: SqliteFocusQuotaGoalRepository;

  constructor(
    client: SqliteDatabaseClient,
    habitsRepository: SqliteHabitsRepository,
    focusQuotaGoalRepository: SqliteFocusQuotaGoalRepository
  ) {
    this.client = client;
    this.habitsRepository = habitsRepository;
    this.focusQuotaGoalRepository = focusQuotaGoalRepository;
  }

  getFocusQuotaGoalsWithStatus(date: string): FocusQuotaGoalWithStatus[] {
    return this.client.run("getFocusQuotaGoalsWithStatus", () =>
      this.buildFocusQuotaGoalsWithStatus(date)
    );
  }

  getHabitsWithStatus(date: string): HabitWithStatus[] {
    return this.client.run("getHabitsWithStatus", () => {
      const activeHabits = this.habitsRepository.getHabits();
      if (activeHabits.length === 0) {
        return [];
      }

      const statusByKey = new Map(
        this.getStatusRowsForDate(date).map((row) => [
          SqliteHistoryRepository.getStatusKey(
            row.frequency,
            row.periodStart,
            row.habitId
          ),
          row,
        ])
      );

      return activeHabits
        .filter((habit) => isHabitScheduledForDate(habit, date))
        .map((habit) => {
          const period = getHabitPeriod(habit.frequency, date);
          const status = statusByKey.get(
            SqliteHistoryRepository.getStatusKey(
              habit.frequency,
              period.start,
              habit.id
            )
          );

          return {
            ...habit,
            completed: status?.completed ?? false,
            completedCount: status?.completedCount ?? 0,
          };
        });
    });
  }

  getHabitWithStatus(date: string, habitId: number): HabitWithStatus | null {
    return this.client.run("getHabitWithStatus", () => {
      const habit = this.habitsRepository.getHabitById(habitId);
      if (!habit || !isHabitScheduledForDate(habit, date)) {
        return null;
      }

      const row = this.client
        .getDrizzle()
        .select({
          completed: habitPeriodStatus.completed,
          completedCount: habitPeriodStatus.completedCount,
        })
        .from(habitPeriodStatus)
        .where(getStatusPeriodWhere(habit, habitId, date))
        .get();

      return {
        ...habit,
        completed: row?.completed ?? false,
        completedCount: row?.completedCount ?? 0,
      };
    });
  }

  getHabitProgress(date: string, habitId: number): number {
    return this.client.run("getHabitProgress", () => {
      const habit = this.habitsRepository.getHabitById(habitId);
      if (!habit || !isHabitScheduledForDate(habit, date)) {
        return 0;
      }

      const row = this.client
        .getDrizzle()
        .select({
          completedCount: habitPeriodStatus.completedCount,
        })
        .from(habitPeriodStatus)
        .where(getStatusPeriodWhere(habit, habitId, date))
        .get();

      return row?.completedCount ?? 0;
    });
  }

  getDayStatus(date: string): DayStatus | null {
    return this.client.run("getDayStatus", () => {
      const row = this.client
        .getDrizzle()
        .select()
        .from(dayStatus)
        .where(eq(dayStatus.date, date))
        .get();

      return row ? mapDayStatus(row) : null;
    });
  }

  getHistoricalHabitPeriodStatusesOverlappingRange(
    start: string,
    end: string
  ): HabitPeriodStatusSnapshot[] {
    return this.client.run(
      "getHistoricalHabitPeriodStatusesOverlappingRange",
      () =>
        this.client
          .getDrizzle()
          .select()
          .from(habitPeriodStatus)
          .where(
            and(
              lte(habitPeriodStatus.periodStart, end),
              gte(habitPeriodStatus.periodEnd, start)
            )
          )
          .orderBy(
            asc(habitPeriodStatus.periodStart),
            asc(habitPeriodStatus.habitSortOrder),
            asc(habitPeriodStatus.habitId)
          )
          .all()
          .map((row) => mapHabitPeriodStatusSnapshot(row))
    );
  }

  getHistoricalFocusQuotaGoalsWithStatus(
    date: string
  ): FocusQuotaGoalWithStatus[] {
    return this.client.run("getHistoricalFocusQuotaGoalsWithStatus", () =>
      this.buildFocusQuotaGoalsWithStatus(
        date,
        this.getHistoricalFocusQuotaGoalsForDate(date)
      )
    );
  }

  ensureStatusRowsForDate(date: string): void {
    this.client.run("ensureStatusRowsForDate", () => {
      const activeHabits = this.habitsRepository.getHabits();
      if (activeHabits.length === 0) {
        return;
      }

      const dueHabits = activeHabits.filter((habit) =>
        isHabitScheduledForDate(habit, date)
      );

      if (dueHabits.length === 0) {
        return;
      }

      this.client
        .getDrizzle()
        .insert(habitPeriodStatus)
        .values(dueHabits.map((habit) => toStatusInsertValue(habit, date)))
        .onConflictDoNothing()
        .run();
    });
  }

  ensureStatusRow(date: string, habitId: number): void {
    this.client.run("ensureStatusRow", () => {
      const habit = this.habitsRepository.getHabitById(habitId);
      if (!habit || !isHabitScheduledForDate(habit, date)) {
        return;
      }

      this.client
        .getDrizzle()
        .insert(habitPeriodStatus)
        .values(toStatusInsertValue(habit, date))
        .onConflictDoNothing()
        .run();
    });
  }

  removeStatusRowsForDate(date: string, habitId: number): void {
    this.client.run("removeStatusRowsForDate", () => {
      this.client
        .getDrizzle()
        .delete(habitPeriodStatus)
        .where(
          and(
            eq(habitPeriodStatus.habitId, habitId),
            getStatusPeriodsForDateWhere(date)
          )
        )
        .run();
    });
  }

  toggleHabit(date: string, habitId: number): void {
    this.client.run("toggleHabit", () => {
      const habit = this.habitsRepository.getHabitById(habitId);
      if (!habit || !isHabitScheduledForDate(habit, date)) {
        return;
      }

      this.client
        .getDrizzle()
        .update(habitPeriodStatus)
        .set({
          completed: sql<boolean>`case when ${habitPeriodStatus.completed} = 1 then 0 else 1 end`,
          completedCount: sql<number>`case when ${habitPeriodStatus.completed} = 1 then 0 else ${habit.targetCount} end`,
        })
        .where(getStatusPeriodWhere(habit, habitId, date))
        .run();
    });
  }

  setHabitProgress(
    date: string,
    habitId: number,
    completedCount: number
  ): void {
    this.client.run("setHabitProgress", () => {
      const habit = this.habitsRepository.getHabitById(habitId);
      if (!habit || !isHabitScheduledForDate(habit, date)) {
        return;
      }

      const safeCompletedCount = Math.max(0, Math.round(completedCount));

      this.client
        .getDrizzle()
        .update(habitPeriodStatus)
        .set({
          completed: safeCompletedCount >= (habit.targetCount ?? 1),
          completedCount: safeCompletedCount,
          habitCategory: habit.category,
          habitName: habit.name,
          habitSelectedWeekdays: habit.selectedWeekdays
            ? JSON.stringify(habit.selectedWeekdays)
            : null,
          habitSortOrder: habit.sortOrder,
          habitTargetCount: habit.targetCount ?? 1,
        })
        .where(getStatusPeriodWhere(habit, habitId, date))
        .run();
    });
  }

  adjustHabitProgress(date: string, habitId: number, delta: number): void {
    this.client.run("adjustHabitProgress", () => {
      const habit = this.habitsRepository.getHabitById(habitId);
      if (
        !habit ||
        !isHabitScheduledForDate(habit, date) ||
        habit.frequency === "daily" ||
        delta === 0
      ) {
        return;
      }

      const safeDelta = Math.round(delta);

      this.client
        .getDrizzle()
        .update(habitPeriodStatus)
        .set({
          completed: sql<boolean>`case when max(0, ${habitPeriodStatus.completedCount} + ${safeDelta}) >= ${habit.targetCount} then 1 else 0 end`,
          completedCount: sql<number>`max(0, ${habitPeriodStatus.completedCount} + ${safeDelta})`,
        })
        .where(getStatusPeriodWhere(habit, habitId, date))
        .run();
    });
  }

  getSettledHistory(
    limit?: number,
    options?: SettledHistoryOptions
  ): DailySummary[] {
    return this.client.run("getSettledHistory", () => {
      const effectiveLimit =
        options?.uncapped === true
          ? undefined
          : (limit ?? DEFAULT_SETTLED_HISTORY_LIMIT);
      const query = this.client
        .getDrizzle()
        .select()
        .from(dailySummary)
        .orderBy(desc(dailySummary.date));
      const rows =
        effectiveLimit === undefined
          ? query.all()
          : query.limit(effectiveLimit).all();

      return rows.map((row) => mapDailySummary(row));
    });
  }

  getDailySummariesInRange(start: string, end: string): DailySummary[] {
    return this.client.run("getDailySummariesInRange", () =>
      this.client
        .getDrizzle()
        .select()
        .from(dailySummary)
        .where(and(gte(dailySummary.date, start), lte(dailySummary.date, end)))
        .orderBy(asc(dailySummary.date))
        .all()
        .map((row) => mapDailySummary(row))
    );
  }

  getSettledHistoryYears(): number[] {
    return this.client.run("getSettledHistoryYears", () =>
      (
        this.client
          .getSqlite()
          .prepare(
            `
              SELECT DISTINCT CAST(substr(date, 1, 4) AS INTEGER) AS year
              FROM daily_summary
              ORDER BY year DESC
            `
          )
          .all() as { year: number }[]
      ).map((row) => row.year)
    );
  }

  getHabitPeriodStatusesEndingInRange(
    start: string,
    end: string
  ): HabitPeriodStatusSnapshot[] {
    return this.client.run("getHabitPeriodStatusesEndingInRange", () =>
      this.client
        .getDrizzle()
        .select()
        .from(habitPeriodStatus)
        .where(
          and(
            gte(habitPeriodStatus.periodEnd, start),
            lte(habitPeriodStatus.periodEnd, end)
          )
        )
        .orderBy(
          asc(habitPeriodStatus.periodEnd),
          asc(habitPeriodStatus.habitSortOrder),
          asc(habitPeriodStatus.habitId)
        )
        .all()
        .map((row) => mapHabitPeriodStatusSnapshot(row))
    );
  }

  getFirstTrackedDate(): string | null {
    return this.client.run(
      "getFirstTrackedDate",
      () =>
        (
          this.client
            .getSqlite()
            .prepare(
              `
                SELECT min(candidate_date) AS firstDate
                FROM (
                  SELECT min(period_start) AS candidate_date
                  FROM habit_period_status
                  UNION ALL
                  SELECT min(date) AS candidate_date
                  FROM daily_summary
                )
              `
            )
            .get() as {
            firstDate: string | null;
          } | null
        )?.firstDate ?? null
    );
  }

  getLatestTrackedDate(): string | null {
    return this.client.run(
      "getLatestTrackedDate",
      () =>
        (
          this.client
            .getSqlite()
            .prepare(
              `
                SELECT max(candidate_date) AS latestDate
                FROM (
                  SELECT max(period_end) AS candidate_date
                  FROM habit_period_status
                  UNION ALL
                  SELECT max(date) AS candidate_date
                  FROM daily_summary
                )
              `
            )
            .get() as {
            latestDate: string | null;
          } | null
        )?.latestDate ?? null
    );
  }

  getExistingCompletedAt(date: string): string | null {
    return this.client.run("getExistingCompletedAt", () => {
      const row = this.client
        .getDrizzle()
        .select({
          completedAt: dailySummary.completedAt,
        })
        .from(dailySummary)
        .where(eq(dailySummary.date, date))
        .get();

      return row?.completedAt ?? null;
    });
  }

  setDayStatus(date: string, kind: DayStatusKind, createdAt: string): void {
    this.client.run("setDayStatus", () => {
      this.client
        .getDrizzle()
        .insert(dayStatus)
        .values({
          createdAt,
          date,
          kind,
        })
        .onConflictDoUpdate({
          set: {
            createdAt,
            kind,
          },
          target: dayStatus.date,
        })
        .run();
    });
  }

  clearDayStatus(date: string): void {
    this.client.run("clearDayStatus", () => {
      this.client
        .getDrizzle()
        .delete(dayStatus)
        .where(eq(dayStatus.date, date))
        .run();
    });
  }

  saveDailySummary(summary: DailySummary): void {
    this.client.run("saveDailySummary", () => {
      this.client
        .getDrizzle()
        .insert(dailySummary)
        .values({
          allCompleted: summary.allCompleted,
          completedAt: summary.completedAt,
          date: summary.date,
          dayStatus: summary.dayStatus,
          freezeUsed: summary.freezeUsed,
          streakCountAfterDay: summary.streakCountAfterDay,
        })
        .onConflictDoUpdate({
          set: {
            allCompleted: summary.allCompleted,
            completedAt: summary.completedAt,
            dayStatus: summary.dayStatus,
            freezeUsed: summary.freezeUsed,
            streakCountAfterDay: summary.streakCountAfterDay,
          },
          target: dailySummary.date,
        })
        .run();
    });
  }

  private getStatusRowsForDate(date: string): HabitPeriodStatusRow[] {
    return this.client
      .getDrizzle()
      .select()
      .from(habitPeriodStatus)
      .where(getStatusPeriodsForDateWhere(date))
      .all();
  }

  private static getStatusKey(
    frequency: string,
    periodStart: string,
    habitId: number
  ): string {
    return `${frequency}:${periodStart}:${habitId}`;
  }

  private buildFocusQuotaGoalsWithStatus(
    date: string,
    goals = this.focusQuotaGoalRepository.getGoals()
  ): FocusQuotaGoalWithStatus[] {
    return goals.map((goal) => {
      const period = getFocusQuotaGoalPeriod(goal.frequency, date);
      const completedMinutes = this.getFocusMinutesInRange(
        period.start,
        period.end
      );

      return {
        ...goal,
        completed: isFocusQuotaGoalComplete(goal, completedMinutes),
        completedMinutes,
        kind: "focus-quota",
        periodEnd: period.end,
        periodStart: period.start,
      };
    });
  }

  private getHistoricalFocusQuotaGoalsForDate(date: string) {
    const rows = this.client
      .getDrizzle()
      .select()
      .from(focusQuotaGoals)
      .orderBy(asc(focusQuotaGoals.frequency), desc(focusQuotaGoals.createdAt))
      .all();
    const goalsByFrequency = new Map<string, (typeof rows)[number]>();

    for (const row of rows) {
      const frequency = normalizeGoalFrequency(row.frequency);
      const createdOn = row.createdAt.slice(0, 10);
      const archivedOn = row.archivedAt?.slice(0, 10) ?? null;

      if (createdOn > date) {
        continue;
      }

      if (archivedOn !== null && archivedOn <= date) {
        continue;
      }

      if (!goalsByFrequency.has(frequency)) {
        goalsByFrequency.set(frequency, row);
      }
    }

    return [...goalsByFrequency.values()]
      .map((row) => {
        const frequency = normalizeGoalFrequency(row.frequency);
        return {
          archivedAt: row.archivedAt,
          createdAt: row.createdAt,
          frequency,
          id: row.id,
          isArchived: row.isArchived,
          targetMinutes: normalizeFocusQuotaTargetMinutes(
            frequency,
            row.targetMinutes
          ),
        };
      })
      .toSorted((left, right) => left.frequency.localeCompare(right.frequency));
  }

  private getFocusMinutesInRange(start: string, end: string): number {
    const row = this.client
      .getDrizzle()
      .select({
        totalSeconds: sql<number>`coalesce(sum(${focusSessions.durationSeconds}), 0)`,
      })
      .from(focusSessions)
      .where(
        and(
          gte(focusSessions.completedDate, start),
          lte(focusSessions.completedDate, end)
        )
      )
      .get();

    const totalSeconds = row?.totalSeconds ?? 0;
    return totalSeconds <= 0 ? 0 : Math.max(1, Math.round(totalSeconds / 60));
  }
}
