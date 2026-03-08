import { create } from "zustand";

import {
  toHabitsIpcError,
  type HabitsIpcError,
  type TodayState,
} from "@/shared/contracts/habits-ipc";
import type {
  HabitCategory,
  HabitFrequency,
  HabitWithStatus,
} from "@/shared/domain/habit";
import type { AppSettings, ThemeMode } from "@/shared/domain/settings";

import type {
  AppState,
  SettingsFieldErrors,
  SettingsSavePhase,
  Tab,
} from "./types";

interface UseAppStoreState extends AppState {
  systemTheme: ThemeMode;
  tab: Tab;

  // State Setters
  setBootError: (error: HabitsIpcError | null) => void;
  setBootPhase: (phase: AppState["bootPhase"]) => void;
  setHistory: (history: AppState["history"]) => void;
  setSettingsDraft: (settingsDraft: AppSettings | null) => void;
  setSettingsSaveErrorMessage: (message: string | null) => void;
  setSettingsSavePhase: (phase: SettingsSavePhase) => void;
  setSettingsValidationErrors: (errors: SettingsFieldErrors) => void;
  setSystemTheme: (systemTheme: ThemeMode) => void;
  setTab: (tab: Tab) => void;
  setTodayState: (todayState: TodayState | null) => void;

  // Actions
  bootApp: () => Promise<void>;
  clearSettingsFeedback: () => void;
  handleArchiveHabit: (habitId: number) => Promise<void>;
  handleCreateHabit: (
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency
  ) => Promise<void>;
  handleRenameHabit: (habitId: number, name: string) => Promise<void>;
  handleReorderHabits: (nextHabits: HabitWithStatus[]) => Promise<void>;
  handleSettingsDraftChange: (settingsDraft: AppSettings) => void;
  handleTabChange: (nextTab: Tab) => void;
  handleToggleHabit: (habitId: number) => Promise<void>;
  handleUpdateHabitCategory: (
    habitId: number,
    category: HabitCategory
  ) => Promise<void>;
  handleUpdateHabitFrequency: (
    habitId: number,
    frequency: HabitFrequency
  ) => Promise<void>;
  handleUpdateSettings: (settings: AppSettings) => Promise<AppSettings>;

  refreshToday: (mutator: Promise<TodayState>) => Promise<void>;
  reloadAll: (nextTodayState?: TodayState) => Promise<void>;
  retryBoot: () => Promise<void>;
}

function getSystemTheme(): ThemeMode {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export const useAppStore = create<UseAppStoreState>()((set, get) => ({
  bootApp: async () => {
    set({
      bootError: null,
      bootPhase: "loading",
    });

    try {
      await get().reloadAll();
      set({
        bootPhase: "ready",
      });
    } catch (error: unknown) {
      set({
        bootError: toHabitsIpcError(error),
        bootPhase: "error",
        history: [],
        settingsDraft: null,
        todayState: null,
      });
    }
  },

  clearSettingsFeedback: () =>
    set({
      settingsFieldErrors: {},
      settingsSaveErrorMessage: null,
      settingsSavePhase: "idle",
    }),

  handleArchiveHabit: async (habitId: number) => {
    await get().refreshToday(window.habits.archiveHabit(habitId));
  },

  handleCreateHabit: async (
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency
  ) => {
    await get().refreshToday(
      window.habits.createHabit(name, category, frequency)
    );
    set((state: UseAppStoreState) => ({
      settingsDraft: state.todayState?.settings ?? state.settingsDraft,
    }));
  },

  handleRenameHabit: async (habitId: number, name: string) => {
    await get().refreshToday(window.habits.renameHabit(habitId, name));
  },

  handleReorderHabits: async (nextHabits: HabitWithStatus[]) => {
    await get().refreshToday(
      window.habits.reorderHabits(nextHabits.map((habit) => habit.id))
    );
  },

  handleSettingsDraftChange: (settingsDraft: AppSettings) => {
    set({
      settingsDraft,
      settingsSaveErrorMessage: null,
    });
  },

  handleTabChange: (nextTab: Tab) => {
    set({ tab: nextTab });
    if (nextTab === "settings") {
      set((state: UseAppStoreState) => ({
        settingsDraft: state.todayState?.settings ?? state.settingsDraft,
      }));
    }
  },

  handleToggleHabit: async (habitId: number) => {
    await get().refreshToday(window.habits.toggleHabit(habitId));
  },

  handleUpdateHabitCategory: async (
    habitId: number,
    category: HabitCategory
  ) => {
    await get().refreshToday(
      window.habits.updateHabitCategory(habitId, category)
    );
  },

  handleUpdateHabitFrequency: async (
    habitId: number,
    frequency: HabitFrequency
  ) => {
    await get().refreshToday(
      window.habits.updateHabitFrequency(habitId, frequency)
    );
  },

  handleUpdateSettings: async (settings: AppSettings) => {
    const nextSettings = await window.habits.updateSettings(settings);
    set((state: UseAppStoreState) => ({
      settingsDraft: nextSettings,
      settingsFieldErrors: {},
      settingsSaveErrorMessage: null,
      todayState: state.todayState
        ? {
            ...state.todayState,
            settings: nextSettings,
          }
        : state.todayState,
    }));

    return nextSettings;
  },

  history: [],

  refreshToday: async (mutator: Promise<TodayState>) => {
    const nextTodayState = await mutator;
    await get().reloadAll(nextTodayState);
  },

  reloadAll: async (nextTodayState?: TodayState) => {
    const todayState = nextTodayState ?? (await window.habits.getTodayState());
    const history = await window.habits.getHistory();
    set((state: UseAppStoreState) => ({
      history,
      settingsDraft: state.settingsDraft ?? todayState.settings,
      todayState,
    }));
  },

  retryBoot: async () => {
    await get().bootApp();
  },

  bootError: null,
  bootPhase: "loading",
  setBootError: (bootError: HabitsIpcError | null) => set({ bootError }),
  setBootPhase: (bootPhase: AppState["bootPhase"]) => set({ bootPhase }),
  setHistory: (history: AppState["history"]) => set({ history }),
  setSettingsDraft: (settingsDraft: AppSettings | null) =>
    set({ settingsDraft }),
  setSettingsSaveErrorMessage: (settingsSaveErrorMessage: string | null) =>
    set({ settingsSaveErrorMessage }),
  setSettingsSavePhase: (settingsSavePhase: SettingsSavePhase) =>
    set({ settingsSavePhase }),
  setSettingsValidationErrors: (settingsFieldErrors: SettingsFieldErrors) =>
    set({ settingsFieldErrors }),
  setSystemTheme: (systemTheme: ThemeMode) => set({ systemTheme }),
  setTab: (tab: Tab) => set({ tab }),
  setTodayState: (todayState: TodayState | null) => set({ todayState }),

  settingsDraft: null,
  settingsFieldErrors: {},
  settingsSaveErrorMessage: null,
  settingsSavePhase: "idle",
  systemTheme: getSystemTheme(),
  tab: "today",
  todayState: null,
}));
