/**
 * Habit CRUD repository.
 *
 * Handles inserting, renaming, archiving, reordering, and querying habits
 * from the `habits` SQLite table. Delegates to Drizzle ORM for all queries
 * and maps rows to domain `Habit` objects via shared mappers.
 */
import { and, asc, eq, isNull, sql } from "drizzle-orm";

import { habitPausePeriods, habits } from "@/main/infra/db/schema";
import type { SqliteDatabaseClient } from "@/main/infra/db/sqlite-client";
import type {
  Habit,
  HabitCategory,
  HabitFrequency,
  HabitPausePeriod,
  HabitWeekday,
} from "@/shared/domain/habit";
import { normalizeHabitTargetCount } from "@/shared/domain/habit";

import { mapHabit, mapHabitPausePeriod } from "./mappers";

function serializeHabitWeekdays(
  selectedWeekdays: readonly HabitWeekday[] | null
): string | null {
  return selectedWeekdays ? JSON.stringify(selectedWeekdays) : null;
}

export class SqliteHabitsRepository {
  private readonly client: SqliteDatabaseClient;

  constructor(client: SqliteDatabaseClient) {
    this.client = client;
  }

  countActiveHabits(): number {
    return this.client.run("countActiveHabits", () => {
      const row = this.client
        .getDrizzle()
        .select({
          count: sql<number>`count(*)`,
        })
        .from(habits)
        .where(eq(habits.isArchived, false))
        .get();

      return row?.count ?? 0;
    });
  }

  getHabits(): Habit[] {
    return this.client.run("getHabits", () =>
      this.client
        .getDrizzle()
        .select()
        .from(habits)
        .where(eq(habits.isArchived, false))
        .orderBy(asc(habits.sortOrder), asc(habits.id))
        .all()
        .map((row) => mapHabit(row))
    );
  }

  getHabitById(habitId: number): Habit | null {
    return this.client.run("getHabitById", () => {
      const row = this.client
        .getDrizzle()
        .select()
        .from(habits)
        .where(and(eq(habits.id, habitId), eq(habits.isArchived, false)))
        .get();

      return row ? mapHabit(row) : null;
    });
  }

  getPausePeriods(): HabitPausePeriod[] {
    return this.client.run("getPausePeriods", () =>
      this.client
        .getDrizzle()
        .select()
        .from(habitPausePeriods)
        .all()
        .map((row) => mapHabitPausePeriod(row))
    );
  }

  getPausePeriodsForHabit(habitId: number): HabitPausePeriod[] {
    return this.client.run("getPausePeriodsForHabit", () =>
      this.client
        .getDrizzle()
        .select()
        .from(habitPausePeriods)
        .where(eq(habitPausePeriods.habitId, habitId))
        .all()
        .map((row) => mapHabitPausePeriod(row))
    );
  }

  repairHabitPauseCache(): void {
    this.client.run("repairHabitPauseCache", () => {
      this.client.getSqlite().exec(`
        UPDATE habits
        SET paused_at = (
          SELECT habit_pause_periods.paused_at
          FROM habit_pause_periods
          WHERE habit_pause_periods.habit_id = habits.id
            AND habit_pause_periods.resumed_at IS NULL
          ORDER BY habit_pause_periods.paused_at DESC, habit_pause_periods.id DESC
          LIMIT 1
        );
      `);
    });
  }

  getMaxSortOrder(): number {
    return this.client.run("getMaxSortOrder", () => {
      const row = this.client
        .getDrizzle()
        .select({
          maxSortOrder: sql<number>`coalesce(max(${habits.sortOrder}), -1)`,
        })
        .from(habits)
        .where(eq(habits.isArchived, false))
        .get();

      return row?.maxSortOrder ?? -1;
    });
  }

  insertHabit(
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency,
    selectedWeekdays: HabitWeekday[] | null,
    targetCount: number,
    sortOrder: number,
    createdAt: string
  ): number {
    return this.client.run("insertHabit", () => {
      const result = this.client
        .getDrizzle()
        .insert(habits)
        .values({
          category,
          createdAt,
          frequency,
          name,
          selectedWeekdays: serializeHabitWeekdays(selectedWeekdays),
          sortOrder,
          targetCount: normalizeHabitTargetCount(frequency, targetCount),
        })
        .returning({
          id: habits.id,
        })
        .get();

      return result.id;
    });
  }

  renameHabit(habitId: number, name: string): void {
    this.client.run("renameHabit", () => {
      this.client
        .getDrizzle()
        .update(habits)
        .set({ name })
        .where(and(eq(habits.id, habitId), eq(habits.isArchived, false)))
        .run();
    });
  }

  updateHabitCategory(habitId: number, category: HabitCategory): void {
    this.client.run("updateHabitCategory", () => {
      this.client
        .getDrizzle()
        .update(habits)
        .set({ category })
        .where(and(eq(habits.id, habitId), eq(habits.isArchived, false)))
        .run();
    });
  }

  updateHabitFrequency(
    habitId: number,
    frequency: HabitFrequency,
    targetCount: number
  ): void {
    this.client.run("updateHabitFrequency", () => {
      this.client
        .getDrizzle()
        .update(habits)
        .set({
          frequency,
          selectedWeekdays: null,
          targetCount: normalizeHabitTargetCount(frequency, targetCount),
        })
        .where(and(eq(habits.id, habitId), eq(habits.isArchived, false)))
        .run();
    });
  }

  updateHabitTargetCount(habitId: number, targetCount: number): void {
    this.client.run("updateHabitTargetCount", () => {
      const habit = this.getHabitById(habitId);
      if (!habit) {
        return;
      }

      this.client
        .getDrizzle()
        .update(habits)
        .set({
          targetCount: normalizeHabitTargetCount(habit.frequency, targetCount),
        })
        .where(and(eq(habits.id, habitId), eq(habits.isArchived, false)))
        .run();
    });
  }

  updateHabitWeekdays(
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null
  ): void {
    this.client.run("updateHabitWeekdays", () => {
      this.client
        .getDrizzle()
        .update(habits)
        .set({
          selectedWeekdays: serializeHabitWeekdays(selectedWeekdays),
        })
        .where(and(eq(habits.id, habitId), eq(habits.isArchived, false)))
        .run();
    });
  }

  pauseHabit(habitId: number, pausedAt: string): void {
    this.client.run("pauseHabit", () => {
      const habit = this.getHabitById(habitId);
      if (!habit || habit.pausedAt) {
        return;
      }

      this.client
        .getDrizzle()
        .update(habits)
        .set({ pausedAt })
        .where(and(eq(habits.id, habitId), eq(habits.isArchived, false)))
        .run();
      this.client
        .getDrizzle()
        .insert(habitPausePeriods)
        .values({
          habitId,
          pausedAt,
          resumedAt: null,
        })
        .run();
    });
  }

  resumeHabit(habitId: number, resumedAt: string): void {
    this.client.run("resumeHabit", () => {
      const habit = this.getHabitById(habitId);
      if (!habit || !habit.pausedAt) {
        return;
      }
      const openPeriod = this.client
        .getDrizzle()
        .select()
        .from(habitPausePeriods)
        .where(
          and(
            eq(habitPausePeriods.habitId, habitId),
            isNull(habitPausePeriods.resumedAt)
          )
        )
        .get();

      this.client
        .getDrizzle()
        .update(habits)
        .set({ pausedAt: null })
        .where(and(eq(habits.id, habitId), eq(habits.isArchived, false)))
        .run();
      if (openPeriod) {
        this.client
          .getDrizzle()
          .update(habitPausePeriods)
          .set({ resumedAt })
          .where(
            and(
              eq(habitPausePeriods.habitId, habitId),
              isNull(habitPausePeriods.resumedAt)
            )
          )
          .run();
        return;
      }

      this.client
        .getDrizzle()
        .insert(habitPausePeriods)
        .values({
          habitId,
          pausedAt: habit.pausedAt,
          resumedAt,
        })
        .run();
    });
  }

  archiveHabit(habitId: number): void {
    this.client.run("archiveHabit", () => {
      this.client
        .getDrizzle()
        .update(habits)
        .set({ isArchived: true })
        .where(eq(habits.id, habitId))
        .run();
    });
  }

  unarchiveHabit(habitId: number): void {
    this.client.run("unarchiveHabit", () => {
      this.client
        .getDrizzle()
        .update(habits)
        .set({ isArchived: false })
        .where(eq(habits.id, habitId))
        .run();
    });
  }

  normalizeHabitOrder(): void {
    this.client.run("normalizeHabitOrder", () => {
      const activeHabits = this.getHabits();

      for (const [index, habit] of activeHabits.entries()) {
        this.client
          .getDrizzle()
          .update(habits)
          .set({ sortOrder: index })
          .where(eq(habits.id, habit.id))
          .run();
      }
    });
  }

  reorderHabits(habitIds: number[]): void {
    this.client.run("reorderHabits", () => {
      for (const [index, habitId] of habitIds.entries()) {
        this.client
          .getDrizzle()
          .update(habits)
          .set({ sortOrder: index })
          .where(eq(habits.id, habitId))
          .run();
      }
    });
  }
}
