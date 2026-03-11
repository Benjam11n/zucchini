import { eq } from "drizzle-orm";

import type { StreakState } from "@/shared/domain/streak";

import { streakState } from "../db/schema";
import type { SqliteDatabaseClient } from "../db/sqlite-client";
import { mapStreakState } from "./mappers";

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
}
