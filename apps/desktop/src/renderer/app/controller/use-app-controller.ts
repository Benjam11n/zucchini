import { useUiStore } from "@/renderer/app/state/ui-store";
import { writeLastSeenWeeklyReviewStart } from "@/renderer/features/weekly-review/lib/weekly-review-storage";
import { useWeeklyReviewStore } from "@/renderer/features/weekly-review/state/weekly-review-store";
import { useSystemTheme } from "@/renderer/shared/hooks/use-system-theme";

import { appActions } from "./app-actions";
import {
  useAppControllerCoreState,
  useWeeklyReviewState,
} from "./use-app-controller-state";
import { useAppLifecycleEffects } from "./use-app-lifecycle-effects";
import { useSettingsAutosave } from "./use-settings-autosave";

const controllerActions = {
  ...appActions,
  handleDismissWeeklyReviewSpotlight: () => {
    const latestReview =
      useWeeklyReviewStore.getState().weeklyReviewOverview?.latestReview;
    if (latestReview) {
      writeLastSeenWeeklyReviewStart(latestReview.weekStart);
    }
    appActions.dismissWeeklyReviewSpotlight();
  },
  handleRetryBoot: appActions.retryBoot,
  handleWeeklyReviewOpen: async () => {
    const latestReview =
      useWeeklyReviewStore.getState().weeklyReviewOverview?.latestReview;
    if (!latestReview) {
      appActions.dismissWeeklyReviewSpotlight();
      return;
    }
    writeLastSeenWeeklyReviewStart(latestReview.weekStart);
    appActions.dismissWeeklyReviewSpotlight();
    appActions.handleTabChange("history");
    await appActions.selectWeeklyReview(latestReview.weekStart);
  },
};

export function useAppController() {
  const actions = appActions;
  const coreState = useAppControllerCoreState();
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
    loadHistoryYears: actions.loadHistoryYears,
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

  return {
    actions: controllerActions,
    state: {
      ...coreState,
      ...weeklyReviewState,
    },
    tab,
  };
}
