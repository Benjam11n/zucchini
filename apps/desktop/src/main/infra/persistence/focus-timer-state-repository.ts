import { eq } from "drizzle-orm";

import { focusTimerState } from "@/main/infra/db/schema";
import type { SqliteDatabaseClient } from "@/main/infra/db/sqlite-client";
import { persistedFocusTimerStateSchema } from "@/shared/contracts/habits-ipc-schema";
import type { PersistedFocusTimerState } from "@/shared/domain/focus-timer";

const FOCUS_TIMER_STATE_ROW_ID = 1;

type FocusTimerStateRow = typeof focusTimerState.$inferSelect;

function toPersistedFocusTimerState(
  row: FocusTimerStateRow | undefined
): PersistedFocusTimerState | null {
  if (!row) {
    return null;
  }

  const parsed = persistedFocusTimerStateSchema.safeParse({
    breakVariant: row.breakVariant,
    completedFocusCycles: row.completedFocusCycles,
    cycleId: row.cycleId,
    endsAt: row.endsAt,
    focusDurationMs: row.focusDurationMs,
    lastCompletedBreak:
      row.lastCompletedBreakCompletedAt &&
      row.lastCompletedBreakTimerSessionId &&
      row.lastCompletedBreakVariant
        ? {
            completedAt: row.lastCompletedBreakCompletedAt,
            timerSessionId: row.lastCompletedBreakTimerSessionId,
            variant: row.lastCompletedBreakVariant,
          }
        : null,
    lastUpdatedAt: row.lastUpdatedAt,
    phase: row.phase,
    remainingMs: row.remainingMs,
    startedAt: row.startedAt,
    status: row.status,
    timerSessionId: row.timerSessionId,
  });

  return parsed.success ? parsed.data : null;
}

export class SqliteFocusTimerStateRepository {
  private readonly client: SqliteDatabaseClient;

  constructor(client: SqliteDatabaseClient) {
    this.client = client;
  }

  getState(): PersistedFocusTimerState | null {
    return this.client.run("getFocusTimerState", () =>
      toPersistedFocusTimerState(
        this.client
          .getDrizzle()
          .select()
          .from(focusTimerState)
          .where(eq(focusTimerState.id, FOCUS_TIMER_STATE_ROW_ID))
          .get()
      )
    );
  }

  saveState(state: PersistedFocusTimerState): PersistedFocusTimerState {
    this.client.run("saveFocusTimerState", () => {
      this.client
        .getDrizzle()
        .insert(focusTimerState)
        .values({
          breakVariant: state.breakVariant,
          completedFocusCycles: state.completedFocusCycles,
          cycleId: state.cycleId,
          endsAt: state.endsAt,
          focusDurationMs: state.focusDurationMs,
          id: FOCUS_TIMER_STATE_ROW_ID,
          lastCompletedBreakCompletedAt:
            state.lastCompletedBreak?.completedAt ?? null,
          lastCompletedBreakTimerSessionId:
            state.lastCompletedBreak?.timerSessionId ?? null,
          lastCompletedBreakVariant: state.lastCompletedBreak?.variant ?? null,
          lastUpdatedAt: state.lastUpdatedAt,
          phase: state.phase,
          remainingMs: state.remainingMs,
          startedAt: state.startedAt,
          status: state.status,
          timerSessionId: state.timerSessionId,
        })
        .onConflictDoUpdate({
          set: {
            breakVariant: state.breakVariant,
            completedFocusCycles: state.completedFocusCycles,
            cycleId: state.cycleId,
            endsAt: state.endsAt,
            focusDurationMs: state.focusDurationMs,
            lastCompletedBreakCompletedAt:
              state.lastCompletedBreak?.completedAt ?? null,
            lastCompletedBreakTimerSessionId:
              state.lastCompletedBreak?.timerSessionId ?? null,
            lastCompletedBreakVariant:
              state.lastCompletedBreak?.variant ?? null,
            lastUpdatedAt: state.lastUpdatedAt,
            phase: state.phase,
            remainingMs: state.remainingMs,
            startedAt: state.startedAt,
            status: state.status,
            timerSessionId: state.timerSessionId,
          },
          target: focusTimerState.id,
        })
        .run();
    });

    return this.getState() ?? state;
  }
}
