/**
 * Focus session data repository.
 *
 * CRUD operations for focus sessions persisted in SQLite. Supports
 * listing recent sessions (with optional limit), date-range queries,
 * and inserting new sessions with auto-generated IDs.
 */
import { and, asc, desc, gte, lte } from "drizzle-orm";

import { focusSessions } from "@/main/infra/db/schema";
import type { SqliteDatabaseClient } from "@/main/infra/db/sqlite-client";
import type {
  CreateFocusSessionInput,
  FocusSession,
} from "@/shared/domain/focus-session";

import { mapFocusSession } from "./mappers";
import { DEFAULT_FOCUS_SESSION_LIMIT } from "./persistence-defaults";

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

  listSessionsInRange(start: string, end: string): FocusSession[] {
    return this.client.run("listFocusSessionsInRange", () =>
      this.client
        .getDrizzle()
        .select()
        .from(focusSessions)
        .where(
          and(
            gte(focusSessions.completedDate, start),
            lte(focusSessions.completedDate, end)
          )
        )
        .orderBy(asc(focusSessions.completedAt), asc(focusSessions.id))
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
          entryKind: input.entryKind,
          startedAt: input.startedAt,
          timerSessionId: input.timerSessionId,
        })
        .returning()
        .get();

      return mapFocusSession(row);
    });
  }
}
