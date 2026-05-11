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
      label: "Last 30 days",
    },
    smartInsights: [
      {
        body: "Completion rate is +9% vs previous 30 days.",
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
    weekdayRhythm: {
      cells: ["Morning", "Afternoon", "Evening", "Night"].flatMap((timeOfDay) =>
        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((weekday) => ({
          completionCount: timeOfDay === "Morning" && weekday === "Mon" ? 3 : 0,
          intensity: timeOfDay === "Morning" && weekday === "Mon" ? 100 : 0,
          label: `${weekday} ${timeOfDay}`,
          timeOfDay,
          weekday,
        }))
      ),
      hasData: true,
      maxCompletionCount: 3,
      subtitle: "Completion timing",
      timeOfDayLabels: [
        "Morning\n5am - 11am",
        "Afternoon\n11am - 5pm",
        "Evening\n5pm - 11pm",
        "Night\n11pm - 5am",
      ],
      title: "Weekday rhythm",
      weekdayLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
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

  it("renders the weekday rhythm chart", () => {
    render(
      <InsightsPage
        dashboard={createDashboard()}
        error={null}
        phase="ready"
        onRetryLoad={vi.fn()}
      />
    );

    expect(screen.getByText("Weekday rhythm")).toBeInTheDocument();
    expect(screen.getByText("Completion timing")).toBeInTheDocument();
    expect(screen.getByText("Peak: 3")).toBeInTheDocument();
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
