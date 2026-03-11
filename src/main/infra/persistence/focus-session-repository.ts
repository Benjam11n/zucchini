import { desc } from "drizzle-orm";

import type {
  CreateFocusSessionInput,
  FocusSession,
} from "@/shared/domain/focus-session";

import { focusSessions } from "../db/schema";
import type { SqliteDatabaseClient } from "../db/sqlite-client";
import { mapFocusSession } from "./mappers";

const DEFAULT_FOCUS_SESSION_LIMIT = 30;

export class SqliteFocusSessionRepository {
  private readonly client: SqliteDatabaseClient;

  constructor(client: SqliteDatabaseClient) {
    this.client = client;
  }

  listRecentSessions(limit = DEFAULT_FOCUS_SESSION_LIMIT): FocusSession[] {
    return this.client.run("listRecentFocusSessions", () =>
      this.client
        .getDrizzle()
        .select()
        .from(focusSessions)
        .orderBy(desc(focusSessions.completedAt), desc(focusSessions.id))
        .limit(limit)
        .all()
        .map((row) => mapFocusSession(row))
    );
  }

  insertSession(input: CreateFocusSessionInput): FocusSession {
    return this.client.run("insertFocusSession", () => {
      const row = this.client
        .getDrizzle()
        .insert(focusSessions)
        .values({
          completedAt: input.completedAt,
          completedDate: input.completedDate,
          durationSeconds: input.durationSeconds,
          startedAt: input.startedAt,
        })
        .returning()
        .get();

      return mapFocusSession(row);
    });
  }
}
