import type { HabitsService } from "@/main/features/habits/habits-application-service";
import { readHabitServiceQuery } from "@/main/features/habits/habits-ipc-dispatch";

describe("readHabitServiceQuery()", () => {
  it("dispatches the insights dashboard query", () => {
    const dashboard = {
      generatedAtDate: "2026-03-31",
      habitLeaderboard: [],
      isEmpty: true,
      momentum: { label: "Building momentum", score: 0, sparkline: [] },
      period: {
        currentEnd: "2026-03-31",
        currentStart: "2026-01-01",
        label: "Last 90 days",
      },
      smartInsights: [],
      summary: {
        completed: {
          deltaLabel: "No change",
          label: "Completed",
          trend: [],
          value: "0",
        },
        focus: {
          deltaLabel: "No change",
          label: "Focus hours",
          trend: [],
          value: "0m",
        },
        perfectDays: {
          deltaLabel: "No change",
          label: "Perfect days",
          trend: [],
          value: "0",
        },
        savedStreaks: {
          deltaLabel: "No change",
          label: "Saved streaks",
          trend: [],
          value: "0",
        },
      },
      weekdayRhythmPlaceholder: { body: "Later", title: "Weekday rhythm" },
      weeklyCompletion: [],
    };
    const service = {
      getInsightsDashboard: vi.fn(() => dashboard),
    } as unknown as HabitsService;

    expect(readHabitServiceQuery(service, { type: "insights.dashboard" })).toBe(
      dashboard
    );
    expect(service.getInsightsDashboard).toHaveBeenCalledOnce();
  });
});
