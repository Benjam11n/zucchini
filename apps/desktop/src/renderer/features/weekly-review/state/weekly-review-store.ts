/**
 * Weekly review Zustand store.
 *
 * Manages the weekly review overview loading, individual weekly review
 * selection, and the spotlight dialog visibility. Provides actions for
 * loading the overview, selecting a specific week, and opening/closing
 * the spotlight.
 */
import { create } from "zustand";

import { loadWeeklyReviewState } from "@/renderer/features/weekly-review/lib/weekly-review-state";
import type { WeeklyReviewAsyncPhase } from "@/renderer/features/weekly-review/weekly-review.types";
import { runStoreLoad } from "@/renderer/shared/ipc/store-load-task";
import type { AppIpcError } from "@/shared/contracts/ipc/app-errors";
import type {
  WeeklyReview,
  WeeklyReviewOverview,
} from "@/shared/domain/weekly-review";

interface WeeklyReviewStoreState {
  isWeeklyReviewSpotlightOpen: boolean;
  selectedWeeklyReview: WeeklyReview | null;
  weeklyReviewError: AppIpcError | null;
  weeklyReviewOverview: WeeklyReviewOverview | null;
  weeklyReviewPhase: WeeklyReviewAsyncPhase;
  dismissWeeklyReviewSpotlight: () => void;
  loadWeeklyReviewOverview: (options?: { force?: boolean }) => Promise<void>;
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
    loadWeeklyReviewOverview: async (options = {}) => {
      const { weeklyReviewOverview, weeklyReviewPhase } = get();
      if (weeklyReviewPhase === "loading") {
        return;
      }
      if (
        !options.force &&
        weeklyReviewPhase === "ready" &&
        weeklyReviewOverview
      ) {
        return;
      }

      await runStoreLoad<
        WeeklyReviewStoreState,
        Awaited<ReturnType<typeof loadWeeklyReviewState>>
      >({
        error: (weeklyReviewError) => ({
          selectedWeeklyReview: null,
          weeklyReviewError,
          weeklyReviewOverview: null,
          weeklyReviewPhase: "error",
        }),
        loading: {
          weeklyReviewError: null,
          weeklyReviewPhase: "loading",
        },
        set,
        success: (weeklyReviewState) => ({
          selectedWeeklyReview: weeklyReviewState.selectedWeeklyReview,
          weeklyReviewError: null,
          weeklyReviewOverview: weeklyReviewState.overview,
          weeklyReviewPhase: "ready",
        }),
        task: () =>
          loadWeeklyReviewState(
            {
              getWeeklyReview: (weekStart) =>
                window.desktop.query({
                  payload: { weekStart },
                  type: "weeklyReview.get",
                }),
              getWeeklyReviewOverview: () =>
                window.desktop.query({ type: "weeklyReview.overview" }),
            },
            get().selectedWeeklyReview
          ),
      });
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

      await runStoreLoad<WeeklyReviewStoreState, WeeklyReview>({
        error: (weeklyReviewError) => ({
          weeklyReviewError,
          weeklyReviewPhase: "error",
        }),
        loading: {
          weeklyReviewError: null,
          weeklyReviewPhase: "loading",
        },
        set,
        success: (selectedWeeklyReview) => ({
          selectedWeeklyReview,
          weeklyReviewError: null,
          weeklyReviewPhase: "ready",
        }),
        task: () =>
          window.desktop.query({
            payload: { weekStart },
            type: "weeklyReview.get",
          }),
      });
    },
  })
);
