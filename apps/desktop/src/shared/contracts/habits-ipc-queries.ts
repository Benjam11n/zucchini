import type { FocusSession } from "@/shared/domain/focus-session";
import type { PersistedFocusTimerState } from "@/shared/domain/focus-timer";
import type { Habit } from "@/shared/domain/habit";
import type { HistoryDay, HistorySummaryDay } from "@/shared/domain/history";
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
      payload?: { limit?: number | undefined } | undefined;
      type: "history.get";
    }
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
  | PersistedFocusTimerState
  | TodayState
  | WeeklyReview
  | WeeklyReviewOverview
  | null;

interface HabitQueryResultByType {
  "focusSession.list": FocusSession[];
  "focusTimer.getState": PersistedFocusTimerState | null;
  "habit.list": Habit[];
  "history.get": HistoryDay[];
  "history.getDay": HistoryDay;
  "history.summary": HistorySummaryDay[];
  "today.get": TodayState;
  "weeklyReview.get": WeeklyReview;
  "weeklyReview.overview": WeeklyReviewOverview;
}

export type ResultForQuery<Q extends HabitQuery> =
  HabitQueryResultByType[Q["type"]];
