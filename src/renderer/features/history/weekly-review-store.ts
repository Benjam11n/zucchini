import { create } from "zustand";

import type { WeeklyReviewStoreState } from "@/renderer/app/state/types";
import { loadWeeklyReviewState } from "@/renderer/features/history/weekly-review-state";
import { runAsyncTask } from "@/renderer/shared/lib/async-task";
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
      await runAsyncTask(
        () => loadWeeklyReviewState(window.habits, get().selectedWeeklyReview),
        {
          mapError: toHabitsIpcError,
          onError: (weeklyReviewError) => {
            set({
              selectedWeeklyReview: null,
              weeklyReviewError,
              weeklyReviewOverview: null,
              weeklyReviewPhase: "error",
            });
          },
          onStart: () => {
            set({
              weeklyReviewError: null,
              weeklyReviewPhase: "loading",
            });
          },
          onSuccess: (weeklyReviewState) => {
            set({
              selectedWeeklyReview: weeklyReviewState.selectedWeeklyReview,
              weeklyReviewError: null,
              weeklyReviewOverview: weeklyReviewState.overview,
              weeklyReviewPhase: "ready",
            });
          },
        }
      );
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

      await runAsyncTask(() => window.habits.getWeeklyReview(weekStart), {
        mapError: toHabitsIpcError,
        onError: (weeklyReviewError) => {
          set({
            weeklyReviewError,
            weeklyReviewPhase: "error",
          });
        },
        onStart: () => {
          set({
            weeklyReviewError: null,
            weeklyReviewPhase: "loading",
          });
        },
        onSuccess: (selectedWeeklyReview) => {
          set({
            selectedWeeklyReview,
            weeklyReviewError: null,
            weeklyReviewPhase: "ready",
          });
        },
      });
    },
  })
);

export function resetWeeklyReviewStore() {
  useWeeklyReviewStore.setState(getInitialWeeklyReviewState());
}
