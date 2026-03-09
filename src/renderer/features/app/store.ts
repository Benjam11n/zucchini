import { create } from "zustand";

import { toHabitsIpcError } from "@/shared/contracts/habits-ipc";
import type { HabitsIpcError, TodayState } from "@/shared/contracts/habits-ipc";
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
import { loadWeeklyReviewState } from "./weekly-review-state";

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
  loadWeeklyReviewOverview: () => Promise<void>;
  selectWeeklyReview: (weekStart: string) => Promise<void>;
  openWeeklyReviewSpotlight: () => void;
  dismissWeeklyReviewSpotlight: () => void;

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
        isWeeklyReviewSpotlightOpen: false,
        selectedWeeklyReview: null,
        settingsDraft: null,
        todayState: null,
        weeklyReviewError: null,
        weeklyReviewOverview: null,
        weeklyReviewPhase: "idle",
      });
    }
  },

  bootError: null,

  bootPhase: "loading",

  clearSettingsFeedback: () =>
    set({
      settingsFieldErrors: {},
      settingsSaveErrorMessage: null,
      settingsSavePhase: "idle",
    }),

  dismissWeeklyReviewSpotlight: () =>
    set({
      isWeeklyReviewSpotlightOpen: false,
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

  isWeeklyReviewSpotlightOpen: false,

  loadWeeklyReviewOverview: async () => {
    set({
      weeklyReviewError: null,
      weeklyReviewPhase: "loading",
    });

    try {
      const weeklyReviewState = await loadWeeklyReviewState(
        window.habits,
        get().selectedWeeklyReview
      );
      set({
        selectedWeeklyReview: weeklyReviewState.selectedWeeklyReview,
        weeklyReviewError: null,
        weeklyReviewOverview: weeklyReviewState.overview,
        weeklyReviewPhase: "ready",
      });
    } catch (error) {
      set({
        selectedWeeklyReview: null,
        weeklyReviewError: toHabitsIpcError(error),
        weeklyReviewOverview: null,
        weeklyReviewPhase: "error",
      });
    }
  },

  openWeeklyReviewSpotlight: () =>
    set({
      isWeeklyReviewSpotlightOpen: true,
    }),

  refreshToday: async (mutator: Promise<TodayState>) => {
    const nextTodayState = await mutator;
    await get().reloadAll(nextTodayState);
    if (get().weeklyReviewPhase !== "idle") {
      await get().loadWeeklyReviewOverview();
    }
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
  selectWeeklyReview: async (weekStart: string) => {
    const currentReview = get().selectedWeeklyReview;
    if (currentReview?.weekStart === weekStart) {
      return;
    }

    set({
      weeklyReviewError: null,
      weeklyReviewPhase: "loading",
    });

    try {
      const selectedWeeklyReview =
        await window.habits.getWeeklyReview(weekStart);
      set({
        selectedWeeklyReview,
        weeklyReviewError: null,
        weeklyReviewPhase: "ready",
      });
    } catch (error) {
      set({
        weeklyReviewError: toHabitsIpcError(error),
        weeklyReviewPhase: "error",
      });
    }
  },
  selectedWeeklyReview: null,
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
  weeklyReviewError: null,
  weeklyReviewOverview: null,
  weeklyReviewPhase: "idle",
}));
