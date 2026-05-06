// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";

import type * as HistoryCalendarCardModule from "@/renderer/features/history/components/history-calendar-card";
import type * as HistoryDayPanelModule from "@/renderer/features/history/components/history-day-panel";
import type * as WeeklyReviewHeroCardModule from "@/renderer/features/history/weekly-review/components/weekly-review-hero-card";
import type * as GitHubCalendarModule from "@/renderer/shared/components/github-calendar";
import type * as TabsModule from "@/renderer/shared/components/ui/tabs";
import type { HistoryDay } from "@/shared/domain/history";
import type {
  WeeklyReview,
  WeeklyReviewOverview,
} from "@/shared/domain/weekly-review";
import { createFramerMotionMock } from "@/test/fixtures/framer-motion-mock";

import { HistoryPage } from "./history-page";

interface GitHubCalendarWeek {
  cells: {
    date: string;
  }[];
  key: string;
}

vi.mock(import("framer-motion"), (importOriginal) =>
  createFramerMotionMock(importOriginal)
);

vi.mock<typeof TabsModule>(
  import("@/renderer/shared/components/ui/tabs"),
  async (importOriginal) => {
    const actual = await importOriginal();

    return {
      ...actual,
      Tabs: ({ children }: ComponentProps<typeof actual.Tabs>) => (
        <div>{children}</div>
      ),
      TabsContent: ({
        children,
      }: ComponentProps<typeof actual.TabsContent>) => <div>{children}</div>,
      TabsList: ({ children }: ComponentProps<typeof actual.TabsList>) => (
        <div>{children}</div>
      ),
      TabsTrigger: ({
        children,
      }: ComponentProps<typeof actual.TabsTrigger>) => (
        <button type="button">{children}</button>
      ),
    };
  }
);

vi.mock<typeof GitHubCalendarModule>(
  import("@/renderer/shared/components/github-calendar"),
  () => ({
    GitHubCalendar: ({ weeks }: { weeks: GitHubCalendarWeek[] }) => (
      <div data-testid="github-calendar">{weeks.length}</div>
    ),
  })
);

vi.mock<typeof HistoryCalendarCardModule>(
  import("@/renderer/features/history/components/history-calendar-card"),
  () => ({
    HistoryCalendarCard: ({
      historyByDate,
      onSelectDateKey,
      selectedDay,
    }: {
      historyByDate: Map<string, HistoryDay>;
      onSelectDateKey: (dateKey: string) => void;
      selectedDay: HistoryDay | null;
    }) => (
      <div>
        <p data-testid="calendar-selected">{selectedDay?.date ?? "none"}</p>
        {[...historyByDate.keys()].map((dateKey) => (
          <button
            key={dateKey}
            onClick={() => onSelectDateKey(dateKey)}
            type="button"
          >
            Select {dateKey}
          </button>
        ))}
      </div>
    ),
  })
);

vi.mock<typeof HistoryDayPanelModule>(
  import("@/renderer/features/history/components/history-day-panel"),
  () => ({
    HistoryDayPanel: ({
      isToday,
      selectedDay,
    }: {
      isToday?: boolean;
      onNavigateToToday: () => void;
      selectedDay: HistoryDay | null;
    }) => (
      <div data-testid="day-panel">
        {selectedDay?.date ?? "none"}:{String(Boolean(isToday))}
      </div>
    ),
  })
);

vi.mock(
  import("@/renderer/features/history/weekly-review/components/weekly-review-daily-cadence-chart"),
  () => ({
    WeeklyReviewDailyCadenceChart: () => <div>daily cadence chart</div>,
  })
);
vi.mock(
  import("@/renderer/features/history/weekly-review/components/weekly-review-habit-chart"),
  () => ({ WeeklyReviewHabitChart: () => <div>habit chart</div> })
);
vi.mock(
  import("@/renderer/features/history/weekly-review/components/weekly-review-most-missed-card"),
  () => ({ WeeklyReviewMostMissedCard: () => <div>most missed card</div> })
);
vi.mock(
  import("@/renderer/features/history/weekly-review/components/weekly-review-trend-chart"),
  () => ({ WeeklyReviewTrendChart: () => <div>trend chart</div> })
);

vi.mock<typeof WeeklyReviewHeroCardModule>(
  import("@/renderer/features/history/weekly-review/components/weekly-review-hero-card"),
  () => ({
    WeeklyReviewHeroCard: ({ review }: { review: WeeklyReview }) => (
      <div data-testid="weekly-review-hero">{review.weekStart}</div>
    ),
  })
);

function createHistoryDay(
  date: string,
  summary: Partial<HistoryDay["summary"]> = {}
): HistoryDay {
  const { dayStatus = null, ...restSummary } = summary;

  return {
    categoryProgress: [],
    date,
    focusMinutes: 0,
    habits: [],
    summary: {
      allCompleted: false,
      completedAt: null,
      date,
      dayStatus,
      freezeUsed: false,
      streakCountAfterDay: 0,
      ...restSummary,
    },
  };
}

function createWeeklyReview(): WeeklyReview {
  return {
    completedDays: 4,
    completionRate: 57,
    dailyCadence: [],
    endingStreak: 6,
    focusMinutes: 0,
    freezeDays: 1,
    habitMetrics: [],
    label: "Mar 2 - Mar 8",
    longestCleanRun: 3,
    missedDays: 2,
    mostMissedHabits: [],
    restDays: 0,
    sickDays: 0,
    trackedDays: 7,
    weekEnd: "2026-03-08",
    weekStart: "2026-03-02",
  };
}

function createWeeklyReviewOverview(): WeeklyReviewOverview {
  const latestReview = createWeeklyReview();

  return {
    availableWeeks: [
      {
        completionRate: latestReview.completionRate,
        label: latestReview.label,
        weekEnd: latestReview.weekEnd,
        weekStart: latestReview.weekStart,
      },
    ],
    latestReview,
    trend: [],
  };
}

function renderHistoryPage(
  props: Partial<ComponentProps<typeof HistoryPage>> = {}
) {
  return render(
    <HistoryPage
      history={[createHistoryDay("2026-03-10")]}
      historyLoadError={null}
      historyYears={[2026]}
      isHistoryLoading={false}
      onLoadHistoryYears={vi.fn()}
      onNavigateToToday={vi.fn()}
      onSelectHistoryYear={vi.fn()}
      onSelectWeeklyReview={vi.fn()}
      selectedHistoryYear={2026}
      selectedWeeklyReview={null}
      todayDate="2026-03-10"
      weeklyReviewError={null}
      weeklyReviewOverview={null}
      weeklyReviewPhase="idle"
      {...props}
    />
  );
}

describe("history page", () => {
  it("shows summary badges for completion, freeze, and missed history", () => {
    const history = [
      createHistoryDay("2026-03-10", { allCompleted: true }),
      createHistoryDay("2026-03-09"),
      createHistoryDay("2026-03-08", { freezeUsed: true }),
    ];

    renderHistoryPage({ history });

    expect(screen.getByText("33% completion")).toBeInTheDocument();
    expect(screen.getByText("1 complete")).toBeInTheDocument();
    expect(screen.getByText("1 freeze saves")).toBeInTheDocument();
    expect(screen.getByText("1 missed")).toBeInTheDocument();
  });

  it("falls back to the first available history day when the selected day disappears", () => {
    const history = [
      createHistoryDay("2026-03-10", { allCompleted: true }),
      createHistoryDay("2026-03-09"),
      createHistoryDay("2026-03-08", { freezeUsed: true }),
    ];
    const onSelectWeeklyReview = vi.fn();

    const { rerender } = renderHistoryPage({
      history,
      onSelectWeeklyReview,
    });

    fireEvent.click(screen.getByRole("button", { name: "Select 2026-03-09" }));
    expect(screen.getByTestId("day-panel")).toHaveTextContent(
      "2026-03-09:false"
    );
    const [latestHistoryDay] = history;

    if (!latestHistoryDay) {
      throw new Error("Expected history test data to include a latest day.");
    }

    rerender(
      <HistoryPage
        history={[latestHistoryDay]}
        historyLoadError={null}
        historyYears={[2026]}
        isHistoryLoading={false}
        onLoadHistoryYears={vi.fn()}
        onNavigateToToday={vi.fn()}
        onSelectHistoryYear={vi.fn()}
        onSelectWeeklyReview={onSelectWeeklyReview}
        selectedHistoryYear={2026}
        selectedWeeklyReview={null}
        todayDate="2026-03-10"
        weeklyReviewError={null}
        weeklyReviewOverview={null}
        weeklyReviewPhase="idle"
      />
    );

    expect(screen.getByTestId("day-panel")).toHaveTextContent(
      "2026-03-10:true"
    );
  });

  it("shows the weekly review loading state before a review is available", () => {
    renderHistoryPage({ weeklyReviewPhase: "loading" });

    expect(screen.getByText("Building weekly review...")).toBeInTheDocument();
  });

  it("renders the latest weekly review and any non-blocking weekly review error", () => {
    renderHistoryPage({
      weeklyReviewError: new Error("Weekly review is stale") as never,
      weeklyReviewOverview: createWeeklyReviewOverview(),
      weeklyReviewPhase: "ready",
    });

    expect(screen.getByText("Weekly review is stale")).toBeInTheDocument();
    expect(screen.getByTestId("weekly-review-hero")).toHaveTextContent(
      "2026-03-02"
    );
  });

  it("loads available history years on mount", () => {
    const onLoadHistoryYears = vi.fn();

    renderHistoryPage({ onLoadHistoryYears });

    expect(onLoadHistoryYears.mock.calls).toHaveLength(1);
    expect(
      screen.getByRole("combobox", { name: "Select history year" })
    ).toBeInTheDocument();
  });

  it("requests the selected year when the year changes", () => {
    const onSelectHistoryYear = vi.fn();

    renderHistoryPage({
      history: [createHistoryDay("2026-03-10", { allCompleted: true })],
      historyYears: [2026, 2025],
      onSelectHistoryYear,
    });

    fireEvent.change(
      screen.getByRole("combobox", { name: "Select history year" }),
      {
        target: { value: "2025" },
      }
    );

    expect(onSelectHistoryYear).toHaveBeenCalledWith(2025);
  });
});
