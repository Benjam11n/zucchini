import { useEffect, useRef, useState } from "react";

import type { TodayState } from "@/shared/contracts/habits-ipc";
import { appSettingsSchema } from "@/shared/contracts/habits-ipc-schema";
import type {
  HabitCategory,
  HabitFrequency,
  HabitWithStatus,
} from "@/shared/domain/habit";
import type { AppSettings, ThemeMode } from "@/shared/domain/settings";

import type { AppState, Tab } from "./types";

function getSystemTheme(): ThemeMode {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function useAppController() {
  const [tab, setTab] = useState<Tab>("today");
  const [systemTheme, setSystemTheme] = useState<ThemeMode>(getSystemTheme);
  const [state, setState] = useState<AppState>({
    history: [],
    settingsDraft: null,
    todayState: null,
  });

  async function reloadAll(nextTodayState?: TodayState): Promise<void> {
    const todayState = nextTodayState ?? (await window.habits.getTodayState());
    const history = await window.habits.getHistory();

    setState((current) => ({
      history,
      settingsDraft: current.settingsDraft ?? todayState.settings,
      todayState,
    }));
  }

  async function refreshToday(mutator: Promise<TodayState>): Promise<void> {
    const nextTodayState = await mutator;
    await reloadAll(nextTodayState);
  }

  async function handleToggleHabit(habitId: number): Promise<void> {
    await refreshToday(window.habits.toggleHabit(habitId));
  }

  async function handleUpdateSettings(settings: AppSettings): Promise<void> {
    const nextSettings = await window.habits.updateSettings(settings);

    setState((current) => ({
      history: current.history,
      settingsDraft: nextSettings,
      todayState: current.todayState
        ? {
            ...current.todayState,
            settings: nextSettings,
          }
        : current.todayState,
    }));
  }

  const lastSavedDraft = useRef<AppSettings | null>(null);
  useEffect(() => {
    const draft = state.settingsDraft;
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
        await handleUpdateSettings(validationResult.data);
        lastSavedDraft.current = draft;
      } catch (error: unknown) {
        console.error("Failed to save app settings", error);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [state.settingsDraft]);

  async function handleCreateHabit(
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency
  ): Promise<void> {
    await refreshToday(window.habits.createHabit(name, category, frequency));
    setState((current) => ({
      ...current,
      settingsDraft: current.todayState?.settings ?? current.settingsDraft,
    }));
  }

  async function handleRenameHabit(
    habitId: number,
    name: string
  ): Promise<void> {
    await refreshToday(window.habits.renameHabit(habitId, name));
  }

  async function handleUpdateHabitCategory(
    habitId: number,
    category: HabitCategory
  ): Promise<void> {
    await refreshToday(window.habits.updateHabitCategory(habitId, category));
  }

  async function handleUpdateHabitFrequency(
    habitId: number,
    frequency: HabitFrequency
  ): Promise<void> {
    await refreshToday(window.habits.updateHabitFrequency(habitId, frequency));
  }

  async function handleArchiveHabit(habitId: number): Promise<void> {
    await refreshToday(window.habits.archiveHabit(habitId));
  }

  async function handleReorderHabits(
    nextHabits: HabitWithStatus[]
  ): Promise<void> {
    await refreshToday(
      window.habits.reorderHabits(nextHabits.map((habit) => habit.id))
    );
  }

  function handleTabChange(nextTab: Tab): void {
    setTab(nextTab);

    if (nextTab !== "settings") {
      return;
    }

    setState((current) => ({
      ...current,
      settingsDraft: current.todayState?.settings ?? current.settingsDraft,
    }));
  }

  useEffect(() => {
    void reloadAll();
  }, []);

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
  }, []);

  useEffect(() => {
    const preferredTheme =
      (state.settingsDraft ?? state.todayState?.settings)?.themeMode ??
      "system";
    const resolvedTheme =
      preferredTheme === "system" ? systemTheme : preferredTheme;

    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  }, [state.settingsDraft, state.todayState, systemTheme]);

  function handleSettingsDraftChange(settingsDraft: AppSettings): void {
    setState((current) => ({
      ...current,
      settingsDraft,
    }));
  }

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
    state,
    tab,
  };
}
