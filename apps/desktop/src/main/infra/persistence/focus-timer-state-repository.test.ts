import type { PersistedFocusTimerState } from "@/shared/domain/focus-timer";

import { SqliteFocusTimerStateRepository } from "./focus-timer-state-repository";

function createFakeClient(initialRow: Record<string, unknown> | undefined) {
  let row = initialRow;

  return {
    getDrizzle() {
      return {
        insert() {
          return {
            values(value: Record<string, unknown>) {
              return {
                onConflictDoUpdate({ set }: { set: Record<string, unknown> }) {
                  return {
                    run() {
                      row = row ? { ...row, ...set } : { ...value };
                    },
                  };
                },
              };
            },
          };
        },
        select() {
          return {
            from() {
              return {
                where() {
                  return {
                    get() {
                      return row;
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
    run<T>(_label: string, execute: () => T): T {
      return execute();
    },
  };
}

describe("SqliteFocusTimerStateRepository", () => {
  it("returns null when no timer state row exists", () => {
    const repository = new SqliteFocusTimerStateRepository(
      // oxlint-disable-next-line unicorn/no-useless-undefined
      createFakeClient(undefined) as never
    );

    expect(repository.getState()).toBeNull();
  });

  it("round-trips focus timer state through the repository", () => {
    const repository = new SqliteFocusTimerStateRepository(
      // oxlint-disable-next-line unicorn/no-useless-undefined
      createFakeClient(undefined) as never
    );
    const state: PersistedFocusTimerState = {
      breakVariant: "long",
      completedFocusCycles: 2,
      cycleId: "cycle-roundtrip",
      endsAt: "2026-03-08T09:25:00.000Z",
      focusDurationMs: 1500 * 1000,
      lastCompletedBreak: {
        completedAt: "2026-03-08T09:20:00.000Z",
        timerSessionId: "timer-session-roundtrip",
        variant: "long",
      },
      lastUpdatedAt: "2026-03-08T09:10:00.000Z",
      phase: "break",
      remainingMs: 300 * 1000,
      startedAt: null,
      status: "running",
      timerSessionId: "timer-session-roundtrip",
    };

    expect(repository.saveState(state)).toStrictEqual(state);
    expect(repository.getState()).toStrictEqual(state);
  });
});
