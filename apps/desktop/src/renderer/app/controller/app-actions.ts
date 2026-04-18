import { useFocusStore } from "@/renderer/features/focus/state/focus-store";
import { useHistoryStore } from "@/renderer/features/history/state/history-store";
import { useWeeklyReviewStore } from "@/renderer/features/history/weekly-review/state/weekly-review-store";
import type {
  SettingsFieldErrors,
  SettingsSavePhase,
} from "@/renderer/features/settings/settings.types";
import { useSettingsStore } from "@/renderer/features/settings/state/settings-store";
import { useTodayStore } from "@/renderer/features/today/state/today-store";
import type { CreateFocusSessionInput } from "@/shared/domain/focus-session";
import type { AppSettings } from "@/shared/domain/settings";

/**
 * Top-level action factory for the renderer controller.
 *
 * Builds the flat action object consumed by `use-app-controller` and the app
 * shell. Thin one-hop wrappers stay here; heavier today/boot flows live in
 * their dedicated modules.
 */
import { createBootActions } from "./boot-actions";
import { createTodayActions } from "./today-actions";

export function createAppActions() {
  async function loadFocusSessions(force = false) {
    await useFocusStore.getState().loadFocusSessions(force);
  }

  const todayActions = createTodayActions({
    loadFocusSessions,
  });
  const bootActions = createBootActions({
    reloadAll: todayActions.reloadAll,
  });

  return {
    ...bootActions,
    ...todayActions,
    clearFocusSaveError() {
      useFocusStore.getState().clearFocusSaveError();
    },
    clearSettingsFeedback() {
      useSettingsStore.getState().clearSettingsFeedback();
    },
    dismissWeeklyReviewSpotlight() {
      useWeeklyReviewStore.getState().dismissWeeklyReviewSpotlight();
    },
    handleSettingsDraftChange(settingsDraft: AppSettings) {
      useSettingsStore.getState().handleSettingsDraftChange(settingsDraft);
    },
    async handleUpdateSettings(settings: AppSettings) {
      const nextSettings = await window.habits.updateSettings(settings);

      useSettingsStore.setState({
        settingsDraft: nextSettings,
        settingsFieldErrors: {},
        settingsSaveErrorMessage: null,
      });
      const { todayState } = useTodayStore.getState();
      useTodayStore.setState({
        todayState: todayState
          ? {
              ...todayState,
              settings: nextSettings,
            }
          : todayState,
      });

      return nextSettings;
    },
    async loadFocusSessions(force = false) {
      await loadFocusSessions(force);
    },
    async loadFullHistory() {
      await useHistoryStore.getState().loadFullHistory();
    },
    async loadWeeklyReviewOverview() {
      await useWeeklyReviewStore.getState().loadWeeklyReviewOverview();
    },
    openWeeklyReviewSpotlight() {
      useWeeklyReviewStore.getState().openWeeklyReviewSpotlight();
    },
    async recordFocusSession(input: CreateFocusSessionInput) {
      const focusSession = await window.habits.recordFocusSession(input);
      useFocusStore.getState().setFocusSaveErrorMessage(null);
      return focusSession;
    },
    async selectWeeklyReview(weekStart: string) {
      await useWeeklyReviewStore.getState().selectWeeklyReview(weekStart);
    },
    setFocusSaveErrorMessage(message: string | null) {
      useFocusStore.getState().setFocusSaveErrorMessage(message);
    },
    setSettingsSaveErrorMessage(message: string | null) {
      useSettingsStore.getState().setSettingsSaveErrorMessage(message);
    },
    setSettingsSavePhase(phase: SettingsSavePhase) {
      useSettingsStore.getState().setSettingsSavePhase(phase);
    },
    setSettingsValidationErrors(errors: SettingsFieldErrors) {
      useSettingsStore.getState().setSettingsValidationErrors(errors);
    },
    async showFocusWidget() {
      await window.habits.showFocusWidget();
    },
  };
}

export const appActions = createAppActions();
