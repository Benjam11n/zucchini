import { useEffect, useRef } from "react";

import { appSettingsSchema } from "@/shared/contracts/habits-ipc-schema";
import type { AppSettings } from "@/shared/domain/settings";

import { useAppStore } from "./store";

export function useAppController() {
  const store = useAppStore();

  const lastSavedDraft = useRef<AppSettings | null>(null);

  useEffect(() => {
    const draft = store.settingsDraft;
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
        await store.handleUpdateSettings(validationResult.data);
        lastSavedDraft.current = draft;
      } catch (error: unknown) {
        console.error("Failed to save app settings", error);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [store]);

  useEffect(() => {
    void store.reloadAll();
  }, [store]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = () => {
      store.setSystemTheme(mediaQuery.matches ? "dark" : "light");
    };

    syncSystemTheme();
    mediaQuery.addEventListener("change", syncSystemTheme);

    return () => {
      mediaQuery.removeEventListener("change", syncSystemTheme);
    };
  }, [store]);

  useEffect(() => {
    const preferredTheme =
      (store.settingsDraft ?? store.todayState?.settings)?.themeMode ??
      "system";
    const resolvedTheme =
      preferredTheme === "system" ? store.systemTheme : preferredTheme;

    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  }, [store.settingsDraft, store.todayState, store.systemTheme]);

  return {
    actions: {
      handleArchiveHabit: store.handleArchiveHabit,
      handleCreateHabit: store.handleCreateHabit,
      handleRenameHabit: store.handleRenameHabit,
      handleReorderHabits: store.handleReorderHabits,
      handleSettingsDraftChange: store.handleSettingsDraftChange,
      handleTabChange: store.handleTabChange,
      handleToggleHabit: store.handleToggleHabit,
      handleUpdateHabitCategory: store.handleUpdateHabitCategory,
      handleUpdateHabitFrequency: store.handleUpdateHabitFrequency,
    },
    state: {
      history: store.history,
      settingsDraft: store.settingsDraft,
      todayState: store.todayState,
    },
    tab: store.tab,
  };
}
