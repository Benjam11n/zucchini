import { previewOpenDay, settleClosedDay } from "./streak-engine";

describe("settleClosedDay behavior", () => {
  it("increments streak for a completed closed day", () => {
    const result = settleClosedDay(
      {
        availableFreezes: 1,
        bestStreak: 7,
        currentStreak: 4,
      },
      {
        allCompleted: true,
        completedAt: "2026-03-07T21:30:00.000",
        dayStatus: null,
      }
    );

    expect(result).toStrictEqual({
      allCompleted: true,
      availableFreezes: 1,
      bestStreak: 7,
      completedAt: "2026-03-07T21:30:00.000",
      currentStreak: 5,
      dayStatus: null,
      freezeUsed: false,
    });
  });

  it("consumes a freeze instead of resetting when a missed day has one available", () => {
    const result = settleClosedDay(
      {
        availableFreezes: 2,
        bestStreak: 11,
        currentStreak: 9,
      },
      {
        allCompleted: false,
        completedAt: null,
        dayStatus: null,
      }
    );

    expect(result).toStrictEqual({
      allCompleted: false,
      availableFreezes: 1,
      bestStreak: 11,
      completedAt: null,
      currentStreak: 9,
      dayStatus: null,
      freezeUsed: true,
    });
  });

  it("resets the streak when a missed day has no freezes left", () => {
    const result = settleClosedDay(
      {
        availableFreezes: 0,
        bestStreak: 11,
        currentStreak: 9,
      },
      {
        allCompleted: false,
        completedAt: null,
        dayStatus: null,
      }
    );

    expect(result).toStrictEqual({
      allCompleted: false,
      availableFreezes: 0,
      bestStreak: 11,
      completedAt: null,
      currentStreak: 0,
      dayStatus: null,
      freezeUsed: false,
    });
  });

  it("awards a new freeze on 15-streak milestones", () => {
    const result = settleClosedDay(
      {
        availableFreezes: 0,
        bestStreak: 14,
        currentStreak: 14,
      },
      {
        allCompleted: true,
        completedAt: "2026-03-15T22:00:00.000",
        dayStatus: null,
      }
    );

    expect(result).toStrictEqual({
      allCompleted: true,
      availableFreezes: 1,
      bestStreak: 15,
      completedAt: "2026-03-15T22:00:00.000",
      currentStreak: 15,
      dayStatus: null,
      freezeUsed: false,
    });
  });
});

describe("previewOpenDay behavior", () => {
  it("shows today's completed habits as a streak preview", () => {
    const result = previewOpenDay(
      {
        availableFreezes: 1,
        bestStreak: 8,
        currentStreak: 6,
      },
      true
    );

    expect(result).toStrictEqual({
      availableFreezes: 1,
      bestStreak: 8,
      currentStreak: 7,
    });
  });

  it("keeps the settled state unchanged when today is incomplete", () => {
    const result = previewOpenDay(
      {
        availableFreezes: 1,
        bestStreak: 8,
        currentStreak: 6,
      },
      false
    );

    expect(result).toStrictEqual({
      availableFreezes: 1,
      bestStreak: 8,
      currentStreak: 6,
    });
  });
});
