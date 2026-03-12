import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";

import { useBootStore } from "@/renderer/app/state/boot-store";
import { useUiStore } from "@/renderer/app/state/ui-store";
import { useFocusStore } from "@/renderer/features/focus/store";
import { useFocusTimer } from "@/renderer/features/focus/use-focus-timer";
import { useHistoryStore } from "@/renderer/features/history/store";
import { shouldOpenWeeklyReviewSpotlight } from "@/renderer/features/history/weekly-review-spotlight";
import {
  readLastSeenWeeklyReviewStart,
  writeLastSeenWeeklyReviewStart,
} from "@/renderer/features/history/weekly-review-storage";
import { useWeeklyReviewStore } from "@/renderer/features/history/weekly-review-store";
import { useOnboardingStore } from "@/renderer/features/onboarding/store";
import {
  areAppSettingsEqual,
  mapSettingsValidationErrors,
} from "@/renderer/features/settings/save";
import { useSettingsStore } from "@/renderer/features/settings/store";
import { useTodayStore } from "@/renderer/features/today/store";
import { runAsyncTask } from "@/renderer/shared/lib/async-task";
import { appSettingsSchema } from "@/shared/contracts/habits-ipc-schema";
import type { AppSettings } from "@/shared/domain/settings";

import { appActions } from "./app-actions";
import type { AppState, SettingsFieldErrors } from "./types";

const EMPTY_HISTORY: AppState["history"] = [];
const EMPTY_FOCUS_SESSIONS: AppState["focusSessions"] = [];
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

function useHistoryState() {
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
  const tab = useUiStore((state) => state.tab);

  return useWeeklyReviewStore(
    useShallow((state) =>
      tab === "history"
        ? {
            selectedWeeklyReview: state.selectedWeeklyReview,
            weeklyReviewError: state.weeklyReviewError,
          }
        : null
    )
  );
}

function useFocusPageState() {
  const tab = useUiStore((state) => state.tab);

  return useFocusStore(
    useShallow((state) =>
      tab === "focus"
        ? {
            focusSaveErrorMessage: state.focusSaveErrorMessage,
            focusSessions: state.focusSessions,
            focusSessionsLoadError: state.focusSessionsLoadError,
            focusSessionsPhase: state.focusSessionsPhase,
            timerState: state.timerState,
          }
        : null
    )
  );
}

function useSettingsPageState() {
  const tab = useUiStore((state) => state.tab);

  return useSettingsStore(
    useShallow((state) =>
      tab === "settings"
        ? {
            settingsFieldErrors: state.settingsFieldErrors,
            settingsSaveErrorMessage: state.settingsSaveErrorMessage,
            settingsSavePhase: state.settingsSavePhase,
          }
        : null
    )
  );
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
  historyState: ReturnType<typeof useHistoryState>
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
  settingsSavePhase: AppState["settingsSavePhase"];
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
  bootPhase: AppState["bootPhase"];
  loadWeeklyReviewOverview: ReturnType<
    typeof useAppControllerActions
  >["loadWeeklyReviewOverview"];
  openWeeklyReviewSpotlight: ReturnType<
    typeof useAppControllerActions
  >["openWeeklyReviewSpotlight"];
  setSystemTheme: ReturnType<typeof useAppControllerActions>["setSystemTheme"];
  settingsDraft: AppSettings | null;
  systemTheme: ReturnType<typeof useAppControllerCoreState>["systemTheme"];
  todayState: AppState["todayState"];
  weeklyReviewOverview: AppState["weeklyReviewOverview"];
  weeklyReviewPhase: AppState["weeklyReviewPhase"];
}) {
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
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = () => {
      setSystemTheme(mediaQuery.matches ? "dark" : "light");
    };

    syncSystemTheme();
    mediaQuery.addEventListener("change", syncSystemTheme);

    return () => {
      mediaQuery.removeEventListener("change", syncSystemTheme);
    };
  }, [setSystemTheme]);

  useEffect(() => {
    const preferredTheme =
      (settingsDraft ?? todayState?.settings)?.themeMode ?? "system";
    const resolvedTheme =
      preferredTheme === "system" ? systemTheme : preferredTheme;

    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  }, [settingsDraft, systemTheme, todayState]);
}

export function useAppController() {
  const tab = useUiStore((state) => state.tab);
  const actions = useAppControllerActions();
  const coreState = useAppControllerCoreState();
  const weeklyReviewState = useWeeklyReviewState();
  const historyState = useHistoryState();
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
    systemTheme: coreState.systemTheme,
    todayState: coreState.todayState,
    weeklyReviewOverview: weeklyReviewState.weeklyReviewOverview,
    weeklyReviewPhase: weeklyReviewState.weeklyReviewPhase,
  });

  useFocusTimer({
    clearFocusSaveError: actions.clearFocusSaveError,
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
