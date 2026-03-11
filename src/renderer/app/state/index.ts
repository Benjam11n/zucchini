import {
  resetFocusStore,
  useFocusStore,
} from "@/renderer/features/focus/store";
import {
  resetHistoryStore,
  useHistoryStore,
} from "@/renderer/features/history/store";
import {
  resetWeeklyReviewStore,
  useWeeklyReviewStore,
} from "@/renderer/features/history/weekly-review-store";
import {
  resetOnboardingStore,
  useOnboardingStore,
} from "@/renderer/features/onboarding/store";
import {
  resetSettingsStore,
  useSettingsStore,
} from "@/renderer/features/settings/store";
import {
  resetTodayStore,
  useTodayStore,
} from "@/renderer/features/today/store";

import { resetBootStore, useBootStore } from "./boot-store";
import { resetUiStore, useUiStore } from "./ui-store";

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
