// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";

import type { InsightsDashboard } from "@/shared/domain/insights";

import { InsightsPage } from "./insights-page";

function createDashboard(
  overrides: Partial<InsightsDashboard> = {}
): InsightsDashboard {
  return {
    generatedAtDate: "2026-03-31",
    habitLeaderboard: [
      {
        category: "productivity",
        completionRate: 96,
        habitId: 1,
        name: "Morning Journal",
        rank: 1,
        trend: [80, 82, 84, 90],
      },
    ],
    isEmpty: false,
    momentum: {
      label: "Strong momentum",
      score: 82,
      sparkline: [64, 70, 72, 82],
    },
    period: {
      currentEnd: "2026-03-31",
      currentStart: "2026-01-01",
      label: "Last 90 days",
    },
    smartInsights: [
      {
        body: "Completion rate is +9% vs previous 90 days.",
        severity: "positive",
        title: "Consistency is improving.",
      },
    ],
    summary: {
      completed: {
        deltaLabel: "+12 vs previous period",
        label: "Completed",
        trend: [8, 10, 12, 14],
        value: "67",
      },
      focus: {
        deltaLabel: "+150 vs previous period",
        label: "Focus hours",
        trend: [1, 2, 3, 4],
        value: "14h",
      },
      perfectDays: {
        deltaLabel: "+8 vs previous period",
        label: "Perfect days",
        trend: [0, 1, 2, 3],
        value: "19",
      },
      savedStreaks: {
        deltaLabel: "+2 vs previous period",
        label: "Saved streaks",
        trend: [0, 0, 1, 1],
        value: "4",
      },
    },
    weekdayRhythmPlaceholder: {
      body: "Time-of-day rhythm needs per-habit completion timestamps.",
      title: "Weekday rhythm by time of day",
    },
    weeklyCompletion: [
      {
        completedPercent: 70,
        label: "Mar 23",
        missedPercent: 20,
        partialPercent: 10,
        weekEnd: "2026-03-29",
        weekStart: "2026-03-23",
      },
    ],
    ...overrides,
  };
}

describe("InsightsPage", () => {
  it("renders summary cards and dashboard widgets", () => {
    render(
      <InsightsPage
        dashboard={createDashboard()}
        error={null}
        phase="ready"
        onRetryLoad={vi.fn()}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Insights" })
    ).toBeInTheDocument();
    expect(screen.getByText("67")).toBeInTheDocument();
    expect(screen.getByText("Habit completion by week")).toBeInTheDocument();
    expect(screen.getByText("Morning Journal")).toBeInTheDocument();
    expect(screen.getByText("Consistency is improving.")).toBeInTheDocument();
  });

  it("renders the weekday rhythm placeholder", () => {
    render(
      <InsightsPage
        dashboard={createDashboard()}
        error={null}
        phase="ready"
        onRetryLoad={vi.fn()}
      />
    );

    expect(
      screen.getByText("Weekday rhythm by time of day")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Time-of-day rhythm needs per-habit completion timestamps."
      )
    ).toBeInTheDocument();
  });

  it("renders an empty state when no insights exist", () => {
    render(
      <InsightsPage
        dashboard={createDashboard({ isEmpty: true })}
        error={null}
        phase="ready"
        onRetryLoad={vi.fn()}
      />
    );

    expect(
      screen.getByRole("heading", { name: "No insights yet" })
    ).toBeInTheDocument();
  });
});
