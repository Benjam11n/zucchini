/**
 * Main renderer orchestration hook.
 *
 * This hook gathers state from the feature stores, kicks off boot-time side
 * effects, and returns the single controller object that powers the app root.
 */
import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";

import { useBootStore } from "@/renderer/app/state/boot-store";
import { useUiStore } from "@/renderer/app/state/ui-store";
import { useFocusTimer } from "@/renderer/features/focus/hooks/use-focus-timer";
import { writePomodoroTimerSettings } from "@/renderer/features/focus/lib/pomodoro-settings-storage";
import { useFocusStore } from "@/renderer/features/focus/state/focus-store";
import { useHistoryStore } from "@/renderer/features/history/state/history-store";
import { shouldOpenWeeklyReviewSpotlight } from "@/renderer/features/history/weekly-review/lib/weekly-review-spotlight";
import {
  readLastSeenWeeklyReviewStart,
  writeLastSeenWeeklyReviewStart,
} from "@/renderer/features/history/weekly-review/lib/weekly-review-storage";
import { useWeeklyReviewStore } from "@/renderer/features/history/weekly-review/state/weekly-review-store";
import { useOnboardingStore } from "@/renderer/features/onboarding/state/onboarding-store";
import {
  areAppSettingsEqual,
  mapSettingsValidationErrors,
} from "@/renderer/features/settings/lib/settings-form";
import type { SettingsFieldErrors } from "@/renderer/features/settings/settings.types";
import { useSettingsStore } from "@/renderer/features/settings/state/settings-store";
import { useTodayStore } from "@/renderer/features/today/state/today-store";
import { useApplyThemeMode } from "@/renderer/shared/hooks/use-apply-theme-mode";
import { useSystemTheme } from "@/renderer/shared/hooks/use-system-theme";
import { runAsyncTask } from "@/renderer/shared/lib/async-task";
import { appSettingsSchema } from "@/shared/contracts/habits-ipc-schema";
import { getPomodoroTimerSettings } from "@/shared/domain/settings";
import type { AppSettings } from "@/shared/domain/settings";

import { appActions } from "./app-actions";
import type { AppControllerState } from "./app-controller.types";
import { useTabStoreSelector } from "./use-tab-store-selector";

const EMPTY_HISTORY: AppControllerState["history"] = [];
const EMPTY_FOCUS_SESSIONS: AppControllerState["focusSessions"] = [];
const EMPTY_SETTINGS_FIELD_ERRORS: SettingsFieldErrors = {};

function useAppControllerActions() {
  return appActions;
}

function useAppControllerCoreState() {
  const bootState = useBootStore(
    useShallow((state) => ({
      bootError: state.bootError,
      bootPhase: state.bootPhase,
    }))
  );
  const onboardingState = useOnboardingStore(
    useShallow((state) => ({
      isOnboardingOpen: state.isOnboardingOpen,
      onboardingError: state.onboardingError,
      onboardingPhase: state.onboardingPhase,
      onboardingStatus: state.onboardingStatus,
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

  return {
    ...bootState,
    ...onboardingState,
    ...settingsState,
    systemTheme,
    todayState,
  };
}

function useWeeklyReviewState() {
  return useWeeklyReviewStore(
    useShallow((state) => ({
      isWeeklyReviewSpotlightOpen: state.isWeeklyReviewSpotlightOpen,
      weeklyReviewOverview: state.weeklyReviewOverview,
      weeklyReviewPhase: state.weeklyReviewPhase,
    }))
  );
}

function useNonSettingsHistoryState() {
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

function useHistoryPageState() {
  return useTabStoreSelector("history", useWeeklyReviewStore, (state) => ({
    selectedWeeklyReview: state.selectedWeeklyReview,
    weeklyReviewError: state.weeklyReviewError,
  }));
}

function useFocusPageState() {
  return useTabStoreSelector("focus", useFocusStore, (state) => ({
    focusSaveErrorMessage: state.focusSaveErrorMessage,
    focusSessions: state.focusSessions,
    focusSessionsLoadError: state.focusSessionsLoadError,
    focusSessionsPhase: state.focusSessionsPhase,
    timerState: state.timerState,
  }));
}

function useSettingsPageState() {
  return useTabStoreSelector("settings", useSettingsStore, (state) => ({
    settingsFieldErrors: state.settingsFieldErrors,
    settingsSaveErrorMessage: state.settingsSaveErrorMessage,
    settingsSavePhase: state.settingsSavePhase,
  }));
}

function getResolvedFocusState(
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

function getResolvedHistoryState(
  historyState: ReturnType<typeof useNonSettingsHistoryState>
) {
  return {
    history: historyState?.history ?? EMPTY_HISTORY,
    historyLoadError: historyState?.historyLoadError ?? null,
    historyScope: historyState?.historyScope ?? "recent",
    isHistoryLoading: historyState?.isHistoryLoading ?? false,
  };
}

function getResolvedSettingsState(
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

function createControllerActions({
  actions,
  weeklyReviewState,
}: {
  actions: ReturnType<typeof useAppControllerActions>;
  weeklyReviewState: ReturnType<typeof useWeeklyReviewState>;
}) {
  return {
    handleApplyStarterPack: actions.handleApplyStarterPack,
    handleArchiveHabit: actions.handleArchiveHabit,
    handleClearOnboardingError: actions.clearOnboardingError,
    handleCompleteOnboarding: actions.handleCompleteOnboarding,
    handleCreateHabit: actions.handleCreateHabit,
    handleDismissWeeklyReviewSpotlight: () => {
      const latestReview = weeklyReviewState.weeklyReviewOverview?.latestReview;
      if (latestReview) {
        writeLastSeenWeeklyReviewStart(latestReview.weekStart);
      }
      actions.dismissWeeklyReviewSpotlight();
    },
    handleRenameHabit: actions.handleRenameHabit,
    handleReorderHabits: actions.handleReorderHabits,
    handleRetryBoot: actions.retryBoot,
    handleRetryFocusLoad: async () => {
      await actions.loadFocusSessions(true);
    },
    handleRetryHistoryLoad: actions.loadFullHistory,
    handleSettingsDraftChange: actions.handleSettingsDraftChange,
    handleShowFocusWidget: actions.showFocusWidget,
    handleSkipOnboarding: actions.handleSkipOnboarding,
    handleTabChange: actions.handleTabChange,
    handleToggleHabit: actions.handleToggleHabit,
    handleUpdateHabitCategory: actions.handleUpdateHabitCategory,
    handleUpdateHabitFrequency: actions.handleUpdateHabitFrequency,
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

function createControllerState({
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
    isOnboardingOpen: coreState.isOnboardingOpen,
    isWeeklyReviewSpotlightOpen: weeklyReviewState.isWeeklyReviewSpotlightOpen,
    onboardingError: coreState.onboardingError,
    onboardingPhase: coreState.onboardingPhase,
    onboardingStatus: coreState.onboardingStatus,
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

function useSettingsAutosave({
  clearSettingsFeedback,
  handleUpdateSettings,
  setSettingsSaveErrorMessage,
  setSettingsSavePhase,
  setSettingsValidationErrors,
  settingsDraft,
  settingsSavePhase,
}: {
  clearSettingsFeedback: ReturnType<
    typeof useAppControllerActions
  >["clearSettingsFeedback"];
  handleUpdateSettings: ReturnType<
    typeof useAppControllerActions
  >["handleUpdateSettings"];
  setSettingsSaveErrorMessage: ReturnType<
    typeof useAppControllerActions
  >["setSettingsSaveErrorMessage"];
  setSettingsSavePhase: ReturnType<
    typeof useAppControllerActions
  >["setSettingsSavePhase"];
  setSettingsValidationErrors: ReturnType<
    typeof useAppControllerActions
  >["setSettingsValidationErrors"];
  settingsDraft: AppSettings | null;
  settingsSavePhase: AppControllerState["settingsSavePhase"];
}) {
  const lastSavedDraft = useRef<AppSettings | null>(null);
  const settingsSavePhaseRef = useRef(settingsSavePhase);

  useEffect(() => {
    settingsSavePhaseRef.current = settingsSavePhase;
  }, [settingsSavePhase]);

  useEffect(() => {
    const draft = settingsDraft;
    const currentSavePhase = settingsSavePhaseRef.current;
    if (!draft) {
      return;
    }

    if (lastSavedDraft.current === null) {
      lastSavedDraft.current = draft;
      return;
    }

    if (areAppSettingsEqual(draft, lastSavedDraft.current)) {
      if (currentSavePhase === "saved") {
        return;
      }

      if (currentSavePhase !== "idle") {
        clearSettingsFeedback();
      }
      return;
    }

    const validationResult = appSettingsSchema.safeParse(draft);
    if (!validationResult.success) {
      setSettingsValidationErrors(
        mapSettingsValidationErrors(validationResult.error.issues)
      );
      setSettingsSaveErrorMessage(null);
      setSettingsSavePhase("invalid");
      return;
    }

    setSettingsValidationErrors({});
    setSettingsSaveErrorMessage(null);
    if (currentSavePhase !== "pending") {
      setSettingsSavePhase("pending");
    }

    const timer = setTimeout(() => {
      void runAsyncTask(() => handleUpdateSettings(validationResult.data), {
        onError: () => {
          setSettingsSavePhase("error");
          setSettingsSaveErrorMessage(
            "Could not save settings. Your changes are still on screen."
          );
        },
        onStart: () => {
          setSettingsSavePhase("saving");
        },
        onSuccess: (savedSettings) => {
          lastSavedDraft.current = savedSettings;
          setSettingsSavePhase("saved");
          setSettingsSaveErrorMessage(null);
        },
      });
    }, 600);

    return () => clearTimeout(timer);
  }, [
    clearSettingsFeedback,
    handleUpdateSettings,
    setSettingsSaveErrorMessage,
    setSettingsSavePhase,
    setSettingsValidationErrors,
    settingsDraft,
  ]);
}

function useAppLifecycleEffects({
  bootApp,
  bootPhase,
  loadWeeklyReviewOverview,
  openWeeklyReviewSpotlight,
  setSystemTheme,
  settingsDraft,
  systemTheme,
  todayState,
  weeklyReviewOverview,
  weeklyReviewPhase,
}: {
  bootApp: ReturnType<typeof useAppControllerActions>["bootApp"];
  bootPhase: AppControllerState["bootPhase"];
  loadWeeklyReviewOverview: ReturnType<
    typeof useAppControllerActions
  >["loadWeeklyReviewOverview"];
  openWeeklyReviewSpotlight: ReturnType<
    typeof useAppControllerActions
  >["openWeeklyReviewSpotlight"];
  setSystemTheme: ReturnType<typeof useAppControllerActions>["setSystemTheme"];
  settingsDraft: AppSettings | null;
  systemTheme: ReturnType<typeof useAppControllerCoreState>["systemTheme"];
  todayState: AppControllerState["todayState"];
  weeklyReviewOverview: AppControllerState["weeklyReviewOverview"];
  weeklyReviewPhase: AppControllerState["weeklyReviewPhase"];
}) {
  const savedPomodoroSettings = todayState
    ? getPomodoroTimerSettings(todayState.settings)
    : null;

  useEffect(() => {
    void bootApp();
  }, [bootApp]);

  useEffect(() => {
    if (bootPhase !== "ready" || weeklyReviewPhase !== "idle") {
      return;
    }

    void loadWeeklyReviewOverview();
  }, [bootPhase, loadWeeklyReviewOverview, weeklyReviewPhase]);

  useEffect(() => {
    const latestReview = weeklyReviewOverview?.latestReview ?? null;
    if (
      !shouldOpenWeeklyReviewSpotlight({
        bootPhase,
        lastSeenWeeklyReviewStart: readLastSeenWeeklyReviewStart(),
        latestReview,
        todayKey: todayState?.date ?? null,
        weeklyReviewPhase,
      })
    ) {
      return;
    }

    openWeeklyReviewSpotlight();
  }, [
    bootPhase,
    openWeeklyReviewSpotlight,
    todayState?.date,
    weeklyReviewOverview?.latestReview,
    weeklyReviewPhase,
  ]);

  useEffect(() => {
    setSystemTheme(systemTheme);
  }, [setSystemTheme, systemTheme]);

  useEffect(() => {
    if (!savedPomodoroSettings) {
      return;
    }

    writePomodoroTimerSettings(savedPomodoroSettings);
  }, [
    savedPomodoroSettings,
    savedPomodoroSettings?.focusDefaultDurationSeconds,
    savedPomodoroSettings?.focusCyclesBeforeLongBreak,
    savedPomodoroSettings?.focusLongBreakSeconds,
    savedPomodoroSettings?.focusShortBreakSeconds,
  ]);

  useApplyThemeMode({
    systemTheme,
    themeMode: (settingsDraft ?? todayState?.settings)?.themeMode ?? "system",
  });
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
