import { and, asc, eq, sql } from "drizzle-orm";

import { windDownActions, windDownActionStatus } from "@/main/infra/db/schema";
import type { SqliteDatabaseClient } from "@/main/infra/db/sqlite-client";
import { mapWindDownAction } from "@/main/infra/persistence/mappers";
import type {
  WindDownAction,
  WindDownActionWithStatus,
} from "@/shared/domain/wind-down";

export class SqliteWindDownActionRepository {
  private readonly client: SqliteDatabaseClient;

  constructor(client: SqliteDatabaseClient) {
    this.client = client;
  }

  getActions(): WindDownAction[] {
    return this.client.run("getWindDownActions", () =>
      this.client
        .getDrizzle()
        .select()
        .from(windDownActions)
        .orderBy(asc(windDownActions.sortOrder), asc(windDownActions.id))
        .all()
        .map((row) => mapWindDownAction(row))
    );
  }

  getActionsWithStatus(date: string): WindDownActionWithStatus[] {
    return this.client.run("getWindDownActionsWithStatus", () => {
      const actions = this.getActions();

      if (actions.length === 0) {
        return [];
      }

      const statusByActionId = new Map(
        this.client
          .getDrizzle()
          .select()
          .from(windDownActionStatus)
          .where(eq(windDownActionStatus.date, date))
          .all()
          .map((row) => [row.actionId, row] as const)
      );

      return actions.map((action) => {
        const status = statusByActionId.get(action.id);

        return {
          ...action,
          completed: status?.completed ?? false,
          completedAt: status?.completedAt ?? null,
        };
      });
    });
  }

  ensureStatusRowsForDate(date: string): void {
    this.client.run("ensureWindDownStatusRowsForDate", () => {
      const actions = this.getActions();

      if (actions.length === 0) {
        return;
      }

      this.client
        .getDrizzle()
        .insert(windDownActionStatus)
        .values(
          actions.map((action) => ({
            actionId: action.id,
            completed: false,
            completedAt: null,
            date,
          }))
        )
        .onConflictDoNothing()
        .run();
    });
  }

  createAction(name: string, createdAt: string): number {
    return this.client.run("createWindDownAction", () => {
      const currentMaxSortOrder = this.client
        .getDrizzle()
        .select({
          maxSortOrder: sql<number>`coalesce(max(${windDownActions.sortOrder}), -1)`,
        })
        .from(windDownActions)
        .get()?.maxSortOrder;

      return this.client
        .getDrizzle()
        .insert(windDownActions)
        .values({
          createdAt,
          name,
          sortOrder: (currentMaxSortOrder ?? -1) + 1,
        })
        .returning({
          id: windDownActions.id,
        })
        .get().id;
    });
  }

  renameAction(actionId: number, name: string): void {
    this.client.run("renameWindDownAction", () => {
      this.client
        .getDrizzle()
        .update(windDownActions)
        .set({ name })
        .where(eq(windDownActions.id, actionId))
        .run();
    });
  }

  deleteAction(actionId: number): void {
    this.client.run("deleteWindDownAction", () => {
      this.client
        .getDrizzle()
        .delete(windDownActionStatus)
        .where(eq(windDownActionStatus.actionId, actionId))
        .run();
      this.client
        .getDrizzle()
        .delete(windDownActions)
        .where(eq(windDownActions.id, actionId))
        .run();
    });
  }

  toggleAction(date: string, actionId: number, completedAt: string): void {
    this.client.run("toggleWindDownAction", () => {
      const existingAction = this.client
        .getDrizzle()
        .select({ id: windDownActions.id })
        .from(windDownActions)
        .where(eq(windDownActions.id, actionId))
        .get();

      if (!existingAction) {
        return;
      }

      const currentStatus = this.client
        .getDrizzle()
        .select()
        .from(windDownActionStatus)
        .where(
          and(
            eq(windDownActionStatus.date, date),
            eq(windDownActionStatus.actionId, actionId)
          )
        )
        .get();

      const nextCompleted = !currentStatus?.completed;

      this.client
        .getDrizzle()
        .insert(windDownActionStatus)
        .values({
          actionId,
          completed: nextCompleted,
          completedAt: nextCompleted ? completedAt : null,
          date,
        })
        .onConflictDoUpdate({
          set: {
            completed: nextCompleted,
            completedAt: nextCompleted ? completedAt : null,
          },
          target: [windDownActionStatus.date, windDownActionStatus.actionId],
        })
        .run();
    });
  }
}
