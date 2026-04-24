import type {
  HabitCommand,
  HabitQuery,
  TodayState,
} from "@/shared/contracts/habits-ipc";
import type {
  CreateFocusSessionInput,
  FocusSession,
} from "@/shared/domain/focus-session";
import type { PersistedFocusTimerState } from "@/shared/domain/focus-timer";
import type { GoalFrequency } from "@/shared/domain/goal";
import type {
  Habit,
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
} from "@/shared/domain/habit";
import type { HistoryDay } from "@/shared/domain/history";
import type { AppSettings } from "@/shared/domain/settings";
import type {
  WeeklyReview,
  WeeklyReviewOverview,
} from "@/shared/domain/weekly-review";

async function command<T>(request: HabitCommand): Promise<T> {
  return (await window.habits.command(request)) as T;
}

async function query<T>(request: HabitQuery): Promise<T> {
  return (await window.habits.query(request)) as T;
}

export const habitsClient = {
  archiveFocusQuotaGoal: (goalId: number) =>
    command<TodayState>({
      payload: { goalId },
      type: "focusQuotaGoal.archive",
    }),
  archiveHabit: (habitId: number) =>
    command<TodayState>({
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
    command<TodayState>({
      payload: { category, frequency, name, selectedWeekdays, targetCount },
      type: "habit.create",
    }),
  createWindDownAction: (name: string) =>
    command<TodayState>({
      payload: { name },
      type: "windDown.createAction",
    }),
  decrementHabitProgress: (habitId: number) =>
    command<TodayState>({
      payload: { habitId },
      type: "habit.decrementProgress",
    }),
  deleteWindDownAction: (actionId: number) =>
    command<TodayState>({
      payload: { actionId },
      type: "windDown.deleteAction",
    }),
  getFocusSessions: (limit?: number) =>
    query<FocusSession[]>(
      limit === undefined
        ? { type: "focusSession.list" }
        : {
            payload: { limit },
            type: "focusSession.list",
          }
    ),
  getFocusTimerState: () =>
    query<PersistedFocusTimerState | null>({
      type: "focusTimer.getState",
    }),
  getHabits: () =>
    query<Habit[]>({
      type: "habit.list",
    }),
  getHistory: (limit?: number) =>
    query<HistoryDay[]>(
      limit === undefined
        ? { type: "history.get" }
        : {
            payload: { limit },
            type: "history.get",
          }
    ),
  getTodayState: () =>
    query<TodayState>({
      type: "today.get",
    }),
  getWeeklyReview: (weekStart: string) =>
    query<WeeklyReview>({
      payload: { weekStart },
      type: "weeklyReview.get",
    }),
  getWeeklyReviewOverview: () =>
    query<WeeklyReviewOverview>({
      type: "weeklyReview.overview",
    }),
  incrementHabitProgress: (habitId: number) =>
    command<TodayState>({
      payload: { habitId },
      type: "habit.incrementProgress",
    }),
  recordFocusSession: (input: CreateFocusSessionInput) =>
    command<FocusSession>({
      payload: input,
      type: "focusSession.record",
    }),
  renameHabit: (habitId: number, name: string) =>
    command<TodayState>({
      payload: { habitId, name },
      type: "habit.rename",
    }),
  renameWindDownAction: (actionId: number, name: string) =>
    command<TodayState>({
      payload: { actionId, name },
      type: "windDown.renameAction",
    }),
  reorderHabits: (habitIds: number[]) =>
    command<TodayState>({
      payload: { habitIds },
      type: "habit.reorder",
    }),
  saveFocusTimerState: (state: PersistedFocusTimerState) =>
    command<PersistedFocusTimerState>({
      payload: state,
      type: "focusTimer.saveState",
    }),
  toggleHabit: (habitId: number) =>
    command<TodayState>({
      payload: { habitId },
      type: "habit.toggle",
    }),
  toggleSickDay: () =>
    command<TodayState>({
      type: "today.toggleSickDay",
    }),
  toggleWindDownAction: (actionId: number) =>
    command<TodayState>({
      payload: { actionId },
      type: "windDown.toggleAction",
    }),
  unarchiveFocusQuotaGoal: (goalId: number) =>
    command<TodayState>({
      payload: { goalId },
      type: "focusQuotaGoal.unarchive",
    }),
  unarchiveHabit: (habitId: number) =>
    command<TodayState>({
      payload: { habitId },
      type: "habit.unarchive",
    }),
  updateHabitCategory: (habitId: number, category: HabitCategory) =>
    command<TodayState>({
      payload: { category, habitId },
      type: "habit.updateCategory",
    }),
  updateHabitFrequency: (
    habitId: number,
    frequency: HabitFrequency,
    targetCount?: number | null
  ) =>
    command<TodayState>({
      payload: { frequency, habitId, targetCount },
      type: "habit.updateFrequency",
    }),
  updateHabitTargetCount: (habitId: number, targetCount: number) =>
    command<TodayState>({
      payload: { habitId, targetCount },
      type: "habit.updateTargetCount",
    }),
  updateHabitWeekdays: (
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null
  ) =>
    command<TodayState>({
      payload: { habitId, selectedWeekdays },
      type: "habit.updateWeekdays",
    }),
  updateSettings: (settings: AppSettings) =>
    command<AppSettings>({
      payload: settings,
      type: "settings.update",
    }),
  upsertFocusQuotaGoal: (frequency: GoalFrequency, targetMinutes: number) =>
    command<TodayState>({
      payload: { frequency, targetMinutes },
      type: "focusQuotaGoal.upsert",
    }),
};
