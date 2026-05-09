import type { HistoryDay } from "@/shared/domain/history";
import { toDateKey } from "@/shared/utils/date";

import {
  getActivityBadgeLabel,
  getActivityStatus,
  getHistoryDayLookup,
} from "./history-summary";

function createHistoryDay(
  date: string,
  summary: Partial<HistoryDay["summary"]> = {}
): HistoryDay {
  return {
    categoryProgress: [],
    date,
    focusMinutes: 0,
    habits: [],
    summary: {
      allCompleted: false,
      completedAt: null,
      date,
      dayStatus: null,
      freezeUsed: false,
      streakCountAfterDay: 0,
      ...summary,
    },
  };
}

describe("history summary", () => {
  it("creates a date lookup and preserves the date key", () => {
    const history = [createHistoryDay("2026-03-08")];
    const lookup = getHistoryDayLookup(history);

    expect(lookup.get("2026-03-08")?.date).toBe("2026-03-08");
    expect(toDateKey(new Date(2026, 2, 8))).toBe("2026-03-08");
  });

  it("returns the correct activity status for each day type", () => {
    const completeSummary = createHistoryDay("2026-03-02", {
      allCompleted: true,
    }).summary;
    const freezeSummary = createHistoryDay("2026-03-03", {
      freezeUsed: true,
    }).summary;
    const incompleteSummary = createHistoryDay("2026-03-04").summary;

    expect(getActivityStatus(completeSummary)).toBe("complete");
    expect(getActivityStatus(freezeSummary)).toBe("freeze");
    expect(getActivityStatus(incompleteSummary, true)).toBe("in-progress");
    expect(getActivityStatus(incompleteSummary, false)).toBe("missed");
  });

  it("returns activity badge labels matching the status", () => {
    const completeSummary = createHistoryDay("2026-03-02", {
      allCompleted: true,
    }).summary;
    const freezeSummary = createHistoryDay("2026-03-03", {
      freezeUsed: true,
    }).summary;
    const incompleteSummary = createHistoryDay("2026-03-04").summary;

    expect(getActivityBadgeLabel(completeSummary)).toBe("Complete");
    expect(getActivityBadgeLabel(freezeSummary)).toBe("Freeze");
    expect(getActivityBadgeLabel(incompleteSummary, true)).toBe("In Progress");
    expect(getActivityBadgeLabel(incompleteSummary, false)).toBe("Missed");
  });
});
