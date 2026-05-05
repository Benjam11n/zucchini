/**
 * Weekly review Zustand store.
 *
 * Manages the weekly review overview loading, individual weekly review
 * selection, and the spotlight dialog visibility. Provides actions for
 * loading the overview, selecting a specific week, and opening/closing
 * the spotlight.
 */
import { create } from "zustand";

import type { WeeklyReviewPhase } from "@/renderer/features/history/history.types";
import { loadWeeklyReviewState } from "@/renderer/features/history/weekly-review/lib/weekly-review-state";
import { runAsyncTask } from "@/renderer/shared/lib/async-task";
import { habitsClient } from "@/renderer/shared/lib/habits-client";
import { toHabitsIpcError } from "@/shared/contracts/habits-ipc-errors";
import type { HabitsIpcError } from "@/shared/contracts/habits-ipc-errors";
import type {
  WeeklyReview,
  WeeklyReviewOverview,
} from "@/shared/domain/weekly-review";

interface WeeklyReviewStoreState {
  isWeeklyReviewSpotlightOpen: boolean;
  selectedWeeklyReview: WeeklyReview | null;
  weeklyReviewError: HabitsIpcError | null;
  weeklyReviewOverview: WeeklyReviewOverview | null;
  weeklyReviewPhase: WeeklyReviewPhase;
  dismissWeeklyReviewSpotlight: () => void;
  loadWeeklyReviewOverview: () => Promise<void>;
  openWeeklyReviewSpotlight: () => void;
  selectWeeklyReview: (weekStart: string) => Promise<void>;
}

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
        () => loadWeeklyReviewState(habitsClient, get().selectedWeeklyReview),
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

      await runAsyncTask(() => habitsClient.getWeeklyReview(weekStart), {
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
