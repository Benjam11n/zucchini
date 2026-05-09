import { awardedFreezeCountForStreak } from "./freeze";

describe("freeze awards", () => {
  it("awards one freeze on weekly streak milestones", () => {
    expect(awardedFreezeCountForStreak(7)).toBe(1);
  });

  it("awards one extra freeze on monthly streak milestones", () => {
    expect(awardedFreezeCountForStreak(30)).toBe(1);
  });

  it("stacks weekly and monthly awards on shared milestones", () => {
    expect(awardedFreezeCountForStreak(210)).toBe(2);
  });

  it("does not award freezes on non-milestones", () => {
    expect(awardedFreezeCountForStreak(6)).toBe(0);
    expect(awardedFreezeCountForStreak(0)).toBe(0);
  });
});
