import { eq } from "drizzle-orm";

import type { WindDownRuntimeState } from "@/main/features/wind-down/runtime-state";
import { DEFAULT_WIND_DOWN_RUNTIME_STATE } from "@/main/features/wind-down/runtime-state";
import { windDownRuntimeState } from "@/main/infra/db/schema";
import type { SqliteDatabaseClient } from "@/main/infra/db/sqlite-client";

const WIND_DOWN_RUNTIME_STATE_ID = 1;

export class SqliteWindDownRuntimeStateRepository {
  private readonly client: SqliteDatabaseClient;

  constructor(client: SqliteDatabaseClient) {
    this.client = client;
  }

  getState(): WindDownRuntimeState {
    return this.client.run("getWindDownRuntimeState", () => {
      const row = this.client
        .getDrizzle()
        .select()
        .from(windDownRuntimeState)
        .where(eq(windDownRuntimeState.id, WIND_DOWN_RUNTIME_STATE_ID))
        .get();

      if (!row) {
        return { ...DEFAULT_WIND_DOWN_RUNTIME_STATE };
      }

      return {
        lastReminderSentAt: row.lastReminderSentAt,
      };
    });
  }

  saveState(state: WindDownRuntimeState): void {
    this.client.run("saveWindDownRuntimeState", () => {
      this.client
        .getDrizzle()
        .insert(windDownRuntimeState)
        .values({
          id: WIND_DOWN_RUNTIME_STATE_ID,
          lastReminderSentAt: state.lastReminderSentAt,
        })
        .onConflictDoUpdate({
          set: {
            lastReminderSentAt: state.lastReminderSentAt,
          },
          target: windDownRuntimeState.id,
        })
        .run();
    });
  }
}
