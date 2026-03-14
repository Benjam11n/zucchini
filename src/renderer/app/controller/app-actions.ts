import { unstable_batchedUpdates } from "react-dom";

import type { AppTab } from "@/renderer/app/app.types";
import { useBootStore } from "@/renderer/app/state/boot-store";
import { useUiStore } from "@/renderer/app/state/ui-store";
import { useFocusStore } from "@/renderer/features/focus/state/focus-store";
import { useHistoryStore } from "@/renderer/features/history/state/history-store";
import { useWeeklyReviewStore } from "@/renderer/features/history/weekly-review/state/weekly-review-store";
import type {
  SettingsFieldErrors,
  SettingsSavePhase,
} from "@/renderer/features/settings/settings.types";
import { useSettingsStore } from "@/renderer/features/settings/state/settings-store";
import { useTodayStore } from "@/renderer/features/today/state/today-store";
import { runAsyncTask } from "@/renderer/shared/lib/async-task";
import { toHabitsIpcError } from "@/shared/contracts/habits-ipc";
import type { TodayState } from "@/shared/contracts/habits-ipc";
import type { CreateFocusSessionInput } from "@/shared/domain/focus-session";
import type {
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
  HabitWithStatus,
} from "@/shared/domain/habit";
import type { AppSettings, ThemeMode } from "@/shared/domain/settings";
import { parseDateKey } from "@/shared/utils/date";

function getCurrentYearHistoryLimit(todayDate: string): number {
  const today = parseDateKey(todayDate);
  const yearStart = new Date(today.getFullYear(), 0, 1);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.min(
    366,
    Math.floor((today.getTime() - yearStart.getTime()) / millisecondsPerDay) + 1
  );
}

function updateSettingsDraftFromToday() {
  const { todayState } = useTodayStore.getState();
  const { settingsDraft } = useSettingsStore.getState();

  useSettingsStore.setState({
    settingsDraft: todayState?.settings ?? settingsDraft,
  });
}

function updateTodayState(nextSettings: AppSettings) {
  const { todayState } = useTodayStore.getState();
  useTodayStore.setState({
    todayState: todayState
      ? {
          ...todayState,
          settings: nextSettings,
        }
      : todayState,
  });
}

function applyTodayState(nextTodayState: TodayState) {
  unstable_batchedUpdates(() => {
    useSettingsStore.setState((state) => ({
      settingsDraft: state.settingsDraft ?? nextTodayState.settings,
    }));
    useTodayStore.setState({
      todayState: nextTodayState,
    });
  });
}

function refreshWeeklyReviewInBackground() {
  if (useWeeklyReviewStore.getState().weeklyReviewPhase === "idle") {
    return;
  }

  void useWeeklyReviewStore.getState().loadWeeklyReviewOverview();
}

async function reloadAll(
  nextTodayState?: TodayState,
  historyScope = useHistoryStore.getState().historyScope
) {
  const todayState = nextTodayState ?? (await window.habits.getTodayState());
  const history =
    historyScope === "recent"
      ? await window.habits.getHistory(
          getCurrentYearHistoryLimit(todayState.date)
        )
      : await window.habits.getHistory();

  unstable_batchedUpdates(() => {
    useHistoryStore.setState({
      history,
      historyLoadError: null,
      historyScope,
      isHistoryLoading: false,
    });
    useSettingsStore.setState((state) => ({
      settingsDraft: state.settingsDraft ?? todayState.settings,
    }));
    useTodayStore.setState({ todayState });
  });
}

async function refreshToday(mutator: Promise<TodayState>) {
  const nextTodayState = await mutator;
  await reloadAll(nextTodayState, useHistoryStore.getState().historyScope);
  if (useWeeklyReviewStore.getState().weeklyReviewPhase !== "idle") {
    await useWeeklyReviewStore.getState().loadWeeklyReviewOverview();
  }
}

async function applyTodayMutation(mutator: Promise<TodayState>) {
  const nextTodayState = await mutator;
  applyTodayState(nextTodayState);
  refreshWeeklyReviewInBackground();
  return nextTodayState;
}

async function bootApp() {
  await runAsyncTask(() => reloadAll(undefined, "recent"), {
    mapError: toHabitsIpcError,
    onError: (bootError) => {
      unstable_batchedUpdates(() => {
        useBootStore.setState({
          bootError,
          bootPhase: "error",
        });
        useHistoryStore.setState({
          history: [],
          historyLoadError: null,
          historyScope: "recent",
          isHistoryLoading: false,
        });
        useSettingsStore.setState({
          settingsDraft: null,
        });
        useTodayStore.setState({
          todayState: null,
        });
        useWeeklyReviewStore.setState({
          isWeeklyReviewSpotlightOpen: false,
          selectedWeeklyReview: null,
          weeklyReviewError: null,
          weeklyReviewOverview: null,
          weeklyReviewPhase: "idle",
        });
      });
    },
    onStart: () => {
      useBootStore.setState({
        bootError: null,
        bootPhase: "loading",
      });
    },
    onSuccess: () => {
      useBootStore.setState({
        bootPhase: "ready",
      });
    },
  });
}

function clearSettingsFeedback() {
  useSettingsStore.getState().clearSettingsFeedback();
}

function clearFocusSaveError() {
  useFocusStore.getState().clearFocusSaveError();
}

function dismissWeeklyReviewSpotlight() {
  useWeeklyReviewStore.getState().dismissWeeklyReviewSpotlight();
}

async function handleArchiveHabit(habitId: number) {
  await applyTodayMutation(window.habits.archiveHabit(habitId));
}

async function handleUnarchiveHabit(habitId: number) {
  await applyTodayMutation(window.habits.unarchiveHabit(habitId));
}

async function handleCreateHabit(
  name: string,
  category: HabitCategory,
  frequency: HabitFrequency,
  selectedWeekdays: HabitWeekday[] | null = null
) {
  await applyTodayMutation(
    window.habits.createHabit(name, category, frequency, selectedWeekdays)
  );
  updateSettingsDraftFromToday();
}

function handleSettingsDraftChange(settingsDraft: AppSettings) {
  useSettingsStore.getState().handleSettingsDraftChange(settingsDraft);
}

async function handleRenameHabit(habitId: number, name: string) {
  await applyTodayMutation(window.habits.renameHabit(habitId, name));
}

async function handleReorderHabits(nextHabits: HabitWithStatus[]) {
  const previousTodayState = useTodayStore.getState().todayState;

  if (previousTodayState) {
    useTodayStore.setState({
      todayState: {
        ...previousTodayState,
        habits: nextHabits,
      },
    });
  }

  try {
    await applyTodayMutation(
      window.habits.reorderHabits(nextHabits.map((habit) => habit.id))
    );
  } catch (error) {
    useTodayStore.setState({
      todayState: previousTodayState,
    });
    throw error;
  }
}

function handleTabChange(nextTab: AppTab) {
  useUiStore.getState().setTab(nextTab);

  if (nextTab === "settings") {
    updateSettingsDraftFromToday();
  }

  if (nextTab === "focus") {
    void useFocusStore.getState().loadFocusSessions();
  }
}

async function handleToggleHabit(habitId: number) {
  await refreshToday(window.habits.toggleHabit(habitId));
}

async function handleUpdateHabitCategory(
  habitId: number,
  category: HabitCategory
) {
  await applyTodayMutation(
    window.habits.updateHabitCategory(habitId, category)
  );
}

async function handleUpdateHabitFrequency(
  habitId: number,
  frequency: HabitFrequency
) {
  await applyTodayMutation(
    window.habits.updateHabitFrequency(habitId, frequency)
  );
}

async function handleUpdateHabitWeekdays(
  habitId: number,
  selectedWeekdays: HabitWeekday[] | null
) {
  await applyTodayMutation(
    window.habits.updateHabitWeekdays(habitId, selectedWeekdays)
  );
}

async function handleUpdateSettings(settings: AppSettings) {
  const nextSettings = await window.habits.updateSettings(settings);

  unstable_batchedUpdates(() => {
    useSettingsStore.setState({
      settingsDraft: nextSettings,
      settingsFieldErrors: {},
      settingsSaveErrorMessage: null,
    });
    updateTodayState(nextSettings);
  });

  return nextSettings;
}

async function loadFullHistory() {
  await useHistoryStore.getState().loadFullHistory();
}

async function loadFocusSessions(force = false) {
  await useFocusStore.getState().loadFocusSessions(force);
}

async function loadWeeklyReviewOverview() {
  await useWeeklyReviewStore.getState().loadWeeklyReviewOverview();
}

function openWeeklyReviewSpotlight() {
  useWeeklyReviewStore.getState().openWeeklyReviewSpotlight();
}

async function retryBoot() {
  await bootApp();
}

async function selectWeeklyReview(weekStart: string) {
  await useWeeklyReviewStore.getState().selectWeeklyReview(weekStart);
}

async function recordFocusSession(input: CreateFocusSessionInput) {
  const focusSession = await window.habits.recordFocusSession(input);
  useFocusStore.getState().setFocusSaveErrorMessage(null);
  return focusSession;
}

async function showFocusWidget() {
  await window.habits.showFocusWidget();
}

function setFocusSaveErrorMessage(message: string | null) {
  useFocusStore.getState().setFocusSaveErrorMessage(message);
}

function setSettingsSaveErrorMessage(message: string | null) {
  useSettingsStore.getState().setSettingsSaveErrorMessage(message);
}

function setSettingsSavePhase(phase: SettingsSavePhase) {
  useSettingsStore.getState().setSettingsSavePhase(phase);
}

function setSettingsValidationErrors(errors: SettingsFieldErrors) {
  useSettingsStore.getState().setSettingsValidationErrors(errors);
}

function setSystemTheme(systemTheme: ThemeMode) {
  useUiStore.getState().setSystemTheme(systemTheme);
}

export const appActions = {
  bootApp,
  clearFocusSaveError,
  clearSettingsFeedback,
  dismissWeeklyReviewSpotlight,
  handleArchiveHabit,
  handleCreateHabit,
  handleRenameHabit,
  handleReorderHabits,
  handleSettingsDraftChange,
  handleTabChange,
  handleToggleHabit,
  handleUnarchiveHabit,
  handleUpdateHabitCategory,
  handleUpdateHabitFrequency,
  handleUpdateHabitWeekdays,
  handleUpdateSettings,
  loadFocusSessions,
  loadFullHistory,
  loadWeeklyReviewOverview,
  openWeeklyReviewSpotlight,
  recordFocusSession,
  retryBoot,
  selectWeeklyReview,
  setFocusSaveErrorMessage,
  setSettingsSaveErrorMessage,
  setSettingsSavePhase,
  setSettingsValidationErrors,
  setSystemTheme,
  showFocusWidget,
};
