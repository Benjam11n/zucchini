import { resolveTodayCelebration } from "./today-celebration";

describe("today celebration", () => {
  const baseSnapshot = {
    completedCount: 2,
    date: "2026-03-13",
    streak: {
      availableFreezes: 1,
      bestStreak: 4,
      currentStreak: 4,
      lastEvaluatedDate: "2026-03-12",
    },
  } as const;

  it("returns a completion celebration when the day just became complete", () => {
    expect(
      resolveTodayCelebration({
        completedCount: 3,
        dailyHabitCount: 3,
        date: "2026-03-13",
        lastUiState: baseSnapshot,
        streak: {
          ...baseSnapshot.streak,
          bestStreak: 4,
          currentStreak: 4,
        },
      })
    ).toMatchObject({
      isNewRecord: false,
      milestone: null,
      title: "Today complete",
    });
  });

  it("prefers a new record celebration when the streak beats the previous best", () => {
    expect(
      resolveTodayCelebration({
        completedCount: 3,
        dailyHabitCount: 3,
        date: "2026-03-13",
        lastUiState: baseSnapshot,
        streak: {
          ...baseSnapshot.streak,
          bestStreak: 5,
          currentStreak: 5,
        },
      })
    ).toMatchObject({
      isNewRecord: true,
      milestone: null,
      title: "New streak record",
    });
  });

  it("surfaces milestone celebrations when the streak crosses a threshold", () => {
    expect(
      resolveTodayCelebration({
        completedCount: 7,
        dailyHabitCount: 7,
        date: "2026-03-13",
        lastUiState: {
          ...baseSnapshot,
          completedCount: 6,
          streak: {
            ...baseSnapshot.streak,
            bestStreak: 6,
            currentStreak: 6,
          },
        },
        streak: {
          ...baseSnapshot.streak,
          bestStreak: 7,
          currentStreak: 7,
        },
      })
    ).toMatchObject({
      isNewRecord: true,
      milestone: 7,
      title: "7-day milestone",
    });
  });

  it("does not celebrate again for an already-complete day on reload", () => {
    expect(
      resolveTodayCelebration({
        completedCount: 3,
        dailyHabitCount: 3,
        date: "2026-03-13",
        lastUiState: {
          ...baseSnapshot,
          completedCount: 3,
        },
        streak: {
          ...baseSnapshot.streak,
          bestStreak: 5,
          currentStreak: 5,
        },
      })
    ).toBeNull();
  });
});
