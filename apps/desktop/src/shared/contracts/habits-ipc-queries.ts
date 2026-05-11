import type { FocusSession } from "@/shared/domain/focus-session";
import type { PersistedFocusTimerState } from "@/shared/domain/focus-timer";
import type { Habit } from "@/shared/domain/habit";
import type { HistoryDay, HistorySummaryDay } from "@/shared/domain/history";
import type {
  InsightsDashboard,
  InsightsRangeDays,
} from "@/shared/domain/insights";
import type {
  WeeklyReview,
  WeeklyReviewOverview,
} from "@/shared/domain/weekly-review";

import type { TodayState } from "./today-state";

export type HabitQuery =
  | {
      payload?: { limit?: number | undefined } | undefined;
      type: "focusSession.list";
    }
  | { type: "focusTimer.getState" }
  | { type: "habit.list" }
  | {
      payload?: { rangeDays?: InsightsRangeDays | undefined } | undefined;
      type: "insights.dashboard";
    }
  | {
      payload?: { limit?: number | undefined } | undefined;
      type: "history.get";
    }
  | {
      payload: { year: number };
      type: "history.getYear";
    }
  | {
      payload: { year: number };
      type: "history.summaryYear";
    }
  | {
      payload: { month: number; year: number };
      type: "history.summaryMonth";
    }
  | { type: "history.years" }
  | {
      payload: { date: string };
      type: "history.getDay";
    }
  | {
      payload?: { limit?: number | undefined } | undefined;
      type: "history.summary";
    }
  | { type: "today.get" }
  | { payload: { weekStart: string }; type: "weeklyReview.get" }
  | { type: "weeklyReview.overview" };

export type HabitQueryResult =
  | FocusSession[]
  | Habit[]
  | HistoryDay[]
  | HistoryDay
  | HistorySummaryDay[]
  | InsightsDashboard
  | number[]
  | PersistedFocusTimerState
  | TodayState
  | WeeklyReview
  | WeeklyReviewOverview
  | null;

interface HabitQueryResultByType {
  "focusSession.list": FocusSession[];
  "focusTimer.getState": PersistedFocusTimerState | null;
  "habit.list": Habit[];
  "insights.dashboard": InsightsDashboard;
  "history.get": HistoryDay[];
  "history.getYear": HistoryDay[];
  "history.getDay": HistoryDay;
  "history.summary": HistorySummaryDay[];
  "history.summaryMonth": HistorySummaryDay[];
  "history.summaryYear": HistorySummaryDay[];
  "history.years": number[];
  "today.get": TodayState;
  "weeklyReview.get": WeeklyReview;
  "weeklyReview.overview": WeeklyReviewOverview;
}

export type ResultForQuery<Q extends HabitQuery> =
  HabitQueryResultByType[Q["type"]];
