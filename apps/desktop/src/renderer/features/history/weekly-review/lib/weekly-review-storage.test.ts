import {
  readLastSeenWeeklyReviewStart,
  writeLastSeenWeeklyReviewStart,
} from "./weekly-review-storage";

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

describe("weekly-review-storage", () => {
  function installLocalStorageMock(): void {
    storage.clear();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: localStorageMock,
    });
  }

  it("round-trips the last seen review week", () => {
    installLocalStorageMock();

    writeLastSeenWeeklyReviewStart("2026-03-02");

    expect(readLastSeenWeeklyReviewStart()).toBe("2026-03-02");
  });

  it("returns null for invalid stored JSON", () => {
    installLocalStorageMock();
    storage.set("zucchini_weekly_review", "{not-json");

    expect(readLastSeenWeeklyReviewStart()).toBeNull();
  });

  it("returns null for invalid stored shape", () => {
    installLocalStorageMock();
    storage.set(
      "zucchini_weekly_review",
      JSON.stringify({ lastSeenWeeklyReviewStart: 42 })
    );

    expect(readLastSeenWeeklyReviewStart()).toBeNull();
  });
});
