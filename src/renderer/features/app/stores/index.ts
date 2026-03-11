import { resetBootStore, useBootStore } from "./boot-store";
import { resetFocusStore, useFocusStore } from "./focus-store";
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
export { useFocusStore };
export { useHistoryStore };
export { useOnboardingStore };
export { useSettingsStore };
export { useTodayStore };
export type {
  BootStoreState,
  FocusStoreState,
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
  resetFocusStore();
  resetHistoryStore();
  resetOnboardingStore();
  resetSettingsStore();
  resetTodayStore();
  resetUiStore();
  resetWeeklyReviewStore();
}
