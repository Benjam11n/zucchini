import { resetBootStore, useBootStore } from "./boot-store";
import { resetHistoryStore, useHistoryStore } from "./history-store";
import { resetOnboardingStore, useOnboardingStore } from "./onboarding-store";
import { resetSettingsStore, useSettingsStore } from "./settings-store";
import { resetTodayStore, useTodayStore } from "./today-store";
import { resetUiStore, useUiStore } from "./ui-store";
import {
  resetWeeklyReviewStore,
  useWeeklyReviewStore,
} from "./weekly-review-store";

export { useBootStore };
export { useHistoryStore };
export { useOnboardingStore };
export { useSettingsStore };
export { useTodayStore };
export type {
  BootStoreState,
  HistoryStoreState,
  OnboardingStoreState,
  SettingsStoreState,
  TodayStoreState,
  UiStoreState,
  WeeklyReviewStoreState,
} from "./types";
export { useUiStore };
export { useWeeklyReviewStore };

export function resetAppStores() {
  resetBootStore();
  resetHistoryStore();
  resetOnboardingStore();
  resetSettingsStore();
  resetTodayStore();
  resetUiStore();
  resetWeeklyReviewStore();
}
