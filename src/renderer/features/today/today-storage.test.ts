import {
  isPersistedTodayUiState,
  readLastUiState,
  writeLastUiState,
} from "./today-storage";

const storage = new Map<string, string>();

const localStorageMock = {
  getItem(key: string): string | null {
    return storage.get(key) ?? null;
  },
  removeItem(key: string): void {
    storage.delete(key);
  },
  setItem(key: string, value: string): void {
    storage.set(key, value);
  },
};

describe("today-storage", () => {
  function installLocalStorageMock(): void {
    storage.clear();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: localStorageMock,
    });
  }

  it("validates persisted UI state shape", () => {
    installLocalStorageMock();

    expect(
      isPersistedTodayUiState({
        completedCount: 2,
        date: "2026-03-08",
        streak: {
          availableFreezes: 1,
          bestStreak: 5,
          currentStreak: 3,
          lastEvaluatedDate: "2026-03-07",
        },
      })
    ).toBeTruthy();

    expect(isPersistedTodayUiState({ completedCount: 2 })).toBeFalsy();
  });

  it("round-trips persisted state through localStorage", () => {
    installLocalStorageMock();

    writeLastUiState({
      completedCount: 3,
      date: "2026-03-08",
      streak: {
        availableFreezes: 1,
        bestStreak: 7,
        currentStreak: 4,
        lastEvaluatedDate: "2026-03-07",
      },
    });

    expect(readLastUiState()).toStrictEqual({
      completedCount: 3,
      date: "2026-03-08",
      streak: {
        availableFreezes: 1,
        bestStreak: 7,
        currentStreak: 4,
        lastEvaluatedDate: "2026-03-07",
      },
    });
  });

  it("returns null for invalid stored JSON", () => {
    installLocalStorageMock();
    storage.set("zucchini_last_state", "{not-json");

    expect(readLastUiState()).toBeNull();
  });
});
