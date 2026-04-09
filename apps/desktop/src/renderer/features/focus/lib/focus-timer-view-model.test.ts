import { getCycleChipLabel } from "./focus-timer-view-model";

describe("focus timer view model", () => {
  it("formats the long-break cycle label without repeating the heading", () => {
    expect(getCycleChipLabel(1)).toBe("1 session");
    expect(getCycleChipLabel(2)).toBe("2 sessions");
    expect(getCycleChipLabel(4)).toBe("4 sessions");
  });
});
