import type { TodayState } from "@/shared/contracts/habits-ipc";
import type { HistoryDay } from "@/shared/domain/history";
import type { WeeklyReview } from "@/shared/domain/weekly-review";

function createTodayState(): TodayState {
  return {
    date: "2026-03-10",
    habits: [],
    settings: {
      launchAtLogin: false,
      minimizeToTray: false,
      reminderEnabled: true,
      reminderSnoozeMinutes: 15,
      reminderTime: "20:30",
      themeMode: "system",
      timezone: "Asia/Singapore",
    },
    streak: {
      availableFreezes: 1,
      bestStreak: 3,
      currentStreak: 2,
      lastEvaluatedDate: "2026-03-09",
    },
  };
}

function createHistoryDay(): HistoryDay {
  return {
    categoryProgress: [],
    date: "2026-03-10",
    habits: [],
    summary: {
      allCompleted: false,
      completedAt: null,
      date: "2026-03-10",
      freezeUsed: false,
      streakCountAfterDay: 2,
    },
  };
}

function createWeeklyReview(name: string): WeeklyReview {
  return {
    completedDays: 1,
    completionRate: 100,
    dailyCadence: [],
    endingStreak: 2,
    freezeDays: 0,
    habitMetrics: [
      {
        category: "productivity",
        completedOpportunities: 1,
        completionRate: 100,
        frequency: "daily",
        habitId: 1,
        missedOpportunities: 0,
        name,
        opportunities: 1,
        sortOrder: 0,
      },
    ],
    label: "Mar 2 - Mar 8",
    longestCleanRun: 1,
    missedDays: 0,
    mostMissedHabits: [],
    trackedDays: 1,
    weekEnd: "2026-03-08",
    weekStart: "2026-03-02",
  };
}

describe("useAppStore weekly review refresh", () => {
  async function setup() {
    vi.resetModules();
    vi.unstubAllGlobals();
    const getHistoryMock = vi.fn().mockResolvedValue([createHistoryDay()]);
    const getWeeklyReviewMock = vi.fn();
    const getWeeklyReviewOverviewMock = vi.fn();
    const renameHabitMock = vi.fn().mockResolvedValue(createTodayState());

    vi.stubGlobal("window", {
      habits: {
        getHistory: getHistoryMock,
        getWeeklyReview: getWeeklyReviewMock,
        getWeeklyReviewOverview: getWeeklyReviewOverviewMock,
        renameHabit: renameHabitMock,
      },
      matchMedia: vi.fn().mockReturnValue({
        addEventListener: vi.fn(),
        matches: false,
        removeEventListener: vi.fn(),
      }),
    });
    const { useAppStore } = await import("./store");

    return {
      getWeeklyReviewOverviewMock,
      useAppStore,
    };
  }

  it("reloads weekly review data after a habit rename when weekly reviews are already loaded", async () => {
    const freshWeeklyReview = createWeeklyReview("Make buried chapters video");
    const { getWeeklyReviewOverviewMock, useAppStore } = await setup();
    getWeeklyReviewOverviewMock.mockResolvedValue({
      availableWeeks: [
        {
          completionRate: freshWeeklyReview.completionRate,
          label: freshWeeklyReview.label,
          weekEnd: freshWeeklyReview.weekEnd,
          weekStart: freshWeeklyReview.weekStart,
        },
      ],
      latestReview: freshWeeklyReview,
      trend: [],
    });

    useAppStore.setState({
      selectedWeeklyReview: createWeeklyReview(
        "Make buried chapters videp hasbit"
      ),
      weeklyReviewPhase: "ready",
    });

    await useAppStore
      .getState()
      .handleRenameHabit(1, "Make buried chapters video");

    expect(getWeeklyReviewOverviewMock).toHaveBeenCalledWith();
    expect(
      useAppStore.getState().selectedWeeklyReview?.habitMetrics[0]?.name
    ).toBe("Make buried chapters video");
  });
});
