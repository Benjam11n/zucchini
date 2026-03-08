import { and, asc, eq, sql } from "drizzle-orm";

import type {
  Habit,
  HabitCategory,
  HabitFrequency,
} from "@/shared/domain/habit";

import type { SqliteDatabaseClient } from "../db/sqlite-client";
import { habits } from "../schema";
import { mapHabit } from "./mappers";

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
          sortOrder,
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

  updateHabitFrequency(habitId: number, frequency: HabitFrequency): void {
    this.client.run("updateHabitFrequency", () => {
      this.client
        .getDrizzle()
        .update(habits)
        .set({ frequency })
        .where(and(eq(habits.id, habitId), eq(habits.isArchived, false)))
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

  normalizeHabitOrder(): void {
    this.client.run("normalizeHabitOrder", () => {
      const activeHabits = this.getHabits();

      this.client.getDrizzle().transaction((tx) => {
        activeHabits.forEach((habit, index) => {
          tx.update(habits)
            .set({ sortOrder: index })
            .where(eq(habits.id, habit.id))
            .run();
        });
      });
    });
  }

  reorderHabits(habitIds: number[]): void {
    this.client.run("reorderHabits", () => {
      this.client.getDrizzle().transaction((tx) => {
        habitIds.forEach((habitId, index) => {
          tx.update(habits)
            .set({ sortOrder: index })
            .where(eq(habits.id, habitId))
            .run();
        });
      });
    });
  }
}
