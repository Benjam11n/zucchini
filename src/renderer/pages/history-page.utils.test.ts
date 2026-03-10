import type { HistoryDay } from "@/shared/domain/history";
import { toDateKey } from "@/shared/utils/date";

import {
  buildContributionWeeks,
  formatContributionLabel,
  getHistoryDayLookup,
  getHistoryStats,
} from "./history-page.utils";

function createHistoryDay(
  date: string,
  summary: Partial<HistoryDay["summary"]> = {},
  habits: HistoryDay["habits"] = []
): HistoryDay {
  return {
    categoryProgress: [],
    date,
    habits,
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
      createHistoryDay(
        "2026-03-02",
        {
          allCompleted: true,
          completedAt: "2026-03-02T21:00:00.000Z",
          streakCountAfterDay: 2,
        },
        [
          {
            category: "fitness",
            completed: true,
            createdAt: "",
            frequency: "daily",
            id: 1,
            isArchived: false,
            name: "Run",
            sortOrder: 0,
          },
          {
            category: "fitness",
            completed: true,
            createdAt: "",
            frequency: "daily",
            id: 2,
            isArchived: false,
            name: "Stretch",
            sortOrder: 1,
          },
        ]
      ),
      createHistoryDay(
        "2026-03-03",
        {
          freezeUsed: true,
          streakCountAfterDay: 2,
        },
        [
          {
            category: "fitness",
            completed: true,
            createdAt: "",
            frequency: "daily",
            id: 1,
            isArchived: false,
            name: "Run",
            sortOrder: 0,
          },
          {
            category: "fitness",
            completed: false,
            createdAt: "",
            frequency: "daily",
            id: 2,
            isArchived: false,
            name: "Stretch",
            sortOrder: 1,
          },
        ]
      ),
      createHistoryDay(
        "2026-03-04",
        {
          streakCountAfterDay: 0,
        },
        [
          {
            category: "fitness",
            completed: false,
            createdAt: "",
            frequency: "daily",
            id: 1,
            isArchived: false,
            name: "Run",
            sortOrder: 0,
          },
          {
            category: "fitness",
            completed: false,
            createdAt: "",
            frequency: "daily",
            id: 2,
            isArchived: false,
            name: "Stretch",
            sortOrder: 1,
          },
        ]
      ),
    ];

    const weeks = buildContributionWeeks(history);
    const [firstWeek] = weeks;

    expect(weeks).toHaveLength(1);
    expect(
      firstWeek?.cells.map((cell) => ({
        completedCount: cell.completedCount,
        date: cell.date,
        intensity: cell.intensity,
        isToday: cell.isToday,
        status: cell.status,
      }))
    ).toStrictEqual([
      {
        completedCount: 0,
        date: "2026-03-01",
        intensity: 0,
        isToday: false,
        status: "empty",
      },
      {
        completedCount: 2,
        date: "2026-03-02",
        intensity: 4,
        isToday: false,
        status: "complete",
      },
      {
        completedCount: 1,
        date: "2026-03-03",
        intensity: 2,
        isToday: false,
        status: "freeze",
      },
      {
        completedCount: 0,
        date: "2026-03-04",
        intensity: 0,
        isToday: true,
        status: "in-progress",
      },
      {
        completedCount: 0,
        date: "2026-03-05",
        intensity: 0,
        isToday: false,
        status: "empty",
      },
      {
        completedCount: 0,
        date: "2026-03-06",
        intensity: 0,
        isToday: false,
        status: "empty",
      },
      {
        completedCount: 0,
        date: "2026-03-07",
        intensity: 0,
        isToday: false,
        status: "empty",
      },
    ]);
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

  it("formats contribution labels with completion counts", () => {
    const weeks = buildContributionWeeks([
      createHistoryDay("2026-03-08", { freezeUsed: true }, [
        {
          category: "fitness",
          completed: true,
          createdAt: "",
          frequency: "daily",
          id: 1,
          isArchived: false,
          name: "Run",
          sortOrder: 0,
        },
        {
          category: "fitness",
          completed: false,
          createdAt: "",
          frequency: "daily",
          id: 2,
          isArchived: false,
          name: "Stretch",
          sortOrder: 1,
        },
      ]),
    ]);
    const day = weeks[0]!.cells.find((cell) => cell.date === "2026-03-08")!;

    expect(formatContributionLabel(day)).toBe(
      "Sunday, Mar 8, 2026: 1 of 2 daily habits completed, freeze used to preserve streak"
    );
  });
});
