import type { HistoryDay } from "@/shared/domain/history";
import { toDateKey } from "@/shared/utils/date";

import {
  buildContributionWeeks,
  getHistoryDayLookup,
  getHistoryStats,
} from "./history-page.utils";

function createHistoryDay(
  date: string,
  summary: Partial<HistoryDay["summary"]> = {}
): HistoryDay {
  return {
    categoryProgress: [],
    date,
    habits: [],
    summary: {
      allCompleted: false,
      completedAt: null,
      date,
      freezeUsed: false,
      streakCountAfterDay: 0,
      ...summary,
    },
  };
}

describe("buildContributionWeeks()", () => {
  it("pads the range to whole weeks and preserves completion states", () => {
    const history = [
      createHistoryDay("2026-03-02", {
        allCompleted: true,
        completedAt: "2026-03-02T21:00:00.000Z",
        streakCountAfterDay: 2,
      }),
      createHistoryDay("2026-03-03", {
        freezeUsed: true,
        streakCountAfterDay: 2,
      }),
      createHistoryDay("2026-03-04", {
        streakCountAfterDay: 0,
      }),
    ];

    const weeks = buildContributionWeeks(history);
    const [firstWeek] = weeks;
    const statuses = firstWeek?.cells.map((cell) => cell.status);
    const dates = firstWeek?.cells.map((cell) => cell.date);

    expect(weeks).toHaveLength(1);
    expect(firstWeek?.cells).toHaveLength(7);
    expect(dates).toStrictEqual([
      "2026-03-01",
      "2026-03-02",
      "2026-03-03",
      "2026-03-04",
      "2026-03-05",
      "2026-03-06",
      "2026-03-07",
    ]);
    expect(statuses).toStrictEqual([
      "empty",
      "complete",
      "freeze",
      "in-progress",
      "empty",
      "empty",
      "empty",
    ]);
    expect(firstWeek?.cells[3]?.isToday).toBeTruthy();
  });
});

describe("getHistoryStats()", () => {
  it("counts complete, freeze, and missed days separately", () => {
    const history = [
      createHistoryDay("2026-03-02", { allCompleted: true }),
      createHistoryDay("2026-03-03", { freezeUsed: true }),
      createHistoryDay("2026-03-04"),
    ];

    expect(getHistoryStats(history)).toStrictEqual({
      completedDays: 1,
      completionRate: 33,
      freezeDays: 1,
      missedDays: 1,
    });
  });
});

describe("history date helpers", () => {
  it("creates a date lookup and formats a date back to the same key", () => {
    const history = [createHistoryDay("2026-03-08")];
    const lookup = getHistoryDayLookup(history);

    expect(lookup.get("2026-03-08")?.date).toBe("2026-03-08");
    expect(toDateKey(new Date(2026, 2, 8))).toBe("2026-03-08");
  });
});
