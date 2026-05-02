import type { AppControllerState } from "@/renderer/app/controller/app-controller.types";
import { useUiStore } from "@/renderer/app/state/ui-store";
import { useFocusTimer } from "@/renderer/features/focus/hooks/use-focus-timer";
import { useFocusStore } from "@/renderer/features/focus/state/focus-store";
import { writeLastSeenWeeklyReviewStart } from "@/renderer/features/history/weekly-review/lib/weekly-review-storage";
import type { SettingsFieldErrors } from "@/renderer/features/settings/settings.types";
import { useSystemTheme } from "@/renderer/shared/hooks/use-system-theme";
import { getPomodoroTimerSettings } from "@/shared/domain/settings";

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

const EMPTY_FOCUS_SESSIONS: AppControllerState["focusSessions"] = [];
const EMPTY_HISTORY: AppControllerState["history"] = [];
const EMPTY_HISTORY_SUMMARY: AppControllerState["historySummary"] = [];
const EMPTY_MANAGED_HABITS: AppControllerState["managedHabits"] = [];
const EMPTY_SETTINGS_FIELD_ERRORS: SettingsFieldErrors = {};

function buildControllerActions({
  actions,
  latestReview,
}: {
  actions: typeof appActions;
  latestReview: { weekStart: string } | null | undefined;
}) {
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
    handleToggleHabit: actions.handleToggleHabit,
    handleToggleSickDay: actions.handleToggleSickDay,
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

function buildFocusControllerState(
  focusPageState: ReturnType<typeof useFocusPageState>
): Pick<
  AppControllerState,
  | "focusSaveErrorMessage"
  | "focusSessions"
  | "focusSessionsLoadError"
  | "focusSessionsPhase"
  | "hasLoadedFocusSessions"
  | "timerState"
> {
  return {
    focusSaveErrorMessage: focusPageState?.focusSaveErrorMessage ?? null,
    focusSessions: focusPageState?.focusSessions ?? EMPTY_FOCUS_SESSIONS,
    focusSessionsLoadError: focusPageState?.focusSessionsLoadError ?? null,
    focusSessionsPhase: focusPageState?.focusSessionsPhase ?? "idle",
    hasLoadedFocusSessions: focusPageState?.hasLoadedFocusSessions ?? false,
    timerState:
      focusPageState?.timerState ?? useFocusStore.getState().timerState,
  };
}

function buildHistoryControllerState({
  historyPageState,
  historyState,
}: {
  historyPageState: ReturnType<typeof useHistoryPageState>;
  historyState: ReturnType<typeof useNonSettingsHistoryState>;
}): Pick<
  AppControllerState,
  | "history"
  | "hasLoadedHistorySummary"
  | "historyLoadError"
  | "historyScope"
  | "historySummary"
  | "isHistoryLoading"
  | "selectedWeeklyReview"
  | "weeklyReviewError"
> {
  return {
    hasLoadedHistorySummary: historyState?.hasLoadedHistorySummary ?? false,
    history: historyState?.history ?? EMPTY_HISTORY,
    historyLoadError: historyState?.historyLoadError ?? null,
    historyScope: historyState?.historyScope ?? "recent",
    historySummary: historyState?.historySummary ?? EMPTY_HISTORY_SUMMARY,
    isHistoryLoading: historyState?.isHistoryLoading ?? false,
    selectedWeeklyReview: historyPageState?.selectedWeeklyReview ?? null,
    weeklyReviewError: historyPageState?.weeklyReviewError ?? null,
  };
}

function buildSettingsControllerState({
  coreState,
  settingsPageState,
}: {
  coreState: ReturnType<typeof useAppControllerCoreState>;
  settingsPageState: ReturnType<typeof useSettingsPageState>;
}): Pick<
  AppControllerState,
  | "settingsDraft"
  | "settingsFieldErrors"
  | "settingsSaveErrorMessage"
  | "settingsSavePhase"
> {
  return {
    settingsDraft: coreState.settingsDraft,
    settingsFieldErrors:
      settingsPageState?.settingsFieldErrors ?? EMPTY_SETTINGS_FIELD_ERRORS,
    settingsSaveErrorMessage:
      settingsPageState?.settingsSaveErrorMessage ?? null,
    settingsSavePhase:
      settingsPageState?.settingsSavePhase ?? coreState.settingsSavePhase,
  };
}

function buildControllerState({
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
  return {
    bootError: coreState.bootError,
    bootPhase: coreState.bootPhase,
    ...buildFocusControllerState(focusPageState),
    ...buildHistoryControllerState({
      historyPageState,
      historyState,
    }),
    isWeeklyReviewSpotlightOpen: weeklyReviewState.isWeeklyReviewSpotlightOpen,
    managedHabits: coreState.managedHabits ?? EMPTY_MANAGED_HABITS,
    ...buildSettingsControllerState({
      coreState,
      settingsPageState,
    }),
    todayState: coreState.todayState,
    weeklyReviewOverview: weeklyReviewState.weeklyReviewOverview,
    weeklyReviewPhase: weeklyReviewState.weeklyReviewPhase,
  } satisfies AppControllerState;
}

export function useAppController() {
  const actions = appActions;
  const coreState = useAppControllerCoreState();
  const focusPageState = useFocusPageState();
  const historyPageState = useHistoryPageState();
  const historyState = useNonSettingsHistoryState();
  const settingsPageState = useSettingsPageState();
  const systemTheme = useSystemTheme();
  const tab = useUiStore((state) => state.tab);
  const weeklyReviewState = useWeeklyReviewState();

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
    loadHistorySummary: actions.loadHistorySummary,
    loadTodayHabitStreaks: actions.loadTodayHabitStreaks,
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

  return {
    actions: buildControllerActions({
      actions,
      latestReview: weeklyReviewState.weeklyReviewOverview?.latestReview,
    }),
    state: buildControllerState({
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
