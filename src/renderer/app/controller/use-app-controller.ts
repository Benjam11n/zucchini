/**
 * Main renderer orchestration hook.
 *
 * This hook gathers state from the feature stores, runs shared lifecycle
 * effects, and returns the controller object consumed by the app shell.
 */
import { useUiStore } from "@/renderer/app/state/ui-store";
import { useFocusTimer } from "@/renderer/features/focus/hooks/use-focus-timer";
import { useSystemTheme } from "@/renderer/shared/hooks/use-system-theme";
import { getPomodoroTimerSettings } from "@/shared/domain/settings";

import { appActions } from "./app-actions";
import {
  createControllerActions,
  createControllerState,
  getResolvedFocusState,
  getResolvedHistoryState,
  getResolvedSettingsState,
  useAppControllerCoreState,
  useFocusPageState,
  useHistoryPageState,
  useNonSettingsHistoryState,
  useSettingsPageState,
  useWeeklyReviewState,
} from "./use-app-controller-state";
import { useAppLifecycleEffects } from "./use-app-lifecycle-effects";
import { useSettingsAutosave } from "./use-settings-autosave";

function useAppControllerActions() {
  return appActions;
}

export function useAppController() {
  const tab = useUiStore((state) => state.tab);
  const systemTheme = useSystemTheme();
  const actions = useAppControllerActions();
  const coreState = useAppControllerCoreState();
  const weeklyReviewState = useWeeklyReviewState();
  const historyState = useNonSettingsHistoryState();
  const focusPageState = useFocusPageState();
  const historyPageState = useHistoryPageState();
  const settingsPageState = useSettingsPageState();
  const focusState = getResolvedFocusState(focusPageState);
  const resolvedHistoryState = getResolvedHistoryState(historyState);
  const resolvedSettingsState = getResolvedSettingsState(
    coreState,
    settingsPageState
  );

  useSettingsAutosave({
    clearSettingsFeedback: actions.clearSettingsFeedback,
    handleUpdateSettings: actions.handleUpdateSettings,
    setSettingsSaveErrorMessage: actions.setSettingsSaveErrorMessage,
    setSettingsSavePhase: actions.setSettingsSavePhase,
    setSettingsValidationErrors: actions.setSettingsValidationErrors,
    settingsDraft: coreState.settingsDraft,
    settingsSavePhase: coreState.settingsSavePhase,
  });

  useAppLifecycleEffects({
    bootApp: actions.bootApp,
    bootPhase: coreState.bootPhase,
    loadWeeklyReviewOverview: actions.loadWeeklyReviewOverview,
    openWeeklyReviewSpotlight: actions.openWeeklyReviewSpotlight,
    refreshForNewDay: actions.refreshForNewDay,
    setSystemTheme: actions.setSystemTheme,
    settingsDraft: coreState.settingsDraft,
    systemTheme,
    todayState: coreState.todayState,
    weeklyReviewOverview: weeklyReviewState.weeklyReviewOverview,
    weeklyReviewPhase: weeklyReviewState.weeklyReviewPhase,
  });

  useFocusTimer({
    clearFocusSaveError: actions.clearFocusSaveError,
    pomodoroSettings: coreState.todayState
      ? getPomodoroTimerSettings(coreState.todayState.settings)
      : null,
    recordFocusSession: actions.recordFocusSession,
    setFocusSaveErrorMessage: actions.setFocusSaveErrorMessage,
  });

  return {
    actions: createControllerActions({
      actions,
      weeklyReviewState,
    }),
    state: createControllerState({
      coreState,
      focusState,
      historyPageState,
      historyState: resolvedHistoryState,
      settingsState: resolvedSettingsState,
      weeklyReviewState,
    }),
    tab,
  };
}
