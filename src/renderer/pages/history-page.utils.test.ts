import type { DailySummary } from "../../shared/domain/streak";
import {
  buildContributionWeeks,
  getHistoryStats,
  getRecentHistory,
} from "./history-page.utils";

describe("buildContributionWeeks()", () => {
  it("pads the range to whole weeks and preserves completion states", () => {
    const history: DailySummary[] = [
      {
        allCompleted: true,
        completedAt: "2026-03-02T21:00:00.000Z",
        date: "2026-03-02",
        freezeUsed: false,
        streakCountAfterDay: 2,
      },
      {
        allCompleted: false,
        completedAt: null,
        date: "2026-03-03",
        freezeUsed: true,
        streakCountAfterDay: 2,
      },
      {
        allCompleted: false,
        completedAt: null,
        date: "2026-03-04",
        freezeUsed: false,
        streakCountAfterDay: 0,
      },
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
      "missed",
      "empty",
      "empty",
      "empty",
    ]);
    expect(firstWeek?.cells[3]?.isToday).toBeTruthy();
  });
});

describe("getHistoryStats()", () => {
  it("counts complete, freeze, and missed days separately", () => {
    const history: DailySummary[] = [
      {
        allCompleted: true,
        completedAt: "2026-03-02T21:00:00.000Z",
        date: "2026-03-02",
        freezeUsed: false,
        streakCountAfterDay: 2,
      },
      {
        allCompleted: false,
        completedAt: null,
        date: "2026-03-03",
        freezeUsed: true,
        streakCountAfterDay: 2,
      },
      {
        allCompleted: false,
        completedAt: null,
        date: "2026-03-04",
        freezeUsed: false,
        streakCountAfterDay: 0,
      },
    ];

    expect(getHistoryStats(history)).toStrictEqual({
      completedDays: 1,
      completionRate: 33,
      freezeDays: 1,
      missedDays: 1,
    });
  });
});

describe("getRecentHistory()", () => {
  it("filters by the selected range relative to the latest day", () => {
    const history: DailySummary[] = [
      {
        allCompleted: true,
        completedAt: "2026-03-08T21:00:00.000Z",
        date: "2026-03-08",
        freezeUsed: false,
        streakCountAfterDay: 5,
      },
      {
        allCompleted: false,
        completedAt: null,
        date: "2026-03-03",
        freezeUsed: true,
        streakCountAfterDay: 4,
      },
      {
        allCompleted: false,
        completedAt: null,
        date: "2026-02-10",
        freezeUsed: false,
        streakCountAfterDay: 0,
      },
      {
        allCompleted: true,
        completedAt: "2025-03-12T21:00:00.000Z",
        date: "2025-03-12",
        freezeUsed: false,
        streakCountAfterDay: 7,
      },
      {
        allCompleted: true,
        completedAt: "2025-03-08T21:00:00.000Z",
        date: "2025-03-08",
        freezeUsed: false,
        streakCountAfterDay: 3,
      },
    ];

    expect(
      getRecentHistory(history, "week").map((day) => day.date)
    ).toStrictEqual(["2026-03-08", "2026-03-03"]);
    expect(
      getRecentHistory(history, "month").map((day) => day.date)
    ).toStrictEqual(["2026-03-08", "2026-03-03", "2026-02-10"]);
    expect(
      getRecentHistory(history, "year").map((day) => day.date)
    ).toStrictEqual(["2026-03-08", "2026-03-03", "2026-02-10", "2025-03-12"]);
  });
});
