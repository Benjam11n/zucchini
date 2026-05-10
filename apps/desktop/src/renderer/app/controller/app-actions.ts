/**
 * Top-level action factory for the renderer controller.
 *
 * Builds the flat action object consumed by `use-app-controller` and the app
 * shell. Feature modules own their action details; this module only wires
 * cross-feature dependencies and merges the public action surface.
 */
import { createBootActions } from "./boot-actions";
import { createFocusActions } from "./focus-actions";
import { createHistoryActions } from "./history-actions";
import { createInsightsActions } from "./insights-actions";
import { createSettingsActions } from "./settings-actions";
import { createTodayActions } from "./today-actions";

export function createAppActions() {
  const focusActions = createFocusActions();
  const historyActions = createHistoryActions();
  const insightsActions = createInsightsActions();
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
