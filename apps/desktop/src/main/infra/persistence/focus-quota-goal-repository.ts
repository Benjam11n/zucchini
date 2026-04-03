import { and, asc, eq, sql } from "drizzle-orm";

import { focusQuotaGoals } from "@/main/infra/db/schema";
import type { SqliteDatabaseClient } from "@/main/infra/db/sqlite-client";
import {
  normalizeFocusQuotaTargetMinutes,
  normalizeGoalFrequency,
} from "@/shared/domain/goal";
import type { FocusQuotaGoal, GoalFrequency } from "@/shared/domain/goal";

export class SqliteFocusQuotaGoalRepository {
  private readonly client: SqliteDatabaseClient;

  constructor(client: SqliteDatabaseClient) {
    this.client = client;
  }

  getGoals(includeArchived = false): FocusQuotaGoal[] {
    return this.client.run("getFocusQuotaGoals", () => {
      const query = this.client
        .getDrizzle()
        .select()
        .from(focusQuotaGoals)
        .orderBy(asc(focusQuotaGoals.frequency), asc(focusQuotaGoals.id));
      const rows = includeArchived
        ? query.all()
        : query.where(eq(focusQuotaGoals.isArchived, false)).all();

      return rows.map((row) => ({
        archivedAt: row.archivedAt,
        createdAt: row.createdAt,
        frequency: normalizeGoalFrequency(row.frequency),
        id: row.id,
        isArchived: row.isArchived,
        targetMinutes: normalizeFocusQuotaTargetMinutes(
          normalizeGoalFrequency(row.frequency),
          row.targetMinutes
        ),
      }));
    });
  }

  upsertGoal(
    frequency: GoalFrequency,
    targetMinutes: number,
    createdAt: string
  ): void {
    this.client.run("upsertFocusQuotaGoal", () => {
      const normalizedTargetMinutes = normalizeFocusQuotaTargetMinutes(
        frequency,
        targetMinutes
      );
      const existing = this.client
        .getDrizzle()
        .select()
        .from(focusQuotaGoals)
        .where(
          and(
            eq(focusQuotaGoals.frequency, frequency),
            eq(focusQuotaGoals.isArchived, false)
          )
        )
        .get();

      if (existing) {
        if (existing.targetMinutes === normalizedTargetMinutes) {
          return;
        }

        this.client
          .getDrizzle()
          .update(focusQuotaGoals)
          .set({
            archivedAt: createdAt,
            isArchived: true,
          })
          .where(eq(focusQuotaGoals.id, existing.id))
          .run();
      }

      this.client
        .getDrizzle()
        .insert(focusQuotaGoals)
        .values({
          archivedAt: null,
          createdAt,
          frequency,
          isArchived: false,
          targetMinutes: normalizedTargetMinutes,
        })
        .run();
    });
  }

  archiveGoal(goalId: number, archivedAt: string): void {
    this.client.run("archiveFocusQuotaGoal", () => {
      this.client
        .getDrizzle()
        .update(focusQuotaGoals)
        .set({ archivedAt, isArchived: true })
        .where(eq(focusQuotaGoals.id, goalId))
        .run();
    });
  }

  unarchiveGoal(goalId: number, restoredAt: string): void {
    this.client.run("unarchiveFocusQuotaGoal", () => {
      const goal = this.client
        .getDrizzle()
        .select()
        .from(focusQuotaGoals)
        .where(eq(focusQuotaGoals.id, goalId))
        .get();

      if (!goal) {
        return;
      }

      this.client
        .getDrizzle()
        .update(focusQuotaGoals)
        .set({ archivedAt: restoredAt, isArchived: true })
        .where(
          and(
            eq(focusQuotaGoals.frequency, goal.frequency),
            eq(focusQuotaGoals.isArchived, false),
            sql`${focusQuotaGoals.id} <> ${goalId}`
          )
        )
        .run();

      this.client
        .getDrizzle()
        .update(focusQuotaGoals)
        .set({ archivedAt: null, isArchived: false })
        .where(eq(focusQuotaGoals.id, goalId))
        .run();
    });
  }
}
