import { eq, inArray, sql } from "drizzle-orm";

import {
  categoryStreakState,
  habitStreakState,
  streakState,
} from "@/main/infra/db/schema";
import type { SqliteDatabaseClient } from "@/main/infra/db/sqlite-client";
import type { PersistedCategoryStreakState } from "@/shared/domain/category-streak";
import type { PersistedHabitStreakState } from "@/shared/domain/habit-streak";
import type { StreakState } from "@/shared/domain/streak";

import {
  mapCategoryStreakState,
  mapHabitStreakState,
  mapStreakState,
} from "./mappers";

export class SqliteStreakRepository {
  private readonly client: SqliteDatabaseClient;

  constructor(client: SqliteDatabaseClient) {
    this.client = client;
  }

  ensureInitialized(): void {
    this.client.run("seedDefaultStreakState", () => {
      this.client
        .getDrizzle()
        .insert(streakState)
        .values({
          availableFreezes: 1,
          bestStreak: 0,
          currentStreak: 0,
          id: 1,
          lastEvaluatedDate: null,
        })
        .onConflictDoNothing()
        .run();
    });
  }

  getPersistedStreakState(): StreakState {
    return this.client.run("getPersistedStreakState", () => {
      const row = this.client
        .getDrizzle()
        .select()
        .from(streakState)
        .where(eq(streakState.id, 1))
        .get();

      return row
        ? mapStreakState(row)
        : {
            availableFreezes: 0,
            bestStreak: 0,
            currentStreak: 0,
            lastEvaluatedDate: null,
          };
    });
  }

  savePersistedStreakState(state: StreakState): void {
    this.client.run("savePersistedStreakState", () => {
      this.client
        .getDrizzle()
        .update(streakState)
        .set({
          availableFreezes: state.availableFreezes,
          bestStreak: state.bestStreak,
          currentStreak: state.currentStreak,
          lastEvaluatedDate: state.lastEvaluatedDate,
        })
        .where(eq(streakState.id, 1))
        .run();
    });
  }

  getPersistedHabitStreakStates(
    habitIds: readonly number[]
  ): PersistedHabitStreakState[] {
    if (habitIds.length === 0) {
      return [];
    }

    return this.client.run("getPersistedHabitStreakStates", () =>
      this.client
        .getDrizzle()
        .select()
        .from(habitStreakState)
        .where(inArray(habitStreakState.habitId, [...habitIds]))
        .all()
        .map((row) => mapHabitStreakState(row))
    );
  }

  savePersistedHabitStreakStates(
    states: readonly PersistedHabitStreakState[]
  ): void {
    if (states.length === 0) {
      return;
    }

    this.client.run("savePersistedHabitStreakStates", () => {
      this.client
        .getDrizzle()
        .insert(habitStreakState)
        .values(
          states.map((state) => ({
            bestStreak: state.bestStreak,
            currentStreak: state.currentStreak,
            habitId: state.habitId,
            lastEvaluatedDate: state.lastEvaluatedDate,
          }))
        )
        .onConflictDoUpdate({
          set: {
            bestStreak: sql.raw("excluded.best_streak"),
            currentStreak: sql.raw("excluded.current_streak"),
            lastEvaluatedDate: sql.raw("excluded.last_evaluated_date"),
          },
          target: habitStreakState.habitId,
        })
        .run();
    });
  }

  getPersistedCategoryStreakStates(): PersistedCategoryStreakState[] {
    return this.client.run("getPersistedCategoryStreakStates", () =>
      this.client
        .getDrizzle()
        .select()
        .from(categoryStreakState)
        .all()
        .map((row) => mapCategoryStreakState(row))
    );
  }

  savePersistedCategoryStreakStates(
    states: readonly PersistedCategoryStreakState[]
  ): void {
    if (states.length === 0) {
      return;
    }

    this.client.run("savePersistedCategoryStreakStates", () => {
      this.client
        .getDrizzle()
        .insert(categoryStreakState)
        .values(
          states.map((state) => ({
            bestStreak: state.bestStreak,
            category: state.category,
            currentStreak: state.currentStreak,
            lastEvaluatedDate: state.lastEvaluatedDate,
          }))
        )
        .onConflictDoUpdate({
          set: {
            bestStreak: sql.raw("excluded.best_streak"),
            currentStreak: sql.raw("excluded.current_streak"),
            lastEvaluatedDate: sql.raw("excluded.last_evaluated_date"),
          },
          target: categoryStreakState.category,
        })
        .run();
    });
  }
}
