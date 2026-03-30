/**
 * Top-level action factory for the renderer controller.
 *
 * Composes all feature-level action creators (boot, today, focus, history,
 * settings) into a single flat object. The resulting actions are consumed by
 * `use-app-controller` and forwarded to the app shell as callbacks.
 */
import { createBootActions } from "./boot-actions";
import { createFocusActions } from "./focus-actions";
import { createHistoryActions } from "./history-actions";
import { createSettingsActions } from "./settings-actions";
import { createTodayActions } from "./today-actions";

export function createAppActions() {
  const focusActions = createFocusActions();
  const historyActions = createHistoryActions();
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
    ...settingsActions,
    ...todayActions,
  };
}

export const appActions = createAppActions();
