import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";

import { appSettingsSchema } from "@/shared/contracts/habits-ipc-schema";
import type { AppSettings } from "@/shared/domain/settings";

import { useAppStore } from "./store";

export function useAppController() {
  const {
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
    reloadAll,
    setSystemTheme,
    settingsDraft,
    systemTheme,
    tab,
    todayState,
  } = useAppStore(
    useShallow((state) => ({
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
      reloadAll: state.reloadAll,
      setSystemTheme: state.setSystemTheme,
      settingsDraft: state.settingsDraft,
      systemTheme: state.systemTheme,
      tab: state.tab,
      todayState: state.todayState,
    }))
  );

  const lastSavedDraft = useRef<AppSettings | null>(null);

  useEffect(() => {
    const draft = settingsDraft;
    if (!draft) {
      return;
    }

    if (lastSavedDraft.current === null) {
      lastSavedDraft.current = draft;
      return;
    }
    if (draft === lastSavedDraft.current) {
      return;
    }

    const timer = setTimeout(async () => {
      const validationResult = appSettingsSchema.safeParse(draft);
      if (!validationResult.success) {
        return;
      }

      try {
        const savedSettings = await handleUpdateSettings(validationResult.data);
        lastSavedDraft.current = savedSettings;
      } catch (error: unknown) {
        console.error("Failed to save app settings", error);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [handleUpdateSettings, settingsDraft]);

  useEffect(() => {
    void reloadAll();
  }, [reloadAll]);

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
      handleSettingsDraftChange,
      handleTabChange,
      handleToggleHabit,
      handleUpdateHabitCategory,
      handleUpdateHabitFrequency,
    },
    state: {
      history,
      settingsDraft,
      todayState,
    },
    tab,
  };
}
