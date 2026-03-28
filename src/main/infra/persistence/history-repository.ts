import { and, asc, desc, eq, gte, lte, or, sql } from "drizzle-orm";

import { dailySummary, habitPeriodStatus } from "@/main/infra/db/schema";
import type { SqliteDatabaseClient } from "@/main/infra/db/sqlite-client";
import {
  isHabitScheduledForDate,
  normalizeHabitCategory,
  normalizeHabitFrequency,
  normalizeHabitWeekdays,
} from "@/shared/domain/habit";
import type { HabitWithStatus } from "@/shared/domain/habit";
import { getHabitPeriod } from "@/shared/domain/habit-period";
import type { DailySummary } from "@/shared/domain/streak";

import type { SettledHistoryOptions } from "./app-repository";
import type { SqliteHabitsRepository } from "./habit-repository";
import { mapDailySummary, mapHabitPeriodStatusSnapshot } from "./mappers";
import type { HabitPeriodStatusRow, HabitPeriodStatusSnapshot } from "./types";

const DEFAULT_SETTLED_HISTORY_LIMIT = 365;

export class SqliteHistoryRepository {
  private readonly client: SqliteDatabaseClient;
  private readonly habitsRepository: SqliteHabitsRepository;

  constructor(
    client: SqliteDatabaseClient,
    habitsRepository: SqliteHabitsRepository
  ) {
    this.client = client;
    this.habitsRepository = habitsRepository;
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
          };
        });
    });
  }

  getHistoricalHabitsWithStatus(date: string): HabitWithStatus[] {
    return this.client.run("getHistoricalHabitsWithStatus", () =>
      this.client
        .getDrizzle()
        .select({
          category: habitPeriodStatus.habitCategory,
          completed: habitPeriodStatus.completed,
          createdAt: habitPeriodStatus.habitCreatedAt,
          frequency: habitPeriodStatus.frequency,
          id: habitPeriodStatus.habitId,
          name: habitPeriodStatus.habitName,
          selectedWeekdays: habitPeriodStatus.habitSelectedWeekdays,
          sortOrder: habitPeriodStatus.habitSortOrder,
        })
        .from(habitPeriodStatus)
        .where(
          and(
            lte(habitPeriodStatus.periodStart, date),
            gte(habitPeriodStatus.periodEnd, date)
          )
        )
        .orderBy(
          asc(habitPeriodStatus.habitSortOrder),
          asc(habitPeriodStatus.habitId)
        )
        .all()
        .map((row) => ({
          category: normalizeHabitCategory(row.category),
          completed: row.completed,
          createdAt: row.createdAt,
          frequency: normalizeHabitFrequency(row.frequency),
          id: row.id,
          isArchived: false,
          name: row.name,
          selectedWeekdays: normalizeHabitWeekdays(
            row.selectedWeekdays ? JSON.parse(row.selectedWeekdays) : null
          ),
          sortOrder: row.sortOrder,
        }))
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
        .values(
          dueHabits.map((habit) => ({
            completed: false,
            frequency: habit.frequency,
            habitCategory: habit.category,
            habitCreatedAt: habit.createdAt,
            habitId: habit.id,
            habitName: habit.name,
            habitSelectedWeekdays: habit.selectedWeekdays
              ? JSON.stringify(habit.selectedWeekdays)
              : null,
            habitSortOrder: habit.sortOrder,
            periodEnd: getHabitPeriod(habit.frequency, date).end,
            periodStart: getHabitPeriod(habit.frequency, date).start,
          }))
        )
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
        .values({
          completed: false,
          frequency: habit.frequency,
          habitCategory: habit.category,
          habitCreatedAt: habit.createdAt,
          habitId,
          habitName: habit.name,
          habitSelectedWeekdays: habit.selectedWeekdays
            ? JSON.stringify(habit.selectedWeekdays)
            : null,
          habitSortOrder: habit.sortOrder,
          periodEnd: getHabitPeriod(habit.frequency, date).end,
          periodStart: getHabitPeriod(habit.frequency, date).start,
        })
        .onConflictDoNothing()
        .run();
    });
  }

  removeStatusRowsForDate(date: string, habitId: number): void {
    this.client.run("removeStatusRowsForDate", () => {
      const dailyPeriod = getHabitPeriod("daily", date);
      const weeklyPeriod = getHabitPeriod("weekly", date);
      const monthlyPeriod = getHabitPeriod("monthly", date);

      this.client
        .getDrizzle()
        .delete(habitPeriodStatus)
        .where(
          and(
            eq(habitPeriodStatus.habitId, habitId),
            or(
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
            )
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

      const period = getHabitPeriod(habit.frequency, date);
      this.client
        .getDrizzle()
        .update(habitPeriodStatus)
        .set({
          completed: sql<boolean>`case when ${habitPeriodStatus.completed} = 1 then 0 else 1 end`,
        })
        .where(
          and(
            eq(habitPeriodStatus.frequency, habit.frequency),
            eq(habitPeriodStatus.periodStart, period.start),
            eq(habitPeriodStatus.habitId, habitId)
          )
        )
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

  saveDailySummary(summary: DailySummary): void {
    this.client.run("saveDailySummary", () => {
      this.client
        .getDrizzle()
        .insert(dailySummary)
        .values({
          allCompleted: summary.allCompleted,
          completedAt: summary.completedAt,
          date: summary.date,
          freezeUsed: summary.freezeUsed,
          streakCountAfterDay: summary.streakCountAfterDay,
        })
        .onConflictDoUpdate({
          set: {
            allCompleted: summary.allCompleted,
            completedAt: summary.completedAt,
            freezeUsed: summary.freezeUsed,
            streakCountAfterDay: summary.streakCountAfterDay,
          },
          target: dailySummary.date,
        })
        .run();
    });
  }

  private getStatusRowsForDate(date: string): HabitPeriodStatusRow[] {
    const dailyPeriod = getHabitPeriod("daily", date);
    const weeklyPeriod = getHabitPeriod("weekly", date);
    const monthlyPeriod = getHabitPeriod("monthly", date);

    return this.client
      .getDrizzle()
      .select()
      .from(habitPeriodStatus)
      .where(
        or(
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
        )
      )
      .all();
  }

  private static getStatusKey(
    frequency: string,
    periodStart: string,
    habitId: number
  ): string {
    return `${frequency}:${periodStart}:${habitId}`;
  }
}
