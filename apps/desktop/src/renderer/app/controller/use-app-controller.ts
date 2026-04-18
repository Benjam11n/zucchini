import type { AppControllerState } from "@/renderer/app/controller/app-controller.types";
/**
 * Main renderer orchestration hook.
 *
 * This hook gathers state from the feature stores, runs shared lifecycle
 * effects, and returns the controller object consumed by the app shell.
 */
import { useUiStore } from "@/renderer/app/state/ui-store";
import { useFocusTimer } from "@/renderer/features/focus/hooks/use-focus-timer";
import { useFocusStore } from "@/renderer/features/focus/state/focus-store";
import { writeLastSeenWeeklyReviewStart } from "@/renderer/features/history/weekly-review/lib/weekly-review-storage";
import type { SettingsFieldErrors } from "@/renderer/features/settings/settings.types";
import { useSystemTheme } from "@/renderer/shared/hooks/use-system-theme";
import { getPomodoroTimerSettings } from "@/shared/domain/settings";
import type { WeeklyReview } from "@/shared/domain/weekly-review";

import { appActions } from "./app-actions";
import {
  useAppControllerCoreState,
  useFocusPageState,
  useHistoryPageState,
  useNonSettingsHistoryState,
  useSettingsPageState,
  useWeeklyReviewState,
} from "./use-app-controller-state";
import { useAppLifecycleEffects } from "./use-app-lifecycle-effects";
import { useSettingsAutosave } from "./use-settings-autosave";

const EMPTY_HISTORY: AppControllerState["history"] = [];
const EMPTY_FOCUS_SESSIONS: AppControllerState["focusSessions"] = [];
const EMPTY_MANAGED_HABITS: AppControllerState["managedHabits"] = [];
const EMPTY_SETTINGS_FIELD_ERRORS: SettingsFieldErrors = {};

function createControllerActions({
  actions,
  latestReview,
}: {
  actions: typeof appActions;
  latestReview: WeeklyReview | null | undefined;
}) {
  // oxlint-disable-next-line eslint/sort-keys
  return {
    handleArchiveFocusQuotaGoal: actions.handleArchiveFocusQuotaGoal,
    handleArchiveHabit: actions.handleArchiveHabit,
    handleCloseWindDown: actions.handleCloseWindDown,
    handleCreateHabit: actions.handleCreateHabit,
    handleCreateWindDownAction: actions.handleCreateWindDownAction,
    handleDecrementHabitProgress: actions.handleDecrementHabitProgress,
    handleDeleteWindDownAction: actions.handleDeleteWindDownAction,
    handleDismissWeeklyReviewSpotlight: () => {
      if (latestReview) {
        writeLastSeenWeeklyReviewStart(latestReview.weekStart);
      }
      actions.dismissWeeklyReviewSpotlight();
    },
    handleIncrementHabitProgress: actions.handleIncrementHabitProgress,
    handleLoadOlderHistory: actions.loadFullHistory,
    handleOpenWindDown: actions.handleOpenWindDown,
    handleRenameHabit: actions.handleRenameHabit,
    handleRenameWindDownAction: actions.handleRenameWindDownAction,
    handleReorderHabits: actions.handleReorderHabits,
    handleRetryBoot: actions.retryBoot,
    handleRetryFocusLoad: async () => {
      await actions.loadFocusSessions(true);
    },
    handleRetryHistoryLoad: actions.loadFullHistory,
    handleSettingsDraftChange: actions.handleSettingsDraftChange,
    handleShowFocusWidget: actions.showFocusWidget,
    handleTabChange: actions.handleTabChange,
    handleToggleSickDay: actions.handleToggleSickDay,
    handleToggleHabit: actions.handleToggleHabit,
    handleToggleWindDownAction: actions.handleToggleWindDownAction,
    handleUnarchiveFocusQuotaGoal: actions.handleUnarchiveFocusQuotaGoal,
    handleUnarchiveHabit: actions.handleUnarchiveHabit,
    handleUpdateHabitCategory: actions.handleUpdateHabitCategory,
    handleUpdateHabitFrequency: actions.handleUpdateHabitFrequency,
    handleUpdateHabitTargetCount: actions.handleUpdateHabitTargetCount,
    handleUpdateHabitWeekdays: actions.handleUpdateHabitWeekdays,
    handleUpsertFocusQuotaGoal: actions.handleUpsertFocusQuotaGoal,
    handleWeeklyReviewOpen: async () => {
      if (!latestReview) {
        actions.dismissWeeklyReviewSpotlight();
        return;
      }

      writeLastSeenWeeklyReviewStart(latestReview.weekStart);
      actions.dismissWeeklyReviewSpotlight();
      actions.handleTabChange("history");
      await actions.selectWeeklyReview(latestReview.weekStart);
    },
    handleWeeklyReviewSelect: async (weekStart: string) => {
      await actions.selectWeeklyReview(weekStart);
    },
  };
}

// Fallback-heavy state mapping is intentional here to keep `useAppController`
// itself direct while preserving inactive-tab defaults.
// oxlint-disable-next-line eslint/complexity
function createControllerState({
  coreState,
  focusPageState,
  historyPageState,
  historyState,
  settingsPageState,
  weeklyReviewState,
}: {
  coreState: ReturnType<typeof useAppControllerCoreState>;
  focusPageState: ReturnType<typeof useFocusPageState>;
  historyPageState: ReturnType<typeof useHistoryPageState>;
  historyState: ReturnType<typeof useNonSettingsHistoryState>;
  settingsPageState: ReturnType<typeof useSettingsPageState>;
  weeklyReviewState: ReturnType<typeof useWeeklyReviewState>;
}) {
  const focusState = {
    focusSaveErrorMessage: focusPageState?.focusSaveErrorMessage ?? null,
    focusSessions: focusPageState?.focusSessions ?? EMPTY_FOCUS_SESSIONS,
    focusSessionsLoadError: focusPageState?.focusSessionsLoadError ?? null,
    focusSessionsPhase: focusPageState?.focusSessionsPhase ?? "idle",
    timerState:
      focusPageState?.timerState ?? useFocusStore.getState().timerState,
  };
  const historyViewState = {
    history: historyState?.history ?? EMPTY_HISTORY,
    historyLoadError: historyState?.historyLoadError ?? null,
    historyScope: historyState?.historyScope ?? "recent",
    isHistoryLoading: historyState?.isHistoryLoading ?? false,
    selectedWeeklyReview: historyPageState?.selectedWeeklyReview ?? null,
    weeklyReviewError: historyPageState?.weeklyReviewError ?? null,
  };
  const settingsState = {
    settingsDraft: coreState.settingsDraft,
    settingsFieldErrors:
      settingsPageState?.settingsFieldErrors ?? EMPTY_SETTINGS_FIELD_ERRORS,
    settingsSaveErrorMessage:
      settingsPageState?.settingsSaveErrorMessage ?? null,
    settingsSavePhase:
      settingsPageState?.settingsSavePhase ?? coreState.settingsSavePhase,
  };

  return {
    bootError: coreState.bootError,
    bootPhase: coreState.bootPhase,
    ...focusState,
    ...historyViewState,
    isWeeklyReviewSpotlightOpen: weeklyReviewState.isWeeklyReviewSpotlightOpen,
    managedHabits: coreState.managedHabits ?? EMPTY_MANAGED_HABITS,
    ...settingsState,
    todayState: coreState.todayState,
    weeklyReviewOverview: weeklyReviewState.weeklyReviewOverview,
    weeklyReviewPhase: weeklyReviewState.weeklyReviewPhase,
  };
}

export function useAppController() {
  const tab = useUiStore((state) => state.tab);
  const systemTheme = useSystemTheme();
  const actions = appActions;
  const coreState = useAppControllerCoreState();
  const weeklyReviewState = useWeeklyReviewState();
  const historyState = useNonSettingsHistoryState();
  const focusPageState = useFocusPageState();
  const historyPageState = useHistoryPageState();
  const settingsPageState = useSettingsPageState();

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
    openWindDown: actions.handleOpenWindDown,
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

  const latestReview = weeklyReviewState.weeklyReviewOverview?.latestReview;

  return {
    actions: createControllerActions({
      actions,
      latestReview,
    }),
    state: createControllerState({
      coreState,
      focusPageState,
      historyPageState,
      historyState,
      settingsPageState,
      weeklyReviewState,
    }),
    tab,
  };
}
