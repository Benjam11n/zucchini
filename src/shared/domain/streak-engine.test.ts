import { describe, expect, it } from "vitest";
import { previewOpenDay, settleClosedDay } from "./streak-engine";

describe("settleClosedDay", () => {
  it("increments streak for a completed closed day", () => {
    const result = settleClosedDay(
      {
        currentStreak: 4,
        bestStreak: 7,
        availableFreezes: 1,
      },
      true,
      "2026-03-07T21:30:00.000",
    );

    expect(result).toEqual({
      currentStreak: 5,
      bestStreak: 7,
      availableFreezes: 1,
      freezeUsed: false,
      allCompleted: true,
      completedAt: "2026-03-07T21:30:00.000",
    });
  });

  it("consumes a freeze instead of resetting when a missed day has one available", () => {
    const result = settleClosedDay(
      {
        currentStreak: 9,
        bestStreak: 11,
        availableFreezes: 2,
      },
      false,
      null,
    );

    expect(result).toEqual({
      currentStreak: 9,
      bestStreak: 11,
      availableFreezes: 1,
      freezeUsed: true,
      allCompleted: false,
      completedAt: null,
    });
  });

  it("resets the streak when a missed day has no freezes left", () => {
    const result = settleClosedDay(
      {
        currentStreak: 9,
        bestStreak: 11,
        availableFreezes: 0,
      },
      false,
      null,
    );

    expect(result).toEqual({
      currentStreak: 0,
      bestStreak: 11,
      availableFreezes: 0,
      freezeUsed: false,
      allCompleted: false,
      completedAt: null,
    });
  });

  it("awards a new freeze on 15-streak milestones", () => {
    const result = settleClosedDay(
      {
        currentStreak: 14,
        bestStreak: 14,
        availableFreezes: 0,
      },
      true,
      "2026-03-15T22:00:00.000",
    );

    expect(result).toEqual({
      currentStreak: 15,
      bestStreak: 15,
      availableFreezes: 1,
      freezeUsed: false,
      allCompleted: true,
      completedAt: "2026-03-15T22:00:00.000",
    });
  });
});

describe("previewOpenDay", () => {
  it("shows today's completed habits as a streak preview", () => {
    const result = previewOpenDay(
      {
        currentStreak: 6,
        bestStreak: 8,
        availableFreezes: 1,
      },
      true,
    );

    expect(result).toEqual({
      currentStreak: 7,
      bestStreak: 8,
      availableFreezes: 1,
    });
  });

  it("keeps the settled state unchanged when today is incomplete", () => {
    const result = previewOpenDay(
      {
        currentStreak: 6,
        bestStreak: 8,
        availableFreezes: 1,
      },
      false,
    );

    expect(result).toEqual({
      currentStreak: 6,
      bestStreak: 8,
      availableFreezes: 1,
    });
  });
});
