// @vitest-environment jsdom

import {
  isPersistedFocusTimerState,
  readFocusTimerState,
  writeFocusTimerState,
} from "./focus-storage";

function createLocalStorageMock() {
  const storage = new Map<string, string>();

  return {
    clear() {
      storage.clear();
    },
    getItem(key: string) {
      return storage.get(key) ?? null;
    },
    removeItem(key: string) {
      storage.delete(key);
    },
    setItem(key: string, value: string) {
      storage.set(key, value);
    },
  };
}

function installLocalStorageMock() {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: createLocalStorageMock(),
  });
  localStorage.clear();
}

describe("focus storage", () => {
  it("accepts valid persisted timer state", () => {
    installLocalStorageMock();

    expect(
      isPersistedFocusTimerState({
        cycleId: "cycle-1",
        endsAt: "2026-03-08T09:25:00.000Z",
        lastUpdatedAt: "2026-03-08T09:00:00.000Z",
        phase: "focus",
        remainingMs: 1_500_000,
        startedAt: "2026-03-08T09:00:00.000Z",
        status: "running",
      })
    ).toBeTruthy();
  });

  it("returns null for corrupted storage payloads", () => {
    installLocalStorageMock();
    localStorage.setItem("zucchini_focus_timer", "{bad json");

    expect(readFocusTimerState()).toBeNull();
  });

  it("round-trips timer state through localStorage", () => {
    installLocalStorageMock();
    const state = {
      cycleId: null,
      endsAt: null,
      lastUpdatedAt: "2026-03-08T09:00:00.000Z",
      phase: "focus" as const,
      remainingMs: 1_500_000,
      startedAt: null,
      status: "idle" as const,
    };

    writeFocusTimerState(state);

    expect(readFocusTimerState()).toStrictEqual(state);
  });
});
