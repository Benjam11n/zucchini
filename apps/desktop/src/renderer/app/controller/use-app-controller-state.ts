/**
 * Controller state selectors.
 *
 * Pulls state from individual feature stores. Tab-aware selectors
 * (`useTabStoreSelector`) skip subscriptions for inactive tabs to avoid
 * unnecessary re-renders.
 */
import { useShallow } from "zustand/react/shallow";

import { useBootStore } from "@/renderer/app/state/boot-store";
import { useUiStore } from "@/renderer/app/state/ui-store";
import { useFocusStore } from "@/renderer/features/focus/state/focus-store";
import { useHistoryStore } from "@/renderer/features/history/state/history-store";
import { useWeeklyReviewStore } from "@/renderer/features/history/weekly-review/state/weekly-review-store";
import { useSettingsStore } from "@/renderer/features/settings/state/settings-store";
import { useTodayStore } from "@/renderer/features/today/state/today-store";

import { useTabStoreSelector } from "./use-tab-store-selector";

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
            hasLoadedHistorySummary: state.hasLoadedHistorySummary,
            history: state.history,
            historyLoadError: state.historyLoadError,
            historyScope: state.historyScope,
            historySummary: state.historySummary,
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
    hasLoadedFocusSessions: state.hasLoadedFocusSessions,
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
