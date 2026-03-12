import { unstable_batchedUpdates } from "react-dom";

import { useBootStore } from "@/renderer/app/state/boot-store";
import { useUiStore } from "@/renderer/app/state/ui-store";
import { useFocusStore } from "@/renderer/features/focus/store";
import { useHistoryStore } from "@/renderer/features/history/store";
import { useWeeklyReviewStore } from "@/renderer/features/history/weekly-review-store";
import { useOnboardingStore } from "@/renderer/features/onboarding/store";
import { useSettingsStore } from "@/renderer/features/settings/store";
import { useTodayStore } from "@/renderer/features/today/store";
import { runAsyncTask } from "@/renderer/shared/lib/async-task";
import { toHabitsIpcError } from "@/shared/contracts/habits-ipc";
import type { TodayState } from "@/shared/contracts/habits-ipc";
import type { CreateFocusSessionInput } from "@/shared/domain/focus-session";
import type {
  HabitCategory,
  HabitFrequency,
  HabitWithStatus,
} from "@/shared/domain/habit";
import type {
  CompleteOnboardingInput,
  StarterPackHabitDraft,
} from "@/shared/domain/onboarding";
import type { AppSettings, ThemeMode } from "@/shared/domain/settings";

import type { SettingsFieldErrors, SettingsSavePhase, Tab } from "./types";

const RECENT_HISTORY_LIMIT = 14;

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

async function reloadAll(
  nextTodayState?: TodayState,
  historyScope = useHistoryStore.getState().historyScope
) {
  const historyPromise =
    historyScope === "recent"
      ? window.habits.getHistory(RECENT_HISTORY_LIMIT)
      : window.habits.getHistory();
  const [todayState, history, onboardingStatus] = await Promise.all([
    Promise.resolve(nextTodayState ?? window.habits.getTodayState()),
    historyPromise,
    window.habits.getOnboardingStatus(),
  ]);

  unstable_batchedUpdates(() => {
    useHistoryStore.setState({
      history,
      historyLoadError: null,
      historyScope,
      isHistoryLoading: false,
    });
    useOnboardingStore.setState({
      isOnboardingOpen:
        todayState.habits.length === 0 && !onboardingStatus.isComplete,
      onboardingStatus,
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
        useOnboardingStore.setState({
          isOnboardingOpen: false,
          onboardingError: null,
          onboardingPhase: "idle",
          onboardingStatus: null,
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

function clearOnboardingError() {
  useOnboardingStore.getState().clearOnboardingError();
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

async function handleApplyStarterPack(habits: StarterPackHabitDraft[]) {
  await refreshToday(window.habits.applyStarterPack(habits));
}

async function handleArchiveHabit(habitId: number) {
  await refreshToday(window.habits.archiveHabit(habitId));
}

async function handleCompleteOnboarding(input: CompleteOnboardingInput) {
  await runAsyncTask(() => window.habits.completeOnboarding(input), {
    mapError: toHabitsIpcError,
    onError: (onboardingError) => {
      useOnboardingStore.setState({
        onboardingError,
        onboardingPhase: "idle",
      });
    },
    onStart: () => {
      useOnboardingStore.setState({
        onboardingError: null,
        onboardingPhase: "submitting",
      });
    },
    onSuccess: async (nextTodayState) => {
      await reloadAll(nextTodayState);
      useOnboardingStore.setState({
        onboardingError: null,
        onboardingPhase: "idle",
      });
      useSettingsStore.setState({
        settingsDraft: nextTodayState.settings,
      });
    },
    rethrow: true,
  });
}

async function handleCreateHabit(
  name: string,
  category: HabitCategory,
  frequency: HabitFrequency
) {
  await refreshToday(window.habits.createHabit(name, category, frequency));
  updateSettingsDraftFromToday();
}

function handleSettingsDraftChange(settingsDraft: AppSettings) {
  useSettingsStore.getState().handleSettingsDraftChange(settingsDraft);
}

async function handleRenameHabit(habitId: number, name: string) {
  await refreshToday(window.habits.renameHabit(habitId, name));
}

async function handleReorderHabits(nextHabits: HabitWithStatus[]) {
  await refreshToday(
    window.habits.reorderHabits(nextHabits.map((habit) => habit.id))
  );
}

async function handleSkipOnboarding() {
  await runAsyncTask(() => window.habits.skipOnboarding(), {
    mapError: toHabitsIpcError,
    onError: (onboardingError) => {
      useOnboardingStore.setState({
        onboardingError,
        onboardingPhase: "idle",
      });
    },
    onStart: () => {
      useOnboardingStore.setState({
        onboardingError: null,
        onboardingPhase: "submitting",
      });
    },
    onSuccess: async () => {
      await reloadAll();
      useOnboardingStore.setState({
        onboardingError: null,
        onboardingPhase: "idle",
      });
    },
    rethrow: true,
  });
}

function handleTabChange(nextTab: Tab) {
  useUiStore.getState().setTab(nextTab);

  if (nextTab === "settings") {
    updateSettingsDraftFromToday();
  }

  if (nextTab === "focus") {
    void useFocusStore.getState().loadFocusSessions();
  }

  if (nextTab === "history") {
    void useHistoryStore.getState().loadFullHistory();
  }
}

async function handleToggleHabit(habitId: number) {
  await refreshToday(window.habits.toggleHabit(habitId));
}

async function handleUpdateHabitCategory(
  habitId: number,
  category: HabitCategory
) {
  await refreshToday(window.habits.updateHabitCategory(habitId, category));
}

async function handleUpdateHabitFrequency(
  habitId: number,
  frequency: HabitFrequency
) {
  await refreshToday(window.habits.updateHabitFrequency(habitId, frequency));
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

  unstable_batchedUpdates(() => {
    useFocusStore.getState().prependFocusSession(focusSession);
    useFocusStore.getState().setFocusSaveErrorMessage(null);
  });

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
  clearOnboardingError,
  clearSettingsFeedback,
  dismissWeeklyReviewSpotlight,
  handleApplyStarterPack,
  handleArchiveHabit,
  handleCompleteOnboarding,
  handleCreateHabit,
  handleRenameHabit,
  handleReorderHabits,
  handleSettingsDraftChange,
  handleSkipOnboarding,
  handleTabChange,
  handleToggleHabit,
  handleUpdateHabitCategory,
  handleUpdateHabitFrequency,
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
