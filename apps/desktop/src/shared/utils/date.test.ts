import {
  endOfIsoWeek,
  getPreviousCompletedIsoWeek,
  isMonday,
  startOfIsoWeek,
} from "./date";

describe("iSO week helpers", () => {
  it("computes Monday-Sunday review windows", () => {
    expect(startOfIsoWeek("2026-03-08")).toBe("2026-03-02");
    expect(endOfIsoWeek("2026-03-08")).toBe("2026-03-08");
    expect(startOfIsoWeek("2026-03-09")).toBe("2026-03-09");
    expect(endOfIsoWeek("2026-03-09")).toBe("2026-03-15");
  });

  it("detects Mondays", () => {
    expect(isMonday("2026-03-09")).toBeTruthy();
    expect(isMonday("2026-03-08")).toBeFalsy();
  });

  it("returns the latest completed ISO week for any current day", () => {
    expect(getPreviousCompletedIsoWeek("2026-03-09")).toStrictEqual({
      weekEnd: "2026-03-08",
      weekStart: "2026-03-02",
    });
    expect(getPreviousCompletedIsoWeek("2026-03-11")).toStrictEqual({
      weekEnd: "2026-03-08",
      weekStart: "2026-03-02",
    });
  });
});
