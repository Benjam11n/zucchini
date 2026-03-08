import { and, asc, desc, eq, gte, lte, or, sql } from "drizzle-orm";

import {
  normalizeHabitCategory,
  normalizeHabitFrequency,
} from "@/shared/domain/habit";
import type { HabitWithStatus } from "@/shared/domain/habit";
import { getHabitPeriod } from "@/shared/domain/habit-period";
import type { DailySummary } from "@/shared/domain/streak";

import type { SqliteDatabaseClient } from "../db/sqlite-client";
import { dailySummary, habitPeriodStatus } from "../schema";
import type { SqliteHabitsRepository } from "./habit-repository";
import { mapDailySummary, mapHabitPeriodStatusSnapshot } from "./mappers";
import type { HabitPeriodStatusRow, HabitPeriodStatusSnapshot } from "./types";

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
          this.getStatusKey(row.frequency, row.periodStart, row.habitId),
          row,
        ])
      );

      return activeHabits.map((habit) => {
        const period = getHabitPeriod(habit.frequency, date);
        const status = statusByKey.get(
          this.getStatusKey(habit.frequency, period.start, habit.id)
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
          sortOrder: habitPeriodStatus.habitSortOrder,
        })
        .from(habitPeriodStatus)
        .where(eq(habitPeriodStatus.periodEnd, date))
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

      this.client
        .getDrizzle()
        .insert(habitPeriodStatus)
        .values(
          activeHabits.map((habit) => ({
            completed: false,
            frequency: habit.frequency,
            habitCategory: habit.category,
            habitCreatedAt: habit.createdAt,
            habitId: habit.id,
            habitName: habit.name,
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
      if (!habit) {
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
          habitSortOrder: habit.sortOrder,
          periodEnd: getHabitPeriod(habit.frequency, date).end,
          periodStart: getHabitPeriod(habit.frequency, date).start,
        })
        .onConflictDoNothing()
        .run();
    });
  }

  toggleHabit(date: string, habitId: number): void {
    this.client.run("toggleHabit", () => {
      const habit = this.habitsRepository.getHabitById(habitId);
      if (!habit) {
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

  getSettledHistory(limit?: number): DailySummary[] {
    return this.client.run("getSettledHistory", () => {
      const query = this.client
        .getDrizzle()
        .select()
        .from(dailySummary)
        .orderBy(desc(dailySummary.date));
      const rows = limit === undefined ? query.all() : query.limit(limit).all();

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
    return this.client.run("getFirstTrackedDate", () => {
      const statusRow = this.client
        .getDrizzle()
        .select({
          firstDate: sql<string | null>`min(${habitPeriodStatus.periodStart})`,
        })
        .from(habitPeriodStatus)
        .get();
      const summaryRow = this.client
        .getDrizzle()
        .select({
          firstDate: sql<string | null>`min(${dailySummary.date})`,
        })
        .from(dailySummary)
        .get();
      const candidates = [statusRow?.firstDate, summaryRow?.firstDate].filter(
        (value): value is string => value !== null && value !== undefined
      );

      if (candidates.length === 0) {
        return null;
      }

      return candidates.toSorted((left, right) => left.localeCompare(right))[0];
    });
  }

  getLatestTrackedDate(): string | null {
    return this.client.run("getLatestTrackedDate", () => {
      const statusRow = this.client
        .getDrizzle()
        .select({
          latestDate: sql<string | null>`max(${habitPeriodStatus.periodEnd})`,
        })
        .from(habitPeriodStatus)
        .get();
      const summaryRow = this.client
        .getDrizzle()
        .select({
          latestDate: sql<string | null>`max(${dailySummary.date})`,
        })
        .from(dailySummary)
        .get();
      const candidates = [statusRow?.latestDate, summaryRow?.latestDate].filter(
        (value): value is string => value !== null && value !== undefined
      );

      if (candidates.length === 0) {
        return null;
      }

      return candidates.toSorted((left, right) => right.localeCompare(left))[0];
    });
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

  private getStatusKey(
    frequency: string,
    periodStart: string,
    habitId: number
  ): string {
    return `${frequency}:${periodStart}:${habitId}`;
  }
}
