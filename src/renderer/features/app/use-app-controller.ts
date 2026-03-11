import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";

import { shouldOpenWeeklyReviewSpotlight } from "@/renderer/features/history/weekly-review-spotlight";
import {
  readLastSeenWeeklyReviewStart,
  writeLastSeenWeeklyReviewStart,
} from "@/renderer/features/history/weekly-review-storage";
import { appSettingsSchema } from "@/shared/contracts/habits-ipc-schema";
import type { AppSettings } from "@/shared/domain/settings";

import {
  areAppSettingsEqual,
  mapSettingsValidationErrors,
} from "./settings-save";
import { useAppStore } from "./store";
import type { AppState, SettingsFieldErrors } from "./types";

const EMPTY_HISTORY: AppState["history"] = [];
const EMPTY_SETTINGS_FIELD_ERRORS: SettingsFieldErrors = {};

function useAppControllerActions() {
  return useAppStore(
    useShallow((state) => ({
      bootApp: state.bootApp,
      clearOnboardingError: state.clearOnboardingError,
      clearSettingsFeedback: state.clearSettingsFeedback,
      dismissWeeklyReviewSpotlight: state.dismissWeeklyReviewSpotlight,
      handleApplyStarterPack: state.handleApplyStarterPack,
      handleArchiveHabit: state.handleArchiveHabit,
      handleCompleteOnboarding: state.handleCompleteOnboarding,
      handleCreateHabit: state.handleCreateHabit,
      handleRenameHabit: state.handleRenameHabit,
      handleReorderHabits: state.handleReorderHabits,
      handleSettingsDraftChange: state.handleSettingsDraftChange,
      handleSkipOnboarding: state.handleSkipOnboarding,
      handleTabChange: state.handleTabChange,
      handleToggleHabit: state.handleToggleHabit,
      handleUpdateHabitCategory: state.handleUpdateHabitCategory,
      handleUpdateHabitFrequency: state.handleUpdateHabitFrequency,
      handleUpdateSettings: state.handleUpdateSettings,
      loadFullHistory: state.loadFullHistory,
      loadWeeklyReviewOverview: state.loadWeeklyReviewOverview,
      openWeeklyReviewSpotlight: state.openWeeklyReviewSpotlight,
      retryBoot: state.retryBoot,
      selectWeeklyReview: state.selectWeeklyReview,
      setSettingsSaveErrorMessage: state.setSettingsSaveErrorMessage,
      setSettingsSavePhase: state.setSettingsSavePhase,
      setSettingsValidationErrors: state.setSettingsValidationErrors,
      setSystemTheme: state.setSystemTheme,
    }))
  );
}

function useAppControllerCoreState() {
  return useAppStore(
    useShallow((state) => ({
      bootError: state.bootError,
      bootPhase: state.bootPhase,
      isOnboardingOpen: state.isOnboardingOpen,
      onboardingError: state.onboardingError,
      onboardingPhase: state.onboardingPhase,
      onboardingStatus: state.onboardingStatus,
      settingsDraft: state.settingsDraft,
      settingsSavePhase: state.settingsSavePhase,
      systemTheme: state.systemTheme,
      todayState: state.todayState,
    }))
  );
}

function useWeeklyReviewState() {
  return useAppStore(
    useShallow((state) => ({
      isWeeklyReviewSpotlightOpen: state.isWeeklyReviewSpotlightOpen,
      weeklyReviewOverview: state.weeklyReviewOverview,
      weeklyReviewPhase: state.weeklyReviewPhase,
    }))
  );
}

function useHistoryState() {
  return useAppStore(
    useShallow((state) =>
      state.tab === "settings"
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
  return useAppStore(
    useShallow((state) =>
      state.tab === "history"
        ? {
            selectedWeeklyReview: state.selectedWeeklyReview,
            weeklyReviewError: state.weeklyReviewError,
          }
        : null
    )
  );
}

function useSettingsPageState() {
  return useAppStore(
    useShallow((state) =>
      state.tab === "settings"
        ? {
            settingsFieldErrors: state.settingsFieldErrors,
            settingsSaveErrorMessage: state.settingsSaveErrorMessage,
            settingsSavePhase: state.settingsSavePhase,
          }
        : null
    )
  );
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

    const timer = setTimeout(async () => {
      try {
        setSettingsSavePhase("saving");
        const savedSettings = await handleUpdateSettings(validationResult.data);
        lastSavedDraft.current = savedSettings;
        setSettingsSavePhase("saved");
        setSettingsSaveErrorMessage(null);
      } catch {
        setSettingsSavePhase("error");
        setSettingsSaveErrorMessage(
          "Could not save settings. Your changes are still on screen."
        );
      }
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
  const tab = useAppStore((state) => state.tab);
  const actions = useAppControllerActions();
  const coreState = useAppControllerCoreState();
  const weeklyReviewState = useWeeklyReviewState();
  const historyState = useHistoryState();
  const historyPageState = useHistoryPageState();
  const settingsPageState = useSettingsPageState();

  const history = historyState?.history ?? EMPTY_HISTORY;
  const historyLoadError = historyState?.historyLoadError ?? null;
  const historyScope = historyState?.historyScope ?? "recent";
  const isHistoryLoading = historyState?.isHistoryLoading ?? false;
  const selectedWeeklyReview = historyPageState?.selectedWeeklyReview ?? null;
  const weeklyReviewError = historyPageState?.weeklyReviewError ?? null;
  const settingsFieldErrors =
    settingsPageState?.settingsFieldErrors ?? EMPTY_SETTINGS_FIELD_ERRORS;
  const settingsSaveErrorMessage =
    settingsPageState?.settingsSaveErrorMessage ?? null;
  const activeSettingsSavePhase =
    settingsPageState?.settingsSavePhase ?? coreState.settingsSavePhase;

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

  return {
    actions: {
      handleApplyStarterPack: actions.handleApplyStarterPack,
      handleArchiveHabit: actions.handleArchiveHabit,
      handleClearOnboardingError: actions.clearOnboardingError,
      handleCompleteOnboarding: actions.handleCompleteOnboarding,
      handleCreateHabit: actions.handleCreateHabit,
      handleDismissWeeklyReviewSpotlight: () => {
        const latestReview =
          weeklyReviewState.weeklyReviewOverview?.latestReview;
        if (latestReview) {
          writeLastSeenWeeklyReviewStart(latestReview.weekStart);
        }
        actions.dismissWeeklyReviewSpotlight();
      },
      handleRenameHabit: actions.handleRenameHabit,
      handleReorderHabits: actions.handleReorderHabits,
      handleRetryBoot: actions.retryBoot,
      handleRetryHistoryLoad: actions.loadFullHistory,
      handleSettingsDraftChange: actions.handleSettingsDraftChange,
      handleSkipOnboarding: actions.handleSkipOnboarding,
      handleTabChange: actions.handleTabChange,
      handleToggleHabit: actions.handleToggleHabit,
      handleUpdateHabitCategory: actions.handleUpdateHabitCategory,
      handleUpdateHabitFrequency: actions.handleUpdateHabitFrequency,
      handleWeeklyReviewOpen: async () => {
        const latestReview =
          weeklyReviewState.weeklyReviewOverview?.latestReview;
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
    },
    state: {
      bootError: coreState.bootError,
      bootPhase: coreState.bootPhase,
      history,
      historyLoadError,
      historyScope,
      isHistoryLoading,
      isOnboardingOpen: coreState.isOnboardingOpen,
      isWeeklyReviewSpotlightOpen:
        weeklyReviewState.isWeeklyReviewSpotlightOpen,
      onboardingError: coreState.onboardingError,
      onboardingPhase: coreState.onboardingPhase,
      onboardingStatus: coreState.onboardingStatus,
      selectedWeeklyReview,
      settingsDraft: coreState.settingsDraft,
      settingsFieldErrors,
      settingsSaveErrorMessage,
      settingsSavePhase: activeSettingsSavePhase,
      todayState: coreState.todayState,
      weeklyReviewError,
      weeklyReviewOverview: weeklyReviewState.weeklyReviewOverview,
      weeklyReviewPhase: weeklyReviewState.weeklyReviewPhase,
    },
    tab,
  };
}
