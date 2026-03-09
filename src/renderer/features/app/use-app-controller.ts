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

export function useAppController() {
  const {
    bootApp,
    bootError,
    bootPhase,
    clearOnboardingError,
    clearSettingsFeedback,
    dismissWeeklyReviewSpotlight,
    handleArchiveHabit,
    handleApplyStarterPack,
    handleCompleteOnboarding,
    handleCreateHabit,
    handleRenameHabit,
    handleReorderHabits,
    handleSettingsDraftChange,
    handleSkipOnboarding,
    handleTabChange,
    handleToggleHabit,
    handleUpdateHabitCategory,
    handleUpdateHabitFrequency,
    handleUpdateSettings,
    history,
    isOnboardingOpen,
    isWeeklyReviewSpotlightOpen,
    onboardingError,
    onboardingPhase,
    onboardingStatus,
    loadWeeklyReviewOverview,
    openWeeklyReviewSpotlight,
    retryBoot,
    selectWeeklyReview,
    setSettingsSaveErrorMessage,
    setSettingsSavePhase,
    setSettingsValidationErrors,
    setSystemTheme,
    settingsFieldErrors,
    settingsDraft,
    settingsSaveErrorMessage,
    settingsSavePhase,
    selectedWeeklyReview,
    systemTheme,
    tab,
    todayState,
    weeklyReviewError,
    weeklyReviewOverview,
    weeklyReviewPhase,
  } = useAppStore(
    useShallow((state) => ({
      bootApp: state.bootApp,
      bootError: state.bootError,
      bootPhase: state.bootPhase,
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
      history: state.history,
      isOnboardingOpen: state.isOnboardingOpen,
      isWeeklyReviewSpotlightOpen: state.isWeeklyReviewSpotlightOpen,
      loadWeeklyReviewOverview: state.loadWeeklyReviewOverview,
      onboardingError: state.onboardingError,
      onboardingPhase: state.onboardingPhase,
      onboardingStatus: state.onboardingStatus,
      openWeeklyReviewSpotlight: state.openWeeklyReviewSpotlight,
      retryBoot: state.retryBoot,
      selectWeeklyReview: state.selectWeeklyReview,
      selectedWeeklyReview: state.selectedWeeklyReview,
      setSettingsSaveErrorMessage: state.setSettingsSaveErrorMessage,
      setSettingsSavePhase: state.setSettingsSavePhase,
      setSettingsValidationErrors: state.setSettingsValidationErrors,
      setSystemTheme: state.setSystemTheme,
      settingsDraft: state.settingsDraft,
      settingsFieldErrors: state.settingsFieldErrors,
      settingsSaveErrorMessage: state.settingsSaveErrorMessage,
      settingsSavePhase: state.settingsSavePhase,
      systemTheme: state.systemTheme,
      tab: state.tab,
      todayState: state.todayState,
      weeklyReviewError: state.weeklyReviewError,
      weeklyReviewOverview: state.weeklyReviewOverview,
      weeklyReviewPhase: state.weeklyReviewPhase,
    }))
  );

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

  return {
    actions: {
      handleApplyStarterPack,
      handleArchiveHabit,
      handleClearOnboardingError: clearOnboardingError,
      handleCompleteOnboarding,
      handleCreateHabit,
      handleDismissWeeklyReviewSpotlight: () => {
        const latestReview = weeklyReviewOverview?.latestReview;
        if (latestReview) {
          writeLastSeenWeeklyReviewStart(latestReview.weekStart);
        }
        dismissWeeklyReviewSpotlight();
      },
      handleRenameHabit,
      handleReorderHabits,
      handleRetryBoot: retryBoot,
      handleSettingsDraftChange,
      handleSkipOnboarding,
      handleTabChange,
      handleToggleHabit,
      handleUpdateHabitCategory,
      handleUpdateHabitFrequency,
      handleWeeklyReviewOpen: async () => {
        const latestReview = weeklyReviewOverview?.latestReview;
        if (!latestReview) {
          dismissWeeklyReviewSpotlight();
          return;
        }

        writeLastSeenWeeklyReviewStart(latestReview.weekStart);
        dismissWeeklyReviewSpotlight();
        handleTabChange("history");
        await selectWeeklyReview(latestReview.weekStart);
      },
      handleWeeklyReviewSelect: async (weekStart: string) => {
        await selectWeeklyReview(weekStart);
      },
    },
    state: {
      bootError,
      bootPhase,
      history,
      isOnboardingOpen,
      isWeeklyReviewSpotlightOpen,
      onboardingError,
      onboardingPhase,
      onboardingStatus,
      selectedWeeklyReview,
      settingsDraft,
      settingsFieldErrors,
      settingsSaveErrorMessage,
      settingsSavePhase,
      todayState,
      weeklyReviewError,
      weeklyReviewOverview,
      weeklyReviewPhase,
    },
    tab,
  };
}
