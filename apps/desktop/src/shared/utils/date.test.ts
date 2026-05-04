import {
  endOfIsoWeek,
  formatDate,
  formatDateKey,
  formatIsoDateTime,
  formatIsoTime,
  getPreviousCompletedIsoWeek,
  isMonday,
  startOfIsoWeek,
  toDateKeyInTimeZone,
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

  it("formats date keys and ISO timestamps through shared helpers", () => {
    expect(
      formatDateKey("2026-03-13", {
        day: "numeric",
        month: "short",
        weekday: "short",
      })
    ).toBe(
      formatDate(new Date(2026, 2, 13), {
        day: "numeric",
        month: "short",
        weekday: "short",
      })
    );
    expect(
      formatIsoDateTime("2026-03-13T09:30:00.000Z", {
        hour: "numeric",
        minute: "2-digit",
      })
    ).toBe(formatIsoTime("2026-03-13T09:30:00.000Z"));
  });

  it("formats date keys in the requested timezone", () => {
    const instant = new Date("2026-03-08T23:30:00.000Z");

    expect(toDateKeyInTimeZone(instant, "UTC")).toBe("2026-03-08");
    expect(toDateKeyInTimeZone(instant, "Asia/Singapore")).toBe("2026-03-09");
  });
});
