// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";

import type * as HistoryDayPanelModule from "@/renderer/features/history/components/history-day-panel";
import type * as HistoryDayDetailModule from "@/renderer/features/history/hooks/use-history-day-detail";
import type * as WeeklyReviewHeroCardModule from "@/renderer/features/history/weekly-review/components/weekly-review-hero-card";
import type * as TabsModule from "@/renderer/shared/components/ui/tabs";
import type { HistoryDay } from "@/shared/domain/history";
import type {
  WeeklyReview,
  WeeklyReviewOverview,
} from "@/shared/domain/weekly-review";
import { createFramerMotionMock } from "@/test/fixtures/framer-motion-mock";

import { HistoryPage } from "./history-page";

vi.mock(import("framer-motion"), (importOriginal) =>
  createFramerMotionMock(importOriginal)
);

vi.mock<typeof TabsModule>(
  import("@/renderer/shared/components/ui/tabs"),
  async (importOriginal) => {
    const [actual, react] = await Promise.all([
      importOriginal(),
      import("react"),
    ]);
    const { createContext, useContext, useMemo } = react;
    const TabsContext = createContext<{
      onValueChange?: ((value: string) => void) | undefined;
      value?: string | undefined;
    }>({});

    return {
      ...actual,
      Tabs: ({
        children,
        defaultValue,
        onValueChange,
        value,
      }: ComponentProps<typeof actual.Tabs>) => {
        const contextValue = useMemo(
          () => ({ onValueChange, value: value ?? defaultValue }),
          [defaultValue, onValueChange, value]
        );

        return (
          <TabsContext.Provider value={contextValue}>
            <div>{children}</div>
          </TabsContext.Provider>
        );
      },
      TabsContent: ({
        children,
        value,
      }: ComponentProps<typeof actual.TabsContent>) => {
        const tabs = useContext(TabsContext);

        return tabs.value === value ? <div>{children}</div> : <span hidden />;
      },
      TabsList: ({ children }: ComponentProps<typeof actual.TabsList>) => (
        <div>{children}</div>
      ),
      TabsTrigger: ({
        children,
        value,
      }: ComponentProps<typeof actual.TabsTrigger>) => {
        const tabs = useContext(TabsContext);

        return (
          <button
            onClick={() => tabs.onValueChange?.(String(value))}
            type="button"
          >
            {children}
          </button>
        );
      },
    };
  }
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

vi.mock<typeof HistoryDayDetailModule>(
  import("@/renderer/features/history/hooks/use-history-day-detail"),
  () => ({
    useHistoryDayDetail: (selectedDate, history) => ({
      isLoading: false,
      selectedDay:
        (selectedDate
          ? ({
              ...history.find((day) => day.date === selectedDate),
              habits: [],
            } as HistoryDay)
          : null) ?? null,
    }),
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

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockReturnValue({
      addEventListener: vi.fn(),
      matches: false,
      removeEventListener: vi.fn(),
    }),
  });
});

function createHistoryDay(
  date: string,
  summary: Partial<HistoryDay["summary"]> = {}
): HistoryDay {
  const { dayStatus = null, ...restSummary } = summary;

  return {
    categoryProgress: [],
    date,
    focusMinutes: 0,
    habits: [
      {
        category: "productivity",
        completed: summary.allCompleted ?? false,
        createdAt: date,
        frequency: "daily",
        id: 1,
        isArchived: false,
        name: "Read",
        sortOrder: 0,
      },
    ],
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
    rescheduledDays: 0,
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
      contributionHistory={[createHistoryDay("2026-03-10")]}
      history={[createHistoryDay("2026-03-10")]}
      historyLoadError={null}
      historyYears={[2026]}
      onLoadHistoryYears={vi.fn()}
      onLoadWeeklyReviewOverview={vi.fn()}
      onNavigateToToday={vi.fn()}
      onSelectHistoryMonth={vi.fn()}
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
  it("shows the selected year timeline", () => {
    const history = [
      createHistoryDay("2026-03-10", { allCompleted: true }),
      createHistoryDay("2026-03-09"),
      createHistoryDay("2026-03-08", { freezeUsed: true }),
    ];

    renderHistoryPage({ history });

    expect(
      screen.getByRole("heading", { name: "History" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "2026" })
    ).not.toBeInTheDocument();
    expect(screen.getByText("3 tracked days")).toBeInTheDocument();
    expect(screen.getByText("Day")).toBeInTheDocument();
    expect(screen.getByText("Complete")).toBeInTheDocument();
    expect(screen.getByText("Misses")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Today Mar 10/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Select Tuesday, Mar 10, 2026/ })
    ).toBeInTheDocument();
  });

  it("uses explicit day status labels in the timeline", () => {
    renderHistoryPage({
      history: [
        createHistoryDay("2026-03-10", { allCompleted: true }),
        createHistoryDay("2026-03-09", { dayStatus: "sick" }),
        createHistoryDay("2026-03-08", { dayStatus: "rest" }),
      ],
    });

    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Sick")).toBeInTheDocument();
    expect(screen.getByText("Rest")).toBeInTheDocument();
  });

  it("only shows the contribution graph in timeline mode", () => {
    renderHistoryPage();

    expect(
      screen.getByRole("button", { name: /Select Tuesday, Mar 10, 2026/ })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Review" }));

    expect(
      screen.queryByRole("button", { name: /Select Tuesday, Mar 10, 2026/ })
    ).not.toBeInTheDocument();
  });

  it("moves the timeline list between months without filtering the contribution graph", () => {
    renderHistoryPage({
      history: [
        createHistoryDay("2026-03-10", { allCompleted: true }),
        createHistoryDay("2026-02-14", { allCompleted: true }),
      ],
    });

    expect(
      screen.getByRole("heading", { name: "March 2026" })
    ).toBeInTheDocument();
    expect(screen.getByText("March")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Today Mar 10/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Select Tuesday, Mar 10, 2026/ })
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Show previous month" })
    );

    expect(
      screen.getByRole("heading", { name: "February 2026" })
    ).toBeInTheDocument();
    expect(screen.getByText("February")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Sat Feb 14/ })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Today Mar 10/ })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Select Saturday, Feb 14, 2026/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Select Tuesday, Mar 10, 2026/ })
    ).toBeInTheDocument();
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

    fireEvent.click(screen.getByRole("button", { name: /Mon Mar 9/ }));
    expect(screen.getByText("Mar 9")).toBeInTheDocument();
    const [latestHistoryDay] = history;

    if (!latestHistoryDay) {
      throw new Error("Expected history test data to include a latest day.");
    }

    rerender(
      <HistoryPage
        contributionHistory={[latestHistoryDay]}
        history={[latestHistoryDay]}
        historyLoadError={null}
        historyYears={[2026]}
        onLoadHistoryYears={vi.fn()}
        onLoadWeeklyReviewOverview={vi.fn()}
        onNavigateToToday={vi.fn()}
        onSelectHistoryMonth={vi.fn()}
        onSelectWeeklyReview={onSelectWeeklyReview}
        selectedHistoryYear={2026}
        selectedWeeklyReview={null}
        todayDate="2026-03-10"
        weeklyReviewError={null}
        weeklyReviewOverview={null}
        weeklyReviewPhase="idle"
      />
    );

    expect(screen.getByText("Mar 10")).toBeInTheDocument();
  });

  it("shows the weekly review loading state before a review is available", () => {
    renderHistoryPage({ weeklyReviewPhase: "loading" });

    fireEvent.click(screen.getByRole("button", { name: "Review" }));

    expect(screen.getByText("Building weekly review...")).toBeInTheDocument();
  });

  it("renders the latest weekly review and any non-blocking weekly review error", () => {
    renderHistoryPage({
      weeklyReviewError: new Error("Weekly review is stale") as never,
      weeklyReviewOverview: createWeeklyReviewOverview(),
      weeklyReviewPhase: "ready",
    });

    fireEvent.click(screen.getByRole("button", { name: "Review" }));

    expect(screen.getByText("Weekly review is stale")).toBeInTheDocument();
    expect(screen.getByTestId("weekly-review-hero")).toHaveTextContent(
      "2026-03-02"
    );
  });

  it("loads available history years on mount", () => {
    const onLoadHistoryYears = vi.fn();

    renderHistoryPage({ onLoadHistoryYears });

    expect(onLoadHistoryYears.mock.calls).toHaveLength(1);
    expect(screen.getByRole("button", { name: /^2026$/ })).toBeInTheDocument();
  });

  it("loads weekly review data only after switching to review mode", () => {
    const onLoadWeeklyReviewOverview = vi.fn();

    renderHistoryPage({ onLoadWeeklyReviewOverview });

    expect(onLoadWeeklyReviewOverview).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Review" }));

    expect(onLoadWeeklyReviewOverview).toHaveBeenCalledTimes(1);
  });

  it("requests the selected month when the year changes", () => {
    const onSelectHistoryMonth = vi.fn();

    renderHistoryPage({
      history: [createHistoryDay("2026-03-10", { allCompleted: true })],
      historyYears: [2026, 2025],
      onSelectHistoryMonth,
    });

    fireEvent.pointerDown(screen.getByRole("button", { name: /^2026$/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: "2025" }));

    expect(onSelectHistoryMonth).toHaveBeenCalledWith(2025, 3);
  });
});
