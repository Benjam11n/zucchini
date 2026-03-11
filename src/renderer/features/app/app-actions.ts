import { unstable_batchedUpdates } from "react-dom";

import { toHabitsIpcError } from "@/shared/contracts/habits-ipc";
import type { TodayState } from "@/shared/contracts/habits-ipc";
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

import {
  useBootStore,
  useHistoryStore,
  useOnboardingStore,
  useSettingsStore,
  useTodayStore,
  useUiStore,
  useWeeklyReviewStore,
} from "./stores";
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

export async function bootApp() {
  useBootStore.setState({
    bootError: null,
    bootPhase: "loading",
  });

  try {
    await reloadAll(undefined, "recent");
    useBootStore.setState({
      bootPhase: "ready",
    });
  } catch (error: unknown) {
    unstable_batchedUpdates(() => {
      useBootStore.setState({
        bootError: toHabitsIpcError(error),
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
  }
}

export function clearOnboardingError() {
  useOnboardingStore.getState().clearOnboardingError();
}

export function clearSettingsFeedback() {
  useSettingsStore.getState().clearSettingsFeedback();
}

export function dismissWeeklyReviewSpotlight() {
  useWeeklyReviewStore.getState().dismissWeeklyReviewSpotlight();
}

export async function handleApplyStarterPack(habits: StarterPackHabitDraft[]) {
  await refreshToday(window.habits.applyStarterPack(habits));
}

export async function handleArchiveHabit(habitId: number) {
  await refreshToday(window.habits.archiveHabit(habitId));
}

export async function handleCompleteOnboarding(input: CompleteOnboardingInput) {
  useOnboardingStore.setState({
    onboardingError: null,
    onboardingPhase: "submitting",
  });

  try {
    const nextTodayState = await window.habits.completeOnboarding(input);
    await reloadAll(nextTodayState);
    useOnboardingStore.setState({
      onboardingError: null,
      onboardingPhase: "idle",
    });
    useSettingsStore.setState({
      settingsDraft: nextTodayState.settings,
    });
  } catch (error) {
    useOnboardingStore.setState({
      onboardingError: toHabitsIpcError(error),
      onboardingPhase: "idle",
    });
    throw error;
  }
}

export async function handleCreateHabit(
  name: string,
  category: HabitCategory,
  frequency: HabitFrequency
) {
  await refreshToday(window.habits.createHabit(name, category, frequency));
  updateSettingsDraftFromToday();
}

export function handleSettingsDraftChange(settingsDraft: AppSettings) {
  useSettingsStore.getState().handleSettingsDraftChange(settingsDraft);
}

export async function handleRenameHabit(habitId: number, name: string) {
  await refreshToday(window.habits.renameHabit(habitId, name));
}

export async function handleReorderHabits(nextHabits: HabitWithStatus[]) {
  await refreshToday(
    window.habits.reorderHabits(nextHabits.map((habit) => habit.id))
  );
}

export async function handleSkipOnboarding() {
  useOnboardingStore.setState({
    onboardingError: null,
    onboardingPhase: "submitting",
  });

  try {
    await window.habits.skipOnboarding();
    await reloadAll();
    useOnboardingStore.setState({
      onboardingError: null,
      onboardingPhase: "idle",
    });
  } catch (error) {
    useOnboardingStore.setState({
      onboardingError: toHabitsIpcError(error),
      onboardingPhase: "idle",
    });
    throw error;
  }
}

export function handleTabChange(nextTab: Tab) {
  useUiStore.getState().setTab(nextTab);

  if (nextTab === "settings") {
    updateSettingsDraftFromToday();
  }

  if (nextTab === "history") {
    void useHistoryStore.getState().loadFullHistory();
  }
}

export async function handleToggleHabit(habitId: number) {
  await refreshToday(window.habits.toggleHabit(habitId));
}

export async function handleUpdateHabitCategory(
  habitId: number,
  category: HabitCategory
) {
  await refreshToday(window.habits.updateHabitCategory(habitId, category));
}

export async function handleUpdateHabitFrequency(
  habitId: number,
  frequency: HabitFrequency
) {
  await refreshToday(window.habits.updateHabitFrequency(habitId, frequency));
}

export async function handleUpdateSettings(settings: AppSettings) {
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

export async function loadFullHistory() {
  await useHistoryStore.getState().loadFullHistory();
}

export async function loadWeeklyReviewOverview() {
  await useWeeklyReviewStore.getState().loadWeeklyReviewOverview();
}

export function openWeeklyReviewSpotlight() {
  useWeeklyReviewStore.getState().openWeeklyReviewSpotlight();
}

export async function retryBoot() {
  await bootApp();
}

export async function selectWeeklyReview(weekStart: string) {
  await useWeeklyReviewStore.getState().selectWeeklyReview(weekStart);
}

export function setSettingsSaveErrorMessage(message: string | null) {
  useSettingsStore.getState().setSettingsSaveErrorMessage(message);
}

export function setSettingsSavePhase(phase: SettingsSavePhase) {
  useSettingsStore.getState().setSettingsSavePhase(phase);
}

export function setSettingsValidationErrors(errors: SettingsFieldErrors) {
  useSettingsStore.getState().setSettingsValidationErrors(errors);
}

export function setSystemTheme(systemTheme: ThemeMode) {
  useUiStore.getState().setSystemTheme(systemTheme);
}

export const appActions = {
  bootApp,
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
  loadFullHistory,
  loadWeeklyReviewOverview,
  openWeeklyReviewSpotlight,
  retryBoot,
  selectWeeklyReview,
  setSettingsSaveErrorMessage,
  setSettingsSavePhase,
  setSettingsValidationErrors,
  setSystemTheme,
};
