import type {
  HabitCommand,
  ResultForCommand,
} from "@/shared/contracts/habits-ipc-commands";
import type {
  HabitQuery,
  ResultForQuery,
} from "@/shared/contracts/habits-ipc-queries";
import type { DayStatusKind } from "@/shared/domain/day-status";
import type { CreateFocusSessionInput } from "@/shared/domain/focus-session";
import type { PersistedFocusTimerState } from "@/shared/domain/focus-timer";
import type { GoalFrequency } from "@/shared/domain/goal";
import type {
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
} from "@/shared/domain/habit";
import type { AppSettings } from "@/shared/domain/settings";

function command<C extends HabitCommand>(
  request: C
): Promise<ResultForCommand<C>> {
  return window.habits.command(request);
}

function query<Q extends HabitQuery>(request: Q): Promise<ResultForQuery<Q>> {
  return window.habits.query(request);
}

export const habitsClient = {
  archiveFocusQuotaGoal: (goalId: number) =>
    command({
      payload: { goalId },
      type: "focusQuotaGoal.archive",
    }),
  archiveHabit: (habitId: number) =>
    command({
      payload: { habitId },
      type: "habit.archive",
    }),
  createHabit: (
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency,
    selectedWeekdays?: HabitWeekday[] | null,
    targetCount?: number | null
  ) =>
    command({
      payload: { category, frequency, name, selectedWeekdays, targetCount },
      type: "habit.create",
    }),
  createWindDownAction: (name: string) =>
    command({
      payload: { name },
      type: "windDown.createAction",
    }),
  decrementHabitProgress: (habitId: number) =>
    command({
      payload: { habitId },
      type: "habit.decrementProgress",
    }),
  deleteWindDownAction: (actionId: number) =>
    command({
      payload: { actionId },
      type: "windDown.deleteAction",
    }),
  getFocusSessions: (limit?: number) =>
    query(
      limit === undefined
        ? { type: "focusSession.list" }
        : {
            payload: { limit },
            type: "focusSession.list",
          }
    ),
  getFocusTimerState: () =>
    query({
      type: "focusTimer.getState",
    }),
  getHabits: () =>
    query({
      type: "habit.list",
    }),
  getHistory: (limit?: number) =>
    query(
      limit === undefined
        ? { type: "history.get" }
        : {
            payload: { limit },
            type: "history.get",
          }
    ),
  getHistoryDay: (date: string) =>
    query({
      payload: { date },
      type: "history.getDay",
    }),
  getHistoryForYear: (year: number) =>
    query({
      payload: { year },
      type: "history.getYear",
    }),
  getHistorySummary: (limit?: number) =>
    query(
      limit === undefined
        ? { type: "history.summary" }
        : {
            payload: { limit },
            type: "history.summary",
          }
    ),
  getHistoryYears: () =>
    query({
      type: "history.years",
    }),
  getTodayState: () =>
    query({
      type: "today.get",
    }),
  getWeeklyReview: (weekStart: string) =>
    query({
      payload: { weekStart },
      type: "weeklyReview.get",
    }),
  getWeeklyReviewOverview: () =>
    query({
      type: "weeklyReview.overview",
    }),
  incrementHabitProgress: (habitId: number) =>
    command({
      payload: { habitId },
      type: "habit.incrementProgress",
    }),
  moveUnfinishedHabitsToTomorrow: () =>
    command({
      type: "today.moveUnfinishedToTomorrow",
    }),
  recordFocusSession: (input: CreateFocusSessionInput) =>
    command({
      payload: input,
      type: "focusSession.record",
    }),
  renameHabit: (habitId: number, name: string) =>
    command({
      payload: { habitId, name },
      type: "habit.rename",
    }),
  renameWindDownAction: (actionId: number, name: string) =>
    command({
      payload: { actionId, name },
      type: "windDown.renameAction",
    }),
  reorderHabits: (habitIds: number[]) =>
    command({
      payload: { habitIds },
      type: "habit.reorder",
    }),
  saveFocusTimerState: (state: PersistedFocusTimerState) =>
    command({
      payload: state,
      type: "focusTimer.saveState",
    }),
  setDayStatus: (kind: DayStatusKind | null) =>
    command({
      payload: { kind },
      type: "today.setDayStatus",
    }),
  toggleHabit: (habitId: number) =>
    command({
      payload: { habitId },
      type: "habit.toggle",
    }),
  toggleHabitCarryover: (sourceDate: string, habitId: number) =>
    command({
      payload: { habitId, sourceDate },
      type: "today.toggleCarryover",
    }),
  toggleSickDay: () =>
    command({
      type: "today.toggleSickDay",
    }),
  toggleWindDownAction: (actionId: number) =>
    command({
      payload: { actionId },
      type: "windDown.toggleAction",
    }),
  unarchiveFocusQuotaGoal: (goalId: number) =>
    command({
      payload: { goalId },
      type: "focusQuotaGoal.unarchive",
    }),
  unarchiveHabit: (habitId: number) =>
    command({
      payload: { habitId },
      type: "habit.unarchive",
    }),
  updateHabitCategory: (habitId: number, category: HabitCategory) =>
    command({
      payload: { category, habitId },
      type: "habit.updateCategory",
    }),
  updateHabitFrequency: (
    habitId: number,
    frequency: HabitFrequency,
    targetCount?: number | null
  ) =>
    command({
      payload: { frequency, habitId, targetCount },
      type: "habit.updateFrequency",
    }),
  updateHabitTargetCount: (habitId: number, targetCount: number) =>
    command({
      payload: { habitId, targetCount },
      type: "habit.updateTargetCount",
    }),
  updateHabitWeekdays: (
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null
  ) =>
    command({
      payload: { habitId, selectedWeekdays },
      type: "habit.updateWeekdays",
    }),
  updateSettings: (settings: AppSettings) =>
    command({
      payload: settings,
      type: "settings.update",
    }),
  upsertFocusQuotaGoal: (frequency: GoalFrequency, targetMinutes: number) =>
    command({
      payload: { frequency, targetMinutes },
      type: "focusQuotaGoal.upsert",
    }),
};
