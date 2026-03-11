import { create } from "zustand";

import type { WeeklyReviewStoreState } from "@/renderer/app/state/types";
import { loadWeeklyReviewState } from "@/renderer/features/history/weekly-review-state";
import { toHabitsIpcError } from "@/shared/contracts/habits-ipc";

function getInitialWeeklyReviewState(): Pick<
  WeeklyReviewStoreState,
  | "isWeeklyReviewSpotlightOpen"
  | "selectedWeeklyReview"
  | "weeklyReviewError"
  | "weeklyReviewOverview"
  | "weeklyReviewPhase"
> {
  return {
    isWeeklyReviewSpotlightOpen: false,
    selectedWeeklyReview: null,
    weeklyReviewError: null,
    weeklyReviewOverview: null,
    weeklyReviewPhase: "idle",
  };
}

export const useWeeklyReviewStore = create<WeeklyReviewStoreState>()(
  (set, get) => ({
    ...getInitialWeeklyReviewState(),
    dismissWeeklyReviewSpotlight: () =>
      set({
        isWeeklyReviewSpotlightOpen: false,
      }),
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
  })
);

export function resetWeeklyReviewStore() {
  useWeeklyReviewStore.setState(getInitialWeeklyReviewState());
}
