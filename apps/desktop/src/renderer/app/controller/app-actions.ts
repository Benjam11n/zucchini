import { useFocusStore } from "@/renderer/features/focus/state/focus-store";
import { useInsightsStore } from "@/renderer/features/insights/state/insights-store";

/**
 * Top-level action factory for the renderer controller.
 *
 * Builds the flat action object consumed by `use-app-controller` and the app
 * shell. Feature modules own their action details; this module only wires
 * cross-feature dependencies and merges the public action surface.
 */
import { createBootActions } from "./boot-actions";
import { createHistoryActions } from "./history-actions";
import { createSettingsActions } from "./settings-actions";
import { createTodayActions } from "./today-actions";

export function createAppActions() {
  const focusActions = {
    clearFocusSaveError: useFocusStore.getState().clearFocusSaveError,
    loadFocusSessions: useFocusStore.getState().loadFocusSessions,
    recordFocusSession: useFocusStore.getState().recordFocusSession,
    setFocusSaveErrorMessage: useFocusStore.getState().setFocusSaveErrorMessage,
    showFocusWidget: () => window.desktop.showFocusWidget(),
  };
  const historyActions = createHistoryActions();
  const insightsActions = {
    handleSelectInsightsRangeDays: useInsightsStore.getState().setRangeDays,
    loadInsightsDashboard: (force = false) =>
      useInsightsStore.getState().loadDashboard({ force }),
    resetInsightsDashboard: useInsightsStore.getState().resetDashboard,
  };
  const settingsActions = createSettingsActions();
  const todayActions = createTodayActions({
    loadFocusSessions: focusActions.loadFocusSessions,
  });
  const bootActions = createBootActions({
    reloadAll: todayActions.reloadAll,
  });

  return {
    ...bootActions,
    ...focusActions,
    ...historyActions,
    ...insightsActions,
    ...settingsActions,
    ...todayActions,
  };
}

export const appActions = createAppActions();
