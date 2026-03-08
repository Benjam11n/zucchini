import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";

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
    clearSettingsFeedback,
    handleArchiveHabit,
    handleCreateHabit,
    handleRenameHabit,
    handleReorderHabits,
    handleSettingsDraftChange,
    handleTabChange,
    handleToggleHabit,
    handleUpdateHabitCategory,
    handleUpdateHabitFrequency,
    handleUpdateSettings,
    history,
    retryBoot,
    setSettingsSaveErrorMessage,
    setSettingsSavePhase,
    setSettingsValidationErrors,
    setSystemTheme,
    settingsFieldErrors,
    settingsDraft,
    settingsSaveErrorMessage,
    settingsSavePhase,
    systemTheme,
    tab,
    todayState,
  } = useAppStore(
    useShallow((state) => ({
      bootApp: state.bootApp,
      bootError: state.bootError,
      bootPhase: state.bootPhase,
      clearSettingsFeedback: state.clearSettingsFeedback,
      handleArchiveHabit: state.handleArchiveHabit,
      handleCreateHabit: state.handleCreateHabit,
      handleRenameHabit: state.handleRenameHabit,
      handleReorderHabits: state.handleReorderHabits,
      handleSettingsDraftChange: state.handleSettingsDraftChange,
      handleTabChange: state.handleTabChange,
      handleToggleHabit: state.handleToggleHabit,
      handleUpdateHabitCategory: state.handleUpdateHabitCategory,
      handleUpdateHabitFrequency: state.handleUpdateHabitFrequency,
      handleUpdateSettings: state.handleUpdateSettings,
      history: state.history,
      retryBoot: state.retryBoot,
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
      handleArchiveHabit,
      handleCreateHabit,
      handleRenameHabit,
      handleReorderHabits,
      handleRetryBoot: retryBoot,
      handleSettingsDraftChange,
      handleTabChange,
      handleToggleHabit,
      handleUpdateHabitCategory,
      handleUpdateHabitFrequency,
    },
    state: {
      bootError,
      bootPhase,
      history,
      settingsDraft,
      settingsFieldErrors,
      settingsSaveErrorMessage,
      settingsSavePhase,
      todayState,
    },
    tab,
  };
}
