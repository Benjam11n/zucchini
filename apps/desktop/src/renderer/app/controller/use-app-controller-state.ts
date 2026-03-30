/**
 * Controller state composition utilities.
 *
 * Provides selector hooks and resolver functions that pull state from
 * individual feature Zustand stores and compose them into the unified
 * `AppControllerState` shape. Tab-aware selectors (`useTabStoreSelector`)
 * skip store subscriptions when the corresponding tab is not active to
 * reduce unnecessary re-renders.
 */
import { useShallow } from "zustand/react/shallow";

import type { createAppActions } from "@/renderer/app/controller/app-actions";
import type { AppControllerState } from "@/renderer/app/controller/app-controller.types";
import { useBootStore } from "@/renderer/app/state/boot-store";
import { useUiStore } from "@/renderer/app/state/ui-store";
import { useFocusStore } from "@/renderer/features/focus/state/focus-store";
import { useHistoryStore } from "@/renderer/features/history/state/history-store";
import { writeLastSeenWeeklyReviewStart } from "@/renderer/features/history/weekly-review/lib/weekly-review-storage";
import { useWeeklyReviewStore } from "@/renderer/features/history/weekly-review/state/weekly-review-store";
import type { SettingsFieldErrors } from "@/renderer/features/settings/settings.types";
import { useSettingsStore } from "@/renderer/features/settings/state/settings-store";
import { useTodayStore } from "@/renderer/features/today/state/today-store";

import { useTabStoreSelector } from "./use-tab-store-selector";

const EMPTY_HISTORY: AppControllerState["history"] = [];
const EMPTY_FOCUS_SESSIONS: AppControllerState["focusSessions"] = [];
const EMPTY_MANAGED_HABITS: AppControllerState["managedHabits"] = [];
const EMPTY_SETTINGS_FIELD_ERRORS: SettingsFieldErrors = {};

export function useAppControllerCoreState() {
  const bootState = useBootStore(
    useShallow((state) => ({
      bootError: state.bootError,
      bootPhase: state.bootPhase,
    }))
  );
  const settingsState = useSettingsStore(
    useShallow((state) => ({
      settingsDraft: state.settingsDraft,
      settingsSavePhase: state.settingsSavePhase,
    }))
  );
  const systemTheme = useUiStore((state) => state.systemTheme);
  const todayState = useTodayStore((state) => state.todayState);
  const managedHabits = useTodayStore((state) => state.managedHabits);

  return {
    ...bootState,
    managedHabits,
    ...settingsState,
    systemTheme,
    todayState,
  };
}

export function useWeeklyReviewState() {
  return useWeeklyReviewStore(
    useShallow((state) => ({
      isWeeklyReviewSpotlightOpen: state.isWeeklyReviewSpotlightOpen,
      weeklyReviewOverview: state.weeklyReviewOverview,
      weeklyReviewPhase: state.weeklyReviewPhase,
    }))
  );
}

export function useNonSettingsHistoryState() {
  const tab = useUiStore((state) => state.tab);

  return useHistoryStore(
    useShallow((state) =>
      tab === "settings"
        ? null
        : {
            history: state.history,
            historyLoadError: state.historyLoadError,
            historyScope: state.historyScope,
            isHistoryLoading: state.isHistoryLoading,
          }
    )
  );
}

export function useHistoryPageState() {
  return useTabStoreSelector("history", useWeeklyReviewStore, (state) => ({
    selectedWeeklyReview: state.selectedWeeklyReview,
    weeklyReviewError: state.weeklyReviewError,
  }));
}

export function useFocusPageState() {
  return useTabStoreSelector("focus", useFocusStore, (state) => ({
    focusSaveErrorMessage: state.focusSaveErrorMessage,
    focusSessions: state.focusSessions,
    focusSessionsLoadError: state.focusSessionsLoadError,
    focusSessionsPhase: state.focusSessionsPhase,
    timerState: state.timerState,
  }));
}

export function useSettingsPageState() {
  return useTabStoreSelector("settings", useSettingsStore, (state) => ({
    settingsFieldErrors: state.settingsFieldErrors,
    settingsSaveErrorMessage: state.settingsSaveErrorMessage,
    settingsSavePhase: state.settingsSavePhase,
  }));
}

export function getResolvedFocusState(
  focusPageState: ReturnType<typeof useFocusPageState>
) {
  return {
    focusSaveErrorMessage: focusPageState?.focusSaveErrorMessage ?? null,
    focusSessions: focusPageState?.focusSessions ?? EMPTY_FOCUS_SESSIONS,
    focusSessionsLoadError: focusPageState?.focusSessionsLoadError ?? null,
    focusSessionsPhase: focusPageState?.focusSessionsPhase ?? "idle",
    timerState:
      focusPageState?.timerState ?? useFocusStore.getState().timerState,
  };
}

export function getResolvedHistoryState(
  historyState: ReturnType<typeof useNonSettingsHistoryState>
) {
  return {
    history: historyState?.history ?? EMPTY_HISTORY,
    historyLoadError: historyState?.historyLoadError ?? null,
    historyScope: historyState?.historyScope ?? "recent",
    isHistoryLoading: historyState?.isHistoryLoading ?? false,
  };
}

export function getResolvedSettingsState(
  coreState: ReturnType<typeof useAppControllerCoreState>,
  settingsPageState: ReturnType<typeof useSettingsPageState>
) {
  return {
    settingsFieldErrors:
      settingsPageState?.settingsFieldErrors ?? EMPTY_SETTINGS_FIELD_ERRORS,
    settingsSaveErrorMessage:
      settingsPageState?.settingsSaveErrorMessage ?? null,
    settingsSavePhase:
      settingsPageState?.settingsSavePhase ?? coreState.settingsSavePhase,
  };
}

export function createControllerActions({
  actions,
  weeklyReviewState,
}: {
  actions: ReturnType<typeof createAppActions>;
  weeklyReviewState: ReturnType<typeof useWeeklyReviewState>;
}) {
  return {
    handleArchiveHabit: actions.handleArchiveHabit,
    handleCreateHabit: actions.handleCreateHabit,
    handleDismissWeeklyReviewSpotlight: () => {
      const latestReview = weeklyReviewState.weeklyReviewOverview?.latestReview;
      if (latestReview) {
        writeLastSeenWeeklyReviewStart(latestReview.weekStart);
      }
      actions.dismissWeeklyReviewSpotlight();
    },
    handleLoadOlderHistory: actions.loadFullHistory,
    handleRenameHabit: actions.handleRenameHabit,
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
    handleUnarchiveHabit: actions.handleUnarchiveHabit,
    handleUpdateHabitCategory: actions.handleUpdateHabitCategory,
    handleUpdateHabitFrequency: actions.handleUpdateHabitFrequency,
    handleUpdateHabitWeekdays: actions.handleUpdateHabitWeekdays,
    handleWeeklyReviewOpen: async () => {
      const latestReview = weeklyReviewState.weeklyReviewOverview?.latestReview;
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

export function createControllerState({
  coreState,
  focusState,
  historyPageState,
  historyState,
  settingsState,
  weeklyReviewState,
}: {
  coreState: ReturnType<typeof useAppControllerCoreState>;
  focusState: ReturnType<typeof getResolvedFocusState>;
  historyPageState: ReturnType<typeof useHistoryPageState>;
  historyState: ReturnType<typeof getResolvedHistoryState>;
  settingsState: ReturnType<typeof getResolvedSettingsState>;
  weeklyReviewState: ReturnType<typeof useWeeklyReviewState>;
}) {
  return {
    bootError: coreState.bootError,
    bootPhase: coreState.bootPhase,
    focusSaveErrorMessage: focusState.focusSaveErrorMessage,
    focusSessions: focusState.focusSessions,
    focusSessionsLoadError: focusState.focusSessionsLoadError,
    focusSessionsPhase: focusState.focusSessionsPhase,
    history: historyState.history,
    historyLoadError: historyState.historyLoadError,
    historyScope: historyState.historyScope,
    isHistoryLoading: historyState.isHistoryLoading,
    isWeeklyReviewSpotlightOpen: weeklyReviewState.isWeeklyReviewSpotlightOpen,
    managedHabits: coreState.managedHabits ?? EMPTY_MANAGED_HABITS,
    selectedWeeklyReview: historyPageState?.selectedWeeklyReview ?? null,
    settingsDraft: coreState.settingsDraft,
    settingsFieldErrors: settingsState.settingsFieldErrors,
    settingsSaveErrorMessage: settingsState.settingsSaveErrorMessage,
    settingsSavePhase: settingsState.settingsSavePhase,
    timerState: focusState.timerState,
    todayState: coreState.todayState,
    weeklyReviewError: historyPageState?.weeklyReviewError ?? null,
    weeklyReviewOverview: weeklyReviewState.weeklyReviewOverview,
    weeklyReviewPhase: weeklyReviewState.weeklyReviewPhase,
  };
}
