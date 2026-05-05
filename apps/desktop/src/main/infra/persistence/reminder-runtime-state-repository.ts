import { eq } from "drizzle-orm";

import { reminderRuntimeState } from "@/main/infra/db/schema";
import type { SqliteDatabaseClient } from "@/main/infra/db/sqlite-client";
import type { ReminderRuntimeState } from "@/shared/domain/reminder-runtime-state";
import { DEFAULT_REMINDER_RUNTIME_STATE } from "@/shared/domain/reminder-runtime-state";

const REMINDER_RUNTIME_STATE_ID = 1;

export class SqliteReminderRuntimeStateRepository {
  private readonly client: SqliteDatabaseClient;

  constructor(client: SqliteDatabaseClient) {
    this.client = client;
  }

  getState(): ReminderRuntimeState {
    return this.client.run("getReminderRuntimeState", () => {
      const row = this.client
        .getDrizzle()
        .select()
        .from(reminderRuntimeState)
        .where(eq(reminderRuntimeState.id, REMINDER_RUNTIME_STATE_ID))
        .get();

      if (!row) {
        return { ...DEFAULT_REMINDER_RUNTIME_STATE };
      }

      return {
        lastMidnightWarningSentAt: row.lastMidnightWarningSentAt,
        lastMissedReminderSentAt: row.lastMissedReminderSentAt,
        lastReminderSentAt: row.lastReminderSentAt,
        snoozedUntil: row.snoozedUntil,
      };
    });
  }

  saveState(state: ReminderRuntimeState): void {
    this.client.run("saveReminderRuntimeState", () => {
      this.client
        .getDrizzle()
        .insert(reminderRuntimeState)
        .values({
          id: REMINDER_RUNTIME_STATE_ID,
          lastMidnightWarningSentAt: state.lastMidnightWarningSentAt,
          lastMissedReminderSentAt: state.lastMissedReminderSentAt,
          lastReminderSentAt: state.lastReminderSentAt,
          snoozedUntil: state.snoozedUntil,
        })
        .onConflictDoUpdate({
          set: {
            lastMidnightWarningSentAt: state.lastMidnightWarningSentAt,
            lastMissedReminderSentAt: state.lastMissedReminderSentAt,
            lastReminderSentAt: state.lastReminderSentAt,
            snoozedUntil: state.snoozedUntil,
          },
          target: reminderRuntimeState.id,
        })
        .run();
    });
  }
}
