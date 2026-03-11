import type { TodayState } from "@/shared/contracts/habits-ipc";
import type { AppSettings, ThemeMode } from "@/shared/domain/settings";

import type {
  AppState,
  SettingsFieldErrors,
  SettingsSavePhase,
  Tab,
} from "../types";

export interface BootStoreState {
  bootError: AppState["bootError"];
  bootPhase: AppState["bootPhase"];
  setBootError: (error: AppState["bootError"]) => void;
  setBootPhase: (phase: AppState["bootPhase"]) => void;
}

export interface OnboardingStoreState {
  isOnboardingOpen: AppState["isOnboardingOpen"];
  onboardingError: AppState["onboardingError"];
  onboardingPhase: AppState["onboardingPhase"];
  onboardingStatus: AppState["onboardingStatus"];
  clearOnboardingError: () => void;
  setOnboardingError: (error: AppState["onboardingError"]) => void;
  setOnboardingPhase: (phase: AppState["onboardingPhase"]) => void;
  setOnboardingStatus: (status: AppState["onboardingStatus"]) => void;
}

export interface SettingsStoreState {
  settingsDraft: AppState["settingsDraft"];
  settingsFieldErrors: AppState["settingsFieldErrors"];
  settingsSaveErrorMessage: AppState["settingsSaveErrorMessage"];
  settingsSavePhase: AppState["settingsSavePhase"];
  clearSettingsFeedback: () => void;
  handleSettingsDraftChange: (settingsDraft: AppSettings) => void;
  setSettingsDraft: (settingsDraft: AppSettings | null) => void;
  setSettingsSaveErrorMessage: (message: string | null) => void;
  setSettingsSavePhase: (phase: SettingsSavePhase) => void;
  setSettingsValidationErrors: (errors: SettingsFieldErrors) => void;
}

export interface HistoryStoreState {
  history: AppState["history"];
  historyLoadError: AppState["historyLoadError"];
  historyScope: AppState["historyScope"];
  isHistoryLoading: AppState["isHistoryLoading"];
  loadFullHistory: () => Promise<void>;
  setHistory: (history: AppState["history"]) => void;
}

export interface WeeklyReviewStoreState {
  isWeeklyReviewSpotlightOpen: AppState["isWeeklyReviewSpotlightOpen"];
  selectedWeeklyReview: AppState["selectedWeeklyReview"];
  weeklyReviewError: AppState["weeklyReviewError"];
  weeklyReviewOverview: AppState["weeklyReviewOverview"];
  weeklyReviewPhase: AppState["weeklyReviewPhase"];
  dismissWeeklyReviewSpotlight: () => void;
  loadWeeklyReviewOverview: () => Promise<void>;
  openWeeklyReviewSpotlight: () => void;
  selectWeeklyReview: (weekStart: string) => Promise<void>;
}

export interface TodayStoreState {
  todayState: TodayState | null;
  setTodayState: (todayState: TodayState | null) => void;
}

export interface UiStoreState {
  systemTheme: ThemeMode;
  tab: Tab;
  setSystemTheme: (systemTheme: ThemeMode) => void;
  setTab: (tab: Tab) => void;
}
