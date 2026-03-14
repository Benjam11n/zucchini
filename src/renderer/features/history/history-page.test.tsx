// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import type * as FramerMotion from "framer-motion";
import { createElement, forwardRef } from "react";
import type { ComponentProps } from "react";

import type * as HistoryCalendarCardModule from "@/renderer/features/history/components/history-calendar-card";
import type * as HistoryDayPanelModule from "@/renderer/features/history/components/history-day-panel";
import type * as WeeklyReviewDailyCadenceChartModule from "@/renderer/features/history/weekly-review/components/weekly-review-daily-cadence-chart";
import type * as WeeklyReviewHabitChartModule from "@/renderer/features/history/weekly-review/components/weekly-review-habit-chart";
import type * as WeeklyReviewHeroCardModule from "@/renderer/features/history/weekly-review/components/weekly-review-hero-card";
import type * as WeeklyReviewMostMissedCardModule from "@/renderer/features/history/weekly-review/components/weekly-review-most-missed-card";
import type * as WeeklyReviewStatsModule from "@/renderer/features/history/weekly-review/components/weekly-review-stats";
import type * as WeeklyReviewTrendChartModule from "@/renderer/features/history/weekly-review/components/weekly-review-trend-chart";
import type * as GitHubCalendarModule from "@/renderer/shared/components/github-calendar";
import type * as TabsModule from "@/renderer/shared/ui/tabs";
import type { HistoryDay } from "@/shared/domain/history";
import type {
  WeeklyReview,
  WeeklyReviewOverview,
} from "@/shared/domain/weekly-review";

import { HistoryPage } from "./history-page";

vi.mock<typeof FramerMotion>(
  import("framer-motion"),
  async (importOriginal) => {
    const actual = await importOriginal();

    function createMotionProxy() {
      return new Proxy(
        {},
        {
          get: (_, tag: string) =>
            forwardRef<HTMLElement, Record<string, unknown>>(
              function MotionMock(props, ref) {
                const {
                  animate: _animate,
                  exit: _exit,
                  initial: _initial,
                  layout: _layout,
                  transition: _transition,
                  variants: _variants,
                  whileHover: _whileHover,
                  whileTap: _whileTap,
                  ...rest
                } = props;

                return createElement(tag, { ...rest, ref });
              }
            ),
        }
      );
    }

    return {
      ...actual,
      LazyMotion: ({ children }: ComponentProps<typeof actual.LazyMotion>) => (
        <div>{children}</div>
      ),
      m: createMotionProxy() as typeof actual.m,
    };
  }
);

vi.mock<typeof TabsModule>(
  import("@/renderer/shared/ui/tabs"),
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
    GitHubCalendar: ({ weeks }: { weeks: unknown[] }) => (
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
      selectedDay: HistoryDay | null;
    }) => (
      <div data-testid="day-panel">
        {selectedDay?.date ?? "none"}:{String(Boolean(isToday))}
      </div>
    ),
  })
);

vi.mock<typeof WeeklyReviewDailyCadenceChartModule>(
  import("@/renderer/features/history/weekly-review/components/weekly-review-daily-cadence-chart"),
  () => ({
    WeeklyReviewDailyCadenceChart: () => <div>daily cadence chart</div>,
  })
);

vi.mock<typeof WeeklyReviewHabitChartModule>(
  import("@/renderer/features/history/weekly-review/components/weekly-review-habit-chart"),
  () => ({
    WeeklyReviewHabitChart: () => <div>habit chart</div>,
  })
);

vi.mock<typeof WeeklyReviewHeroCardModule>(
  import("@/renderer/features/history/weekly-review/components/weekly-review-hero-card"),
  () => ({
    WeeklyReviewHeroCard: ({ review }: { review: WeeklyReview }) => (
      <div data-testid="weekly-review-hero">{review.weekStart}</div>
    ),
  })
);

vi.mock<typeof WeeklyReviewMostMissedCardModule>(
  import("@/renderer/features/history/weekly-review/components/weekly-review-most-missed-card"),
  () => ({
    WeeklyReviewMostMissedCard: () => <div>most missed card</div>,
  })
);

vi.mock<typeof WeeklyReviewStatsModule>(
  import("@/renderer/features/history/weekly-review/components/weekly-review-stats"),
  () => ({
    WeeklyReviewStats: () => <div>weekly stats</div>,
  })
);

vi.mock<typeof WeeklyReviewTrendChartModule>(
  import("@/renderer/features/history/weekly-review/components/weekly-review-trend-chart"),
  () => ({
    WeeklyReviewTrendChart: () => <div>trend chart</div>,
  })
);

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

function createWeeklyReview(): WeeklyReview {
  return {
    completedDays: 4,
    completionRate: 57,
    dailyCadence: [],
    endingStreak: 6,
    freezeDays: 1,
    habitMetrics: [],
    label: "Mar 2 - Mar 8",
    longestCleanRun: 3,
    missedDays: 2,
    mostMissedHabits: [],
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

describe("history page", () => {
  it("shows summary badges for completion, freeze, and missed history", () => {
    const history = [
      createHistoryDay("2026-03-10", { allCompleted: true }),
      createHistoryDay("2026-03-09"),
      createHistoryDay("2026-03-08", { freezeUsed: true }),
    ];

    render(
      <HistoryPage
        history={history}
        historyLoadError={null}
        historyScope="recent"
        isHistoryLoading={false}
        onLoadOlderHistory={vi.fn()}
        onSelectWeeklyReview={vi.fn()}
        selectedWeeklyReview={null}
        todayDate="2026-03-10"
        weeklyReviewError={null}
        weeklyReviewOverview={null}
        weeklyReviewPhase="idle"
      />
    );

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

    const { rerender } = render(
      <HistoryPage
        history={history}
        historyLoadError={null}
        historyScope="recent"
        isHistoryLoading={false}
        onLoadOlderHistory={vi.fn()}
        onSelectWeeklyReview={onSelectWeeklyReview}
        selectedWeeklyReview={null}
        todayDate="2026-03-10"
        weeklyReviewError={null}
        weeklyReviewOverview={null}
        weeklyReviewPhase="idle"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Select 2026-03-09" }));
    expect(screen.getByTestId("day-panel")).toHaveTextContent(
      "2026-03-09:false"
    );

    rerender(
      <HistoryPage
        history={[history[0]!]}
        historyLoadError={null}
        historyScope="recent"
        isHistoryLoading={false}
        onLoadOlderHistory={vi.fn()}
        onSelectWeeklyReview={onSelectWeeklyReview}
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
    render(
      <HistoryPage
        history={[createHistoryDay("2026-03-10")]}
        historyLoadError={null}
        historyScope="recent"
        isHistoryLoading={false}
        onLoadOlderHistory={vi.fn()}
        onSelectWeeklyReview={vi.fn()}
        selectedWeeklyReview={null}
        todayDate="2026-03-10"
        weeklyReviewError={null}
        weeklyReviewOverview={null}
        weeklyReviewPhase="loading"
      />
    );

    expect(screen.getByText("Building weekly review...")).toBeInTheDocument();
  });

  it("renders the latest weekly review and any non-blocking weekly review error", () => {
    render(
      <HistoryPage
        history={[createHistoryDay("2026-03-10")]}
        historyLoadError={null}
        historyScope="recent"
        isHistoryLoading={false}
        onLoadOlderHistory={vi.fn()}
        onSelectWeeklyReview={vi.fn()}
        selectedWeeklyReview={null}
        todayDate="2026-03-10"
        weeklyReviewError={new Error("Weekly review is stale") as never}
        weeklyReviewOverview={createWeeklyReviewOverview()}
        weeklyReviewPhase="ready"
      />
    );

    expect(screen.getByText("Weekly review is stale")).toBeInTheDocument();
    expect(screen.getByTestId("weekly-review-hero")).toHaveTextContent(
      "2026-03-02"
    );
  });

  it("shows an explicit load older history action for the current-year view", () => {
    const onLoadOlderHistory = vi.fn();

    render(
      <HistoryPage
        history={[createHistoryDay("2026-03-10")]}
        historyLoadError={null}
        historyScope="recent"
        isHistoryLoading={false}
        onLoadOlderHistory={onLoadOlderHistory}
        onSelectWeeklyReview={vi.fn()}
        selectedWeeklyReview={null}
        todayDate="2026-03-10"
        weeklyReviewError={null}
        weeklyReviewOverview={null}
        weeklyReviewPhase="idle"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Load older history" }));

    // oxlint-disable-next-line vitest/prefer-called-times
    expect(onLoadOlderHistory).toHaveBeenCalledOnce();
    expect(
      screen.getByRole("combobox", { name: "Select history year" })
    ).toBeInTheDocument();
  });

  it("filters the calendar and selected day when the year changes", () => {
    render(
      <HistoryPage
        history={[
          createHistoryDay("2026-03-10", { allCompleted: true }),
          createHistoryDay("2025-12-31", { freezeUsed: true }),
        ]}
        historyLoadError={null}
        historyScope="full"
        isHistoryLoading={false}
        onLoadOlderHistory={vi.fn()}
        onSelectWeeklyReview={vi.fn()}
        selectedWeeklyReview={null}
        todayDate="2026-03-10"
        weeklyReviewError={null}
        weeklyReviewOverview={null}
        weeklyReviewPhase="idle"
      />
    );

    fireEvent.change(
      screen.getByRole("combobox", { name: "Select history year" }),
      {
        target: { value: "2025" },
      }
    );

    expect(screen.getByTestId("day-panel")).toHaveTextContent(
      "2025-12-31:false"
    );
    expect(
      screen.getByRole("button", { name: "Select 2025-12-31" })
    ).toBeInTheDocument();
  });
});
